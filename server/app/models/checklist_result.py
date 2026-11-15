from sqlalchemy import (
    CheckConstraint, Column, DateTime, ForeignKey, Integer, Text,
    UniqueConstraint, func,
)

from app.core.database import Base
from app.models.incident import AuditChecklist  # noqa: F401  (FK resolve needs the class to be imported)
from app.models.scorecard import AuditCycle      # noqa: F401


class ChecklistResult(Base):
    __tablename__ = "checklist_results"
    __table_args__ = (
        UniqueConstraint("cycle_id", "checklist_id", name="uq_result_cycle_item"),
        CheckConstraint("actual >= 0", name="ck_result_actual_pos"),
        CheckConstraint("adjustable >= 0", name="ck_result_adjustable_pos"),
    )

    id = Column(Integer, primary_key=True, index=True)
    cycle_id = Column(Integer, ForeignKey("audit_cycles.id", ondelete="CASCADE"),
                      nullable=False, index=True)
    checklist_id = Column(Integer, ForeignKey("audit_checklists.id", ondelete="CASCADE"),
                          nullable=False, index=True)
    actual = Column(Integer, nullable=False, default=0)
    adjustable = Column(Integer, nullable=False, default=0)
    remark = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())