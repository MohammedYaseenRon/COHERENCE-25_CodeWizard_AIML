from pydantic import BaseModel
from typing import List, Optional

class ChatHistoryItem(BaseModel):
    role: str
    timestamp: str
    content: str
    name: str
    avatar: Optional[str] = None

class ChatHistoryPayload(BaseModel):
    conf_uid: str
    history_uid: str
    history: List[ChatHistoryItem]
    timestamp: str