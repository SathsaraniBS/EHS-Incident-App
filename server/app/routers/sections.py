import re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.checklist_result import ChecklistResult
from app.models.incident import AuditChecklist, Section
from app.models.scorecard import AuditCycle
from app.routers.auth import get_current_user, require_role
from app.schemas.section import (
    CycleIn, CycleOut, ItemIn, ItemOut, SectionDetail, SectionSummary,
)

router = APIRouter(prefix="/api/sections", tags=["sections"])
require_admin = require_role("admin")


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def get_cycle(db: Session, cycle_id: int | None) -> AuditCycle:
    cycle = db.get(AuditCycle, cycle_id) if cycle_id else (
        db.query(AuditCycle).order_by(AuditCycle.id.desc()).first()
    )
    if not cycle:
        raise HTTPException(404, "No audit cycle found. Create one first (POST /api/sections/cycles).")
    return cycle


def find_section(db: Session, slug: str) -> Section:
    for s in db.query(Section).all():          
        if slugify(s.name) == slug:
            return s
    raise HTTPException(404, "Section not found")


def save_result(db: Session, cycle_id: int, checklist_id: int, body: ItemIn):
    res = (db.query(ChecklistResult)
           .filter(ChecklistResult.cycle_id == cycle_id,
                   ChecklistResult.checklist_id == checklist_id).first())
    if res is None:
        res = ChecklistResult(cycle_id=cycle_id, checklist_id=checklist_id)
        db.add(res)
    res.actual = body.actual
    res.adjustable = body.adjustable
    res.remark = body.remark


def item_out(ck: AuditChecklist, res: ChecklistResult | None) -> ItemOut:
    return ItemOut(
        id=ck.id, category=ck.category, description=ck.description,
        allocated=ck.allocated_score,
        actual=res.actual if res else None,
        adjustable=res.adjustable if res else None,
        remark=res.remark if res else None,
        evaluated=res is not None,
    )


# ----------------------------- Cycles -----------------------------
@router.get("/cycles", response_model=list[CycleOut])
def list_cycles(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(AuditCycle).order_by(AuditCycle.id.desc()).all()


@router.post("/cycles", response_model=CycleOut, status_code=201)
def create_cycle(body: CycleIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(AuditCycle).filter(AuditCycle.label == body.label).first():
        raise HTTPException(409, "A cycle with this label already exists")
    cycle = AuditCycle(**body.model_dump())
    db.add(cycle)
    db.commit()
    db.refresh(cycle)
    return cycle


# ----------------------------- Sections -----------------------------
@router.get("", response_model=list[SectionSummary])
def list_sections(cycle_id: int | None = Query(None), db: Session = Depends(get_db),
                  user=Depends(get_current_user)):
    cycle = get_cycle(db, cycle_id)
    rows = (
        db.query(
            Section.id, Section.name, Section.responsible_person,
            func.count(AuditChecklist.id).label("total_items"),
            func.count(ChecklistResult.id).label("evaluated_items"),
            func.coalesce(func.sum(AuditChecklist.allocated_score), 0).label("allocated"),
            func.coalesce(func.sum(ChecklistResult.actual), 0).label("actual"),
            func.coalesce(func.sum(ChecklistResult.adjustable), 0).label("adjustable"),
        )
        .outerjoin(AuditChecklist, AuditChecklist.section_id == Section.id)
        .outerjoin(ChecklistResult, and_(ChecklistResult.checklist_id == AuditChecklist.id,
                                         ChecklistResult.cycle_id == cycle.id))
        .group_by(Section.id)
        .order_by(Section.id)
        .all()
    )
    return [
        SectionSummary(
            id=r.id, name=r.name, slug=slugify(r.name),
            responsible=r.responsible_person or "Not Assigned", category="",
            allocated_score=int(r.allocated), actual_score=int(r.actual),
            adjustable_score=int(r.adjustable),
            total_items=r.total_items, evaluated_items=r.evaluated_items,
        )
        for r in rows
    ]


@router.get("/{slug}", response_model=SectionDetail)
def get_section(slug: str, cycle_id: int | None = Query(None), db: Session = Depends(get_db),
                user=Depends(get_current_user)):
    cycle = get_cycle(db, cycle_id)
    sec = find_section(db, slug)
    pairs = (
        db.query(AuditChecklist, ChecklistResult)
        .outerjoin(ChecklistResult, and_(ChecklistResult.checklist_id == AuditChecklist.id,
                                         ChecklistResult.cycle_id == cycle.id))
        .filter(AuditChecklist.section_id == sec.id)
        .order_by(AuditChecklist.id)
        .all()
    )
    items = [item_out(ck, res) for ck, res in pairs]
    cats = list(dict.fromkeys(i.category for i in items if i.category))
    return SectionDetail(
        id=sec.id, name=sec.name, slug=slug,
        responsible=sec.responsible_person or "Not Assigned",
        category=" / ".join(cats[:3]),
        allocated_score=sum(i.allocated for i in items),
        actual_score=sum(i.actual or 0 for i in items),
        adjustable_score=sum(i.adjustable or 0 for i in items),
        total_items=len(items),
        evaluated_items=sum(1 for i in items if i.evaluated),
        cycle=CycleOut.model_validate(cycle),
        items=items,
    )


# ----------------------------- Items (admin) -----------------------------
@router.post("/{slug}/items", response_model=ItemOut, status_code=201)
def create_item(slug: str, body: ItemIn, cycle_id: int | None = Query(None),
                db: Session = Depends(get_db), _=Depends(require_admin)):
    cycle = get_cycle(db, cycle_id)
    sec = find_section(db, slug)
    ck = AuditChecklist(section_id=sec.id, category=body.category,
                        description=body.description, allocated_score=body.allocated)
    db.add(ck)
    db.flush()
    save_result(db, cycle.id, ck.id, body)
    db.commit()
    res = db.query(ChecklistResult).filter_by(cycle_id=cycle.id, checklist_id=ck.id).first()
    return item_out(ck, res)


@router.put("/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, body: ItemIn, cycle_id: int | None = Query(None),
                db: Session = Depends(get_db), _=Depends(require_admin)):
    cycle = get_cycle(db, cycle_id)
    ck = db.get(AuditChecklist, item_id)
    if not ck:
        raise HTTPException(404, "Item not found")
    ck.category = body.category
    ck.description = body.description
    ck.allocated_score = body.allocated
    save_result(db, cycle.id, ck.id, body)
    db.commit()
    res = db.query(ChecklistResult).filter_by(cycle_id=cycle.id, checklist_id=ck.id).first()
    return item_out(ck, res)


@router.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    ck = db.get(AuditChecklist, item_id)
    if not ck:
        raise HTTPException(404, "Item not found")
    db.delete(ck)          
    db.commit()