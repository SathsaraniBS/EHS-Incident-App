import os
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.incident import Incident, Section, AuditChecklist  # අලුත් Models මෙහි ඉම්පෝට් කර ඇත

router = APIRouter()

# Directory to store uploaded audit images
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_incident(
    section: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        image_url = None

        # Handle file upload if an image was provided
        if file:
            file_location = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            image_url = f"/{UPLOAD_DIR}/{file.filename}"

        # Create new Incident DB entry
        new_incident = Incident(
            section=section,
            description=description,
            location=location,
            image_url=image_url
        )

        db.add(new_incident)
        db.commit()
        db.refresh(new_incident)

        return {
            "status": "success",
            "message": "Audit report submitted successfully",
            "data": new_incident
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit audit report: {str(e)}"
        )

@router.get("/")
def get_all_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()
    return {"status": "success", "data": incidents}


# ==========================================
# EHS Section Audit Dashboard Endpoint
# ==========================================
@router.get("/sections/dashboard")
def get_sections_dashboard(db: Session = Depends(get_db)):
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