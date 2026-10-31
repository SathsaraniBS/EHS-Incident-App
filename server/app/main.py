import os
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Form, UploadFile, File, HTTPException, status as http_status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import Session

# Import database engine, base, and get_db from core.database
from app.core.database import Base, engine, get_db

# Import Section and AuditChecklist models for the dashboard
from app.models.incident import Section, AuditChecklist

from app.models.user import User  # noqa: F401

# NEW: JWT login router
from app.routers.auth import router as auth_router

# ------------------------------------------------------------------------------
# 1. SQLAlchemy Model
# ------------------------------------------------------------------------------
class IncidentModel(Base):
    __tablename__ = "incidents"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    section = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="Pending")
    severity = Column(String, default="Medium")
    assigned_to = Column(String, nullable=True)

# Create tables automatically if they don't exist
Base.metadata.create_all(bind=engine)

# ------------------------------------------------------------------------------
# 2. FastAPI Setup
# ------------------------------------------------------------------------------
app = FastAPI(
    title="EHS Incident & Safety Audit API",
    description="Backend API for EHS Mobile Safety Audits and Admin Web Dashboard",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NEW: /api/v1/auth/login, /api/v1/auth/me
app.include_router(auth_router)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

class IncidentResponse(BaseModel):
    id: int
    section: str
    location: str
    description: str
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    status: Optional[str] = "Pending"
    severity: Optional[str] = "Medium"
    assigned_to: Optional[str] = None

    class Config:
        from_attributes = True  # Supports Pydantic v2

class IncidentStatusUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_to: Optional[str] = None

# Email Alert Function for BSS (s209bandara@gmail.com)
def send_high_severity_alert(incident_id: int, section: str, location: str, description: str, severity: str, assigned_to: Optional[str]):
    if severity != "High":
        return
    try:
        SMTP_SERVER = "smtp.gmail.com"
        SMTP_PORT = 587
        SENDER_EMAIL = "s209bandara@gmail.com"
        SENDER_PASSWORD = "your-app-password"  # your Gmail App Password put here (not your regular Gmail password)
        RECEIVER_EMAIL = "s209bandara@gmail.com"

        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECEIVER_EMAIL
        msg['Subject'] = f"🚨 URGENT: High Severity Incident Reported! (ID: #{incident_id})"

        assigned_text = assigned_to if assigned_to else "Not Assigned Yet"

        body = f"""
        Hello BSS,

        A High Severity incident has been reported and requires immediate attention!
        
        - Incident ID: #{incident_id}
        - Section: {section}
        - Location: {location}
        - Severity: HIGH
        - Assigned To: {assigned_text}
        - Description: {description}
        
        Please check the Admin Dashboard for more details.
        """
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        # server.login(SENDER_EMAIL, SENDER_PASSWORD)
        # server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())
        server.quit()
        print("High severity alert email triggered for s209bandara@gmail.com")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")

# ------------------------------------------------------------------------------
# 3. Endpoints
# ------------------------------------------------------------------------------
@app.get("/")
async def root():
    return {"message": "EHS Safety Audit API is Running"}

@app.get("/api/v1/incidents/", response_model=List[IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    """
    Fetch all incident records from PostgreSQL database.
    """
    try:
        incidents = db.query(IncidentModel).order_by(IncidentModel.id.desc()).all()
        return incidents
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error: {str(e)}"
        )

@app.post("/api/v1/incidents/", status_code=http_status.HTTP_201_CREATED, response_model=IncidentResponse)
async def create_incident(
    section: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    severity: str = Form("Medium"),
    assigned_to: Optional[str] = Form(None), # Mobile Form Responsible Person
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Save new incident record directly to PostgreSQL with severity, assigned_to and trigger email if High.
    """
    try:
        image_url = None
        if image and image.filename:
            file_path = os.path.join("uploads", image.filename)
            with open(file_path, "wb") as buffer:
                buffer.write(await image.read())
            image_url = f"/uploads/{image.filename}"

        db_incident = IncidentModel(
            section=section,
            location=location,
            description=description,
            severity=severity,
            assigned_to=assigned_to,
            image_url=image_url,
            status="Pending"
        )
        db.add(db_incident)
        db.commit()
        db.refresh(db_incident)

        # Trigger High Severity Email Alert
        if severity == "High":
            send_high_severity_alert(db_incident.id, section, location, description, severity, assigned_to)

        return db_incident
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving incident: {str(e)}"
        )

@app.patch("/api/v1/incidents/{incident_id}/status")
def update_incident_status(incident_id: int, payload: IncidentStatusUpdate, db: Session = Depends(get_db)):
    """
    Update incident status, severity, and assigned person from Admin Dashboard.
    """
    incident = db.query(IncidentModel).filter(IncidentModel.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if payload.status:
        incident.status = payload.status
    if payload.severity:
        incident.severity = payload.severity
    if payload.assigned_to is not None:
        incident.assigned_to = payload.assigned_to
        
    db.commit()
    db.refresh(incident)
    return {"message": "Incident updated successfully", "incident": incident}

# ------------------------------------------------------------------------------
# 4. Section Audit Dashboard Endpoint
# ------------------------------------------------------------------------------
@app.get("/api/v1/sections/dashboard")
def get_sections_dashboard(db: Session = Depends(get_db)):
    try:
        sections = db.query(Section).all()
        dashboard_data = []

        for sec in sections:
            checklists = db.query(AuditChecklist).filter(AuditChecklist.section_id == sec.id).all()
            total_allocated = sum(item.allocated_score for item in checklists)
            total_items = len(checklists)

            dashboard_data.append({
                "id": sec.id,
                "name": sec.name,
                "responsible_person": sec.responsible_person or "Not Assigned",
                "total_items": total_items,
                "allocated_score": total_allocated,
                "actual_score": 0,
                "score_percentage": 0.0 
            })

        return {
            "status": "success",
            "total_sections": len(dashboard_data),
            "sections": dashboard_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching sections dashboard: {str(e)}"
        )