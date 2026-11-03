# server/app/models/compliance.py
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    audit_code = Column(String(40), unique=True, index=True, nullable=False)
    factory_name = Column(String(160), nullable=False)
    audit_type = Column(String(120), nullable=False)
    auditor_name = Column(String(120), nullable=True)
    scheduled_date = Column(Date, nullable=False)
    actual_start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="Scheduled")  # Scheduled | In Progress | Closed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    nc_report = relationship(
        "NCReport", back_populates="audit", uselist=False, cascade="all, delete-orphan"
    )


class NCReport(Base):
    __tablename__ = "nc_reports"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(
        Integer, ForeignKey("audits.id", ondelete="CASCADE"), unique=True, nullable=False
    )  
    raised_on = Column(Date, nullable=True)
    acknowledged_on = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="Pending")  # Pending | NC Sent | Acknowledged | Closed
    progress = Column(Integer, nullable=False, default=0)  # 0-100
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    audit = relationship("Audit", back_populates="nc_report")