from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: str = Field(default="", max_length=5000)
    tags: list[str] = Field(default_factory=list, max_length=10)


class ReviewRead(BaseModel):
    id: str
    rating: int
    text: str
    tags: list[str] = Field(default_factory=list)
    created_at: str
    display_name: str
    avatar_url: str | None
