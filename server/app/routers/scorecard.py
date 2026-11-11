# server/app/routers/scorecard.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.scorecard import AuditCycle, SectionScore
from app.routers.auth import require_role

router = APIRouter(
    prefix="/api/v1/scorecard",
    tags=["HSE Scorecard"],
    dependencies=[Depends(require_role("admin"))],
)


# ---------- schemas ----------
class CycleOut(BaseModel):
    id: int
    label: str


class ScoreRow(BaseModel):
    id: int
    no: int
    section_id: int | None
    section: str
    responsible: str
    allocated: int
    actual: int
    adjustable: int


class ScorecardOut(BaseModel):
    cycle: CycleOut
    sections: list[ScoreRow]


class ScoreUpdate(BaseModel):
    actual: int | None = Field(default=None, ge=0)
    adjustable: int | None = Field(default=None, ge=0)


def _row(s: SectionScore) -> ScoreRow:
    return ScoreRow(
        id=s.id,
        no=s.sort_no,
        section_id=s.section_id,
        section=s.section_name,
        responsible=s.responsible_name or "",
        allocated=s.allocated,
        actual=s.actual,
        adjustable=s.adjustable,
    )


# ---------- endpoints ----------
@router.get("/cycles", response_model=list[CycleOut])
def list_cycles(db: Session = Depends(get_db)):
    cycles = db.query(AuditCycle).order_by(AuditCycle.id.desc()).all()
    return [CycleOut(id=c.id, label=c.label) for c in cycles]


@router.get("", response_model=ScorecardOut)
def get_scorecard(
    cycle_id: int | None = Query(default=None, description="Defaults to the latest cycle"),
    db: Session = Depends(get_db),
):
    if cycle_id is None:
        cycle = db.query(AuditCycle).order_by(AuditCycle.id.desc()).first()
    else:
        cycle = db.query(AuditCycle).filter(AuditCycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No scorecard data found. Run seed_scorecard.py first.")

    rows = (
        db.query(SectionScore)
        .filter(SectionScore.cycle_id == cycle.id)
        .order_by(SectionScore.sort_no)
        .all()
    )
    return ScorecardOut(
        cycle=CycleOut(id=cycle.id, label=cycle.label),
        sections=[_row(r) for r in rows],
    )


@router.patch("/scores/{score_id}", response_model=ScoreRow)
def update_score(score_id: int, payload: ScoreUpdate, db: Session = Depends(get_db)):
    score = db.query(SectionScore).filter(SectionScore.id == score_id).first()
    if not score:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Score row not found")

    data = payload.model_dump(exclude_unset=True)
    for key in ("actual", "adjustable"):
        if key in data and data[key] is None:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{key} cannot be empty")
        if key in data and data[key] > score.allocated:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"{key} ({data[key]}) cannot be more than allocated ({score.allocated})",
            )

    for key, value in data.items():
        setattr(score, key, value)
    db.commit()
    db.refresh(score)
    return _row(score)