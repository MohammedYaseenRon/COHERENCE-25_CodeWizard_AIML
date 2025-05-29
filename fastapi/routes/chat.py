from fastapi.routing import APIRouter
from models.chat import ChatHistoryPayload, ChatHistoryItem
from services.chat_service import ChatService

router = APIRouter()
service = ChatService()

@router.post("/update_chat_history")
async def update_chat_history(payload: ChatHistoryPayload):
    """
    Updates or saves chat history based on the received payload.
    """
    chat_history = service.load_chat_history()
    history_key = f"{payload.conf_uid}_{payload.history_uid}"
    
    chat_history[history_key] = {
        "conf_uid": payload.conf_uid,
        "history_uid": payload.history_uid,
        "history": [item.model_dump() for item in payload.history],
        "timestamp": payload.timestamp,
    }

    service.save_chat_history(chat_history)
    return {"message": "Chat history updated successfully"}

@router.get("/get_chat_history")
async def get_chat_history():
    """
    Retrieves chat history.
    """
    chat_history = service.load_chat_history()
    return chat_history