from sqlalchemy import (
    Boolean, CheckConstraint, Column, Date, DateTime, ForeignKey,
    Integer, String, Text, func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class AuditSection(Base):
    __tablename__ = "audit_sections"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), nullable=False, unique=True, index=True)
    responsible = Column(String(100), nullable=False)
    category = Column(String(200), nullable=False)
    display_order = Column(Integer, nullable=False, default=0)

    items = relationship("ChecklistItem", back_populates="section", cascade="all, delete-orphan")


class AuditPeriod(Base):
    __tablename__ = "audit_periods"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, default=False)


class ChecklistItem(Base):
    __tablename__ = "section_checklist_items"
    __table_args__ = (
        CheckConstraint("allocated >= 0", name="ck_item_allocated_pos"),
        CheckConstraint("actual >= 0 AND actual <= allocated", name="ck_item_actual_range"),
        CheckConstraint("adjustable >= 0 AND adjustable <= allocated", name="ck_item_adjustable_range"),
    )

    id = Column(Integer, primary_key=True)
    section_id = Column(Integer, ForeignKey("audit_sections.id", ondelete="CASCADE"), nullable=False, index=True)
    period_id = Column(Integer, ForeignKey("audit_periods.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    allocated = Column(Integer, nullable=False)
    actual = Column(Integer, nullable=False, default=0)
    adjustable = Column(Integer, nullable=False, default=0)
    remark = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    section = relationship("AuditSection", back_populates="items")