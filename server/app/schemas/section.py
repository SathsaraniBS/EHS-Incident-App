from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CycleIn(BaseModel):
    label: str = Field(min_length=3, max_length=80)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CycleOut(CycleIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ItemIn(BaseModel):
    category: Optional[str] = Field(default=None, max_length=255)
    description: str = Field(min_length=3, max_length=2000)
    allocated: int = Field(ge=0, le=1000)
    actual: int = Field(ge=0)
    adjustable: int = Field(ge=0)
    remark: Optional[str] = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def check_scores(self):
        if self.actual > self.allocated:
            raise ValueError("Actual cannot be greater than Allocated")
        if self.adjustable > self.allocated:
            raise ValueError("Adjustable cannot be greater than Allocated")
        return self


class ItemOut(BaseModel):
    id: int
    category: Optional[str] = None
    description: str
    allocated: int
    actual: Optional[int] = None       # None = මේ cycle එකේ තවම evaluate කරලා නැහැ
    adjustable: Optional[int] = None
    remark: Optional[str] = None
    evaluated: bool


class SectionSummary(BaseModel):
    id: int
    name: str
    slug: str
    responsible: str
    category: str
    allocated_score: int
    actual_score: int
    adjustable_score: int
    total_items: int
    evaluated_items: int


class SectionDetail(SectionSummary):
    cycle: CycleOut
    items: List[ItemOut]