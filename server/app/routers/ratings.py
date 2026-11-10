"""Read-only Rating System API.

Register it in app/main.py:

    from app.rating.router import router as rating_router
    app.include_router(rating_router)

NOTE: adjust the single `get_db` import below to match your project
(open any existing router and copy how it gets the DB session).
"""
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.database import SessionLocal
from app.rating.models import HseCategory, RatingRule, SeverityLevel


def get_db():  # replace with: from app.database import get_db   (if you already have one)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(prefix="/rating", tags=["rating"])


class SeverityOut(BaseModel):
    id: int
    code: str
    level: int
    marks: int

    model_config = {"from_attributes": True}


class CategoryOut(BaseModel):
    id: int
    number: int
    name: str

    model_config = {"from_attributes": True}


class RuleOut(BaseModel):
    id: int
    rule_code: str
    description: str
    needs_review: bool
    category: CategoryOut
    severity: SeverityOut

    model_config = {"from_attributes": True}


@router.get("/severities", response_model=List[SeverityOut])
def list_severities(db: Session = Depends(get_db)):
    return db.query(SeverityLevel).order_by(SeverityLevel.level.desc()).all()


@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(HseCategory).order_by(HseCategory.number).all()


@router.get("/rules", response_model=List[RuleOut])
def list_rules(
    category_id: Optional[int] = None,
    severity_id: Optional[int] = None,
    q: Optional[str] = Query(None, description="search text inside the rule description"),
    limit: int = Query(200, le=500),
    db: Session = Depends(get_db),
):
    query = (
        db.query(RatingRule)
        .options(joinedload(RatingRule.category), joinedload(RatingRule.severity))
        .filter(RatingRule.is_active.is_(True))
    )
    if category_id:
        query = query.filter(RatingRule.category_id == category_id)
    if severity_id:
        query = query.filter(RatingRule.severity_id == severity_id)
    if q:
        query = query.filter(RatingRule.description.ilike(f"%{q}%"))
    return query.order_by(RatingRule.category_id, RatingRule.severity_id.desc(), RatingRule.id).limit(limit).all()


@router.get("/matrix")
def matrix(db: Session = Depends(get_db)) -> Dict:
    """Same shape as the Excel sheet: category -> severity -> [rules]."""
    severities = db.query(SeverityLevel).order_by(SeverityLevel.level.desc()).all()
    categories = db.query(HseCategory).order_by(HseCategory.number).all()
    rules = db.query(RatingRule).filter(RatingRule.is_active.is_(True)).order_by(RatingRule.id).all()
    grid: Dict[int, Dict[int, list]] = {c.id: {s.id: [] for s in severities} for c in categories}
    for r in rules:
        grid[r.category_id][r.severity_id].append({"id": r.id, "rule_code": r.rule_code, "description": r.description})
    return {
        "severities": [SeverityOut.model_validate(s).model_dump() for s in severities],
        "categories": [
            {**CategoryOut.model_validate(c).model_dump(), "cells": {str(sid): items for sid, items in grid[c.id].items()}}
            for c in categories
        ],
    }
