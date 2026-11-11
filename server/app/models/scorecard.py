# server/app/models/scorecard.py
"""HSE Scorecard tables.

One AuditCycle = one reporting period (e.g. "1st & 2nd Week, November 2026").
One SectionScore = one row of the workbook's Dashboard sheet for that cycle.

Only the three raw marks are stored (allocated / actual / adjustable).
Percentages are always calculated, never stored, so they cannot go stale.
"""
from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.incident import Section


class AuditCycle(Base):
    __tablename__ = "audit_cycles"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(80), unique=True, nullable=False)  # "1st & 2nd Week, November 2026"
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    scores = relationship(
        "SectionScore",
        back_populates="cycle",
        cascade="all, delete-orphan",
        order_by="SectionScore.sort_no",
    )


class SectionScore(Base):
    __tablename__ = "section_scores"
    __table_args__ = (
        UniqueConstraint("cycle_id", "sort_no", name="uq_section_scores_cycle_no"),
        UniqueConstraint("cycle_id", "section_name", name="uq_section_scores_cycle_section"),
        CheckConstraint("allocated >= 0", name="ck_section_scores_allocated"),
        CheckConstraint("actual >= 0 AND actual <= allocated", name="ck_section_scores_actual"),
        CheckConstraint("adjustable >= 0 AND adjustable <= allocated", name="ck_section_scores_adjustable"),
    )

    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(
        Integer, ForeignKey("audit_cycles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sort_no = Column(Integer, nullable=False)  # "No" column of the Dashboard sheet
    section_name = Column(String(160), nullable=False)
    responsible_name = Column(String(120), nullable=False, default="")

    # Optional link to the Sections Audit page's Section row (matched by name in the seed script).
    section_id = Column(Section.id.type, ForeignKey(Section.id, ondelete="SET NULL"), nullable=True, index=True)

    allocated = Column(Integer, nullable=False)
    actual = Column(Integer, nullable=False)
    adjustable = Column(Integer, nullable=False)

    cycle = relationship("AuditCycle", back_populates="scores")