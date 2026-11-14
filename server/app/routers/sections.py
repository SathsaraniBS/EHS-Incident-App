from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.section import AuditPeriod, AuditSection, ChecklistItem
from app.routers.auth import get_current_user, require_role
from app.schemas.section import ItemIn, ItemOut, SectionDetail, SectionSummary

router = APIRouter(prefix="/api/sections", tags=["sections"])

require_admin = require_role("admin")


def resolve_period(db: Session, period_id: int | None) -> AuditPeriod:
    if period_id:
        period = db.get(AuditPeriod, period_id)
    else:
        period = db.query(AuditPeriod).filter(AuditPeriod.is_active.is_(True)).first()
    if not period:
        raise HTTPException(404, "No active audit period")
    return period


def totals_query(db: Session, period_id: int):
    return (
        db.query(
            AuditSection.id,
            AuditSection.name,
            AuditSection.slug,
            AuditSection.responsible,
            AuditSection.category,
            func.coalesce(func.sum(ChecklistItem.allocated), 0).label("allocated_score"),
            func.coalesce(func.sum(ChecklistItem.actual), 0).label("actual_score"),
            func.coalesce(func.sum(ChecklistItem.adjustable), 0).label("adjustable_score"),
        )
        .outerjoin(
            ChecklistItem,
            and_(
                ChecklistItem.section_id == AuditSection.id,
                ChecklistItem.period_id == period_id,
            ),
        )
        .group_by(AuditSection.id)
        .order_by(AuditSection.display_order, AuditSection.id)
    )


@router.get("", response_model=list[SectionSummary])
def list_sections(
    period_id: int | None = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    period = resolve_period(db, period_id)
    rows = totals_query(db, period.id).all()
    return [
        SectionSummary(
            id=r.id,
            name=r.name,
            slug=r.slug,
            responsible=r.responsible,
            category=r.category,
            allocated_score=int(r.allocated_score),
            actual_score=int(r.actual_score),
            adjustable_score=int(r.adjustable_score),
        )
        for r in rows
    ]


@router.get("/{slug}", response_model=SectionDetail)
def get_section(
    slug: str,
    period_id: int | None = Query(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    period = resolve_period(db, period_id)
    row = totals_query(db, period.id).filter(AuditSection.slug == slug).first()
    if not row:
        raise HTTPException(404, "Section not found")

    items = (
        db.query(ChecklistItem)
        .filter(ChecklistItem.section_id == row.id, ChecklistItem.period_id == period.id)
        .order_by(ChecklistItem.id)
        .all()
    )
    return SectionDetail(
        id=row.id,
        name=row.name,
        slug=row.slug,
        responsible=row.responsible,
        category=row.category,
        allocated_score=int(row.allocated_score),
        actual_score=int(row.actual_score),
        adjustable_score=int(row.adjustable_score),
        items=[ItemOut.model_validate(i) for i in items],
    )


@router.post("/{slug}/items", response_model=ItemOut, status_code=201)
def create_item(
    slug: str,
    body: ItemIn,
    period_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    section = db.query(AuditSection).filter(AuditSection.slug == slug).first()
    if not section:
        raise HTTPException(404, "Section not found")
    period = resolve_period(db, period_id)
    item = ChecklistItem(section_id=section.id, period_id=period.id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=ItemOut)
def update_item(
    item_id: int,
    body: ItemIn,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    item = db.get(ChecklistItem, item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    for k, v in body.model_dump().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    item = db.get(ChecklistItem, item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    db.delete(item)
    db.commit()