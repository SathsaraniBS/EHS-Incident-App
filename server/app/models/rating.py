"""Rating System reference tables.

These three tables replace the "Rating System" sheet of the HSE audit workbook:

    severity_levels  -> CAT 03..06 and their marks (the lookup table)
    hse_categories   -> the 14 HSE categories
    rating_rules     -> every non-conformance sentence, tied to one category + one severity

NOTE: adjust the single import below if your project exposes Base elsewhere
(look at how an existing model file imports it).
"""
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class SeverityLevel(Base):
    __tablename__ = "severity_levels"

    id = Column(Integer, primary_key=True)
    code = Column(String(8), unique=True, nullable=False)   # "CAT06"
    level = Column(Integer, unique=True, nullable=False)    # 6
    marks = Column(Integer, nullable=False)                 # 20

    rules = relationship("RatingRule", back_populates="severity")


class HseCategory(Base):
    __tablename__ = "hse_categories"

    id = Column(Integer, primary_key=True)
    number = Column(Integer, unique=True, nullable=False)   # 1..14 (column A of the sheet)
    name = Column(String(120), unique=True, nullable=False)

    rules = relationship("RatingRule", back_populates="category")


class RatingRule(Base):
    __tablename__ = "rating_rules"
    __table_args__ = (
        UniqueConstraint("category_id", "severity_id", "description", name="uq_rating_rule"),
    )

    id = Column(Integer, primary_key=True)
    rule_code = Column(String(24), unique=True, nullable=False)  # e.g. R07-CAT06-01
    category_id = Column(Integer, ForeignKey("hse_categories.id"), nullable=False, index=True)
    severity_id = Column(Integer, ForeignKey("severity_levels.id"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    # Heuristic flag set by the importer: text is not phrased as a violation
    # (e.g. "Fire safety sign boards displayed in each areas"). A human should review it.
    needs_review = Column(Boolean, nullable=False, default=False)

    category = relationship("HseCategory", back_populates="rules")
    severity = relationship("SeverityLevel", back_populates="rules")
