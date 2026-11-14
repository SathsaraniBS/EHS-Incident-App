from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class ItemIn(BaseModel):
    description: str = Field(min_length=3, max_length=1000)
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


class ItemOut(ItemIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SectionSummary(BaseModel):
    id: int
    name: str
    slug: str
    responsible: str
    category: str
    allocated_score: int
    actual_score: int
    adjustable_score: int


class SectionDetail(SectionSummary):
    items: List[ItemOut]