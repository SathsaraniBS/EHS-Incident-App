import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional
from uuid import uuid4

from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
    status as http_status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Session

# Database engine, base, and session dependency
from app.core.database import Base, engine, get_db

# Existing models (imported so create_all can build their tables)
from app.models.incident import Section, AuditChecklist
from app.models.user import User  # noqa: F401
from app.models.compliance import Audit, NCReport  # noqa: F401
from app.models.rating import SeverityLevel, HseCategory, RatingRule  # noqa: F401
from app.models.scorecard import AuditCycle, SectionScore  # noqa: F401

# NEW: sections audit models (audit_sections, audit_periods, section_checklist_items)
from app.models import section as section_models  # noqa: F401

# Routers
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.compliance import router as compliance_router
from app.routers.ratings import router as ratings_router
from app.routers.scorecard import router as scorecard_router
from app.routers.sections import router as sections_router  # NEW


# ------------------------------------------------------------------------------
# 1. SQLAlchemy Model
# ------------------------------------------------------------------------------
class IncidentModel(Base):
    __tablename__ = "incidents"
    __table_args__ = {"extend_existing": True}

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
# (must stay AFTER all model imports above)
Base.metadata.create_all(bind=engine)

# ------------------------------------------------------------------------------
# 2. FastAPI Setup
# ------------------------------------------------------------------------------
app = FastAPI(
    title="EHS Incident & Safety Audit API",
    description="Backend API for EHS Mobile Safety Audits and Admin Web Dashboard",
    version="1.0.0",
)

# CORS: "*" together with allow_credentials=True is rejected by browsers.
# Use explicit origins. Override in production with CORS_ORIGINS="https://a.com,https://b.com"
_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(compliance_router)
app.include_router(ratings_router)
app.include_router(scorecard_router)
app.include_router(sections_router)  # NEW: /api/sections ...

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Image upload rules
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
CONTENT_TYPE_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    section: str
    location: str
    description: str
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    status: Optional[str] = "Pending"
    severity: Optional[str] = "Medium"
    assigned_to: Optional[str] = None


class IncidentStatusUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_to: Optional[str] = None


# ------------------------------------------------------------------------------
# Email alert (credentials come from environment variables, never from code)
#   SMTP_USER, SMTP_PASSWORD (Gmail App Password), ALERT_RECEIVER (optional)
# ------------------------------------------------------------------------------
def send_high_severity_alert(
    incident_id: int,
    section: str,
    location: str,
    description: str,
    severity: str,
    assigned_to: Optional[str],
):
    if severity != "High":
        return

    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    sender = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    receiver = os.getenv("ALERT_RECEIVER", sender)

    if not sender or not password or not receiver:
        print("Email alert skipped: SMTP_USER / SMTP_PASSWORD not configured")
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = sender
        msg["To"] = receiver
        msg["Subject"] = f"URGENT: High Severity Incident Reported! (ID: #{incident_id})"

        body = f"""
Hello BSS,

A High Severity incident has been reported and requires immediate attention!

- Incident ID: #{incident_id}
- Section: {section}
- Location: {location}
- Severity: HIGH
- Assigned To: {assigned_to or "Not Assigned Yet"}
- Description: {description}

Please check the Admin Dashboard for more details.
"""
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(sender, password)
            server.send_message(msg)
        print(f"High severity alert email sent for incident #{incident_id}")
    except Exception as e:  # never let email problems break incident creation
        print(f"Failed to send email: {e}")


# ------------------------------------------------------------------------------
# 3. Endpoints
# ------------------------------------------------------------------------------
@app.get("/")
async def root():
    return {"message": "EHS Safety Audit API is Running"}


@app.get("/api/v1/incidents/", response_model=List[IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    """Fetch all incident records from PostgreSQL database."""
    try:
        return db.query(IncidentModel).order_by(IncidentModel.id.desc()).all()
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error: {str(e)}",
        )


@app.post("/api/v1/incidents/", status_code=http_status.HTTP_201_CREATED, response_model=IncidentResponse)
async def create_incident(
    background_tasks: BackgroundTasks,
    section: str = Form(...),
    location: str = Form(...),
    description: str = Form(...),
    severity: str = Form("Medium"),
    assigned_to: Optional[str] = Form(None),  # Mobile form responsible person
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """Save a new incident; send an email in the background if severity is High."""
    # ---- Validate & store image safely ----
    image_url = None
    if image and image.filename:
        ext = os.path.splitext(image.filename)[1].lower()
        if ext not in ALLOWED_EXTS:
            ext = CONTENT_TYPE_TO_EXT.get(image.content_type or "", "")
        if ext not in ALLOWED_EXTS:
            raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP or GIF images are allowed")

        content = await image.read()
        if len(content) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Image is too large (max 10 MB)")

        # Random name: prevents path traversal and overwriting other people's files
        saved_name = f"{uuid4().hex}{ext}"
        with open(os.path.join(UPLOAD_DIR, saved_name), "wb") as buffer:
            buffer.write(content)
        image_url = f"/uploads/{saved_name}"

    # ---- Save to DB ----
    try:
        db_incident = IncidentModel(
            section=section,
            location=location,
            description=description,
            severity=severity,
            assigned_to=assigned_to,
            image_url=image_url,
            status="Pending",
        )
        db.add(db_incident)
        db.commit()
        db.refresh(db_incident)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving incident: {str(e)}",
        )

    if severity == "High":
        background_tasks.add_task(
            send_high_severity_alert,
            db_incident.id, section, location, description, severity, assigned_to,
        )

    return db_incident


@app.patch("/api/v1/incidents/{incident_id}/status")
def update_incident_status(incident_id: int, payload: IncidentStatusUpdate, db: Session = Depends(get_db)):
    """Update incident status, severity, and assigned person from Admin Dashboard."""
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
# 4. Section Audit Dashboard Endpoint (legacy, kept for existing clients)
#    New sections audit API lives in app/routers/sections.py (/api/sections)
# ------------------------------------------------------------------------------
@app.get("/api/v1/sections/dashboard")
def get_sections_dashboard(db: Session = Depends(get_db)):
    try:
        # One aggregate query instead of one query per section (N+1)
        rows = (
            db.query(
                Section.id,
                Section.name,
                Section.responsible_person,
                func.count(AuditChecklist.id).label("total_items"),
                func.coalesce(func.sum(AuditChecklist.allocated_score), 0).label("allocated_score"),
            )
            .outerjoin(AuditChecklist, AuditChecklist.section_id == Section.id)
            .group_by(Section.id, Section.name, Section.responsible_person)
            .order_by(Section.id)
            .all()
        )

        dashboard_data = [
            {
                "id": r.id,
                "name": r.name,
                "responsible_person": r.responsible_person or "Not Assigned",
                "total_items": r.total_items,
                "allocated_score": int(r.allocated_score),
                "actual_score": 0,
                "score_percentage": 0.0,
            }
            for r in rows
        ]

        return {
            "status": "success",
            "total_sections": len(dashboard_data),
            "sections": dashboard_data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching sections dashboard: {str(e)}",
        )