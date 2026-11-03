# server/app/routers/compliance.py
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.compliance import Audit, NCReport
from app.routers.auth import require_role

router = APIRouter(
    prefix="/api/v1/compliance",
    tags=["Compliance"],
    dependencies=[Depends(require_role("admin"))],
)

AUDIT_STATUSES = ("Scheduled", "In Progress", "Closed")
NC_STATUSES = ("Pending", "NC Sent", "Acknowledged", "Closed")
AUDIT_REQUIRED = ("audit_code", "factory_name", "audit_type", "scheduled_date", "status")


# ---------- helpers ----------
def _one_of(value: str, allowed: tuple, label: str) -> str:
    if value not in allowed:
        raise ValueError(f"{label} must be one of: {', '.join(allowed)}")
    return value


def _required_text(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Value is required")
    return value


def _check_dates(start: date | None, end: date | None) -> None:
    if start and end and end < start:
        raise ValueError("End date cannot be before start date")


# ---------- Audit schemas ----------
class AuditCreate(BaseModel):
    audit_code: str = Field(min_length=1, max_length=40)
    factory_name: str = Field(min_length=1, max_length=160)
    audit_type: str = Field(min_length=1, max_length=120)
    auditor_name: str | None = Field(default=None, max_length=120)
    scheduled_date: date
    actual_start_date: date | None = None
    end_date: date | None = None
    status: str = "Scheduled"

    @field_validator("audit_code", "factory_name", "audit_type")
    @classmethod
    def _text(cls, v: str) -> str:
        return _required_text(v)

    @field_validator("auditor_name")
    @classmethod
    def _auditor(cls, v):
        if v is None:
            return None
        v = v.strip()
        return v or None

    @field_validator("status")
    @classmethod
    def _status(cls, v: str) -> str:
        return _one_of(v, AUDIT_STATUSES, "Status")

    @model_validator(mode="after")
    def _dates(self):
        _check_dates(self.actual_start_date, self.end_date)
        return self


class AuditUpdate(BaseModel):
    audit_code: str | None = Field(default=None, max_length=40)
    factory_name: str | None = Field(default=None, max_length=160)
    audit_type: str | None = Field(default=None, max_length=120)
    auditor_name: str | None = Field(default=None, max_length=120)
    scheduled_date: date | None = None
    actual_start_date: date | None = None
    end_date: date | None = None
    status: str | None = None

    @field_validator("audit_code", "factory_name", "audit_type")
    @classmethod
    def _text(cls, v):
        return _required_text(v) if v is not None else v

    @field_validator("auditor_name")
    @classmethod
    def _auditor(cls, v):
        if v is None:
            return None
        v = v.strip()
        return v or None

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        return _one_of(v, AUDIT_STATUSES, "Status") if v is not None else v


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    audit_code: str
    factory_name: str
    audit_type: str
    auditor_name: str | None
    scheduled_date: date
    actual_start_date: date | None
    end_date: date | None
    status: str


# ---------- NC schemas ----------
class NCCreate(BaseModel):
    audit_id: int
    raised_on: date | None = None
    acknowledged_on: date | None = None
    status: str = "Pending"
    progress: int = Field(default=0, ge=0, le=100)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("status")
    @classmethod
    def _status(cls, v: str) -> str:
        return _one_of(v, NC_STATUSES, "Status")


class NCUpdate(BaseModel):
    raised_on: date | None = None
    acknowledged_on: date | None = None
    status: str | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("status")
    @classmethod
    def _status(cls, v):
        return _one_of(v, NC_STATUSES, "Status") if v is not None else v


class NCOut(BaseModel):
    id: int
    audit_id: int
    audit_code: str
    factory_name: str
    audit_type: str
    audit_status: str
    scheduled_date: date
    actual_start_date: date | None
    end_date: date | None
    raised_on: date | None
    acknowledged_on: date | None
    status: str
    progress: int
    notes: str | None


class SummaryOut(BaseModel):
    pending_nc_count: int
    pending_audits_count: int
    open_nc_count: int
    last_audited_date: date | None
    pending_ncs: list[NCOut]
    recent_acknowledged: list[NCOut]


def nc_out(nc: NCReport) -> NCOut:
    a = nc.audit
    return NCOut(
        id=nc.id,
        audit_id=nc.audit_id,
        audit_code=a.audit_code,
        factory_name=a.factory_name,
        audit_type=a.audit_type,
        audit_status=a.status,
        scheduled_date=a.scheduled_date,
        actual_start_date=a.actual_start_date,
        end_date=a.end_date,
        raised_on=nc.raised_on,
        acknowledged_on=nc.acknowledged_on,
        status=nc.status,
        progress=nc.progress,
        notes=nc.notes,
    )


# ---------- Summary (Dashboard) ----------
@router.get("/summary", response_model=SummaryOut)
def summary(db: Session = Depends(get_db)):
    open_filter = NCReport.status != "Closed"

    pending_q = (
        db.query(NCReport)
        .options(joinedload(NCReport.audit))
        .filter(NCReport.acknowledged_on.is_(None), open_filter)
        .order_by(NCReport.id.desc())
    )
    pending = pending_q.all()

    recent = (
        db.query(NCReport)
        .options(joinedload(NCReport.audit))
        .filter(NCReport.acknowledged_on.isnot(None))
        .order_by(NCReport.acknowledged_on.desc(), NCReport.id.desc())
        .limit(10)
        .all()
    )

    pending_audits = (
        db.query(Audit).filter(Audit.status.in_(("Scheduled", "In Progress"))).count()
    )
    open_nc = db.query(NCReport).filter(NCReport.progress < 100, open_filter).count()
    last_audited = (
        db.query(func.max(Audit.end_date)).filter(Audit.status == "Closed").scalar()
    )

    return SummaryOut(
        pending_nc_count=len(pending),
        pending_audits_count=pending_audits,
        open_nc_count=open_nc,
        last_audited_date=last_audited,
        pending_ncs=[nc_out(n) for n in pending],
        recent_acknowledged=[nc_out(n) for n in recent],
    )


# ---------- Audits ----------
@router.get("/audits", response_model=list[AuditOut])
def list_audits(db: Session = Depends(get_db)):
    return db.query(Audit).order_by(Audit.scheduled_date.desc(), Audit.id.desc()).all()


@router.post("/audits", response_model=AuditOut, status_code=status.HTTP_201_CREATED)
def create_audit(payload: AuditCreate, db: Session = Depends(get_db)):
    if db.query(Audit).filter(Audit.audit_code == payload.audit_code).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An audit with this Audit ID already exists")
    audit = Audit(**payload.model_dump())
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit


@router.patch("/audits/{audit_id}", response_model=AuditOut)
def update_audit(audit_id: int, payload: AuditUpdate, db: Session = Depends(get_db)):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Audit not found")

    data = payload.model_dump(exclude_unset=True)  # null යවපු fields (dates clear කරන්න) තියාගන්නවා
    for key in AUDIT_REQUIRED:
        if key in data and data[key] is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{key} cannot be empty")

    new_start = data.get("actual_start_date", audit.actual_start_date)
    new_end = data.get("end_date", audit.end_date)
    try:
        _check_dates(new_start, new_end)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    new_code = data.get("audit_code")
    if new_code and new_code != audit.audit_code:
        clash = db.query(Audit).filter(Audit.audit_code == new_code, Audit.id != audit.id).first()
        if clash:
            raise HTTPException(status.HTTP_409_CONFLICT, "An audit with this Audit ID already exists")

    for key, value in data.items():
        setattr(audit, key, value)
    db.commit()
    db.refresh(audit)
    return audit


@router.delete("/audits/{audit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_audit(audit_id: int, db: Session = Depends(get_db)):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Audit not found")
    db.delete(audit)  
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- NC reports ----------
@router.get("/nc", response_model=list[NCOut])
def list_ncs(db: Session = Depends(get_db)):
    rows = (
        db.query(NCReport)
        .options(joinedload(NCReport.audit))
        .order_by(NCReport.id.desc())
        .all()
    )
    return [nc_out(n) for n in rows]


@router.post("/nc", response_model=NCOut, status_code=status.HTTP_201_CREATED)
def create_nc(payload: NCCreate, db: Session = Depends(get_db)):
    if not db.query(Audit).filter(Audit.id == payload.audit_id).first():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Audit not found")
    if db.query(NCReport).filter(NCReport.audit_id == payload.audit_id).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "This audit already has an NC report")
    nc = NCReport(**payload.model_dump())
    db.add(nc)
    db.commit()
    db.refresh(nc)
    return nc_out(nc)


@router.patch("/nc/{nc_id}", response_model=NCOut)
def update_nc(nc_id: int, payload: NCUpdate, db: Session = Depends(get_db)):
    nc = db.query(NCReport).options(joinedload(NCReport.audit)).filter(NCReport.id == nc_id).first()
    if not nc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "NC report not found")

    data = payload.model_dump(exclude_unset=True)
    for key in ("status", "progress"):
        if key in data and data[key] is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{key} cannot be empty")
    for key, value in data.items():
        setattr(nc, key, value)
    db.commit()
    db.refresh(nc)
    return nc_out(nc)


@router.delete("/nc/{nc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nc(nc_id: int, db: Session = Depends(get_db)):
    nc = db.query(NCReport).filter(NCReport.id == nc_id).first()
    if not nc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "NC report not found")
    db.delete(nc)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)