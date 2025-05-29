from fastapi.routing import APIRouter
from services.chat_service import ChatService
from utils.response import clean_json_response
from services.gemini_service import GeminiService

router = APIRouter()
service = ChatService()

@router.post("/analyze_interview")
async def analyze_interview(history_uid: str|None = None):
    """
    Analyzes interview chat histories directly from stored data using Gemini.
    """
    chat_history = service.load_chat_history()
    
    all_messages = []
    
    if history_uid:
        for key, data in chat_history.items():
            if history_uid in key:
                for message in data.get("history", []):
                    all_messages.append(f"{message.get('name', 'Unknown')}: {message.get('content', '')}")
    else:
        for key, data in chat_history.items():
            all_messages.append(f"--- Conversation: {key} ---")
            for message in data.get("history", []):
                all_messages.append(f"{message.get('name', 'Unknown')}: {message.get('content', '')}")
            all_messages.append("---")
    
    if not all_messages:
        return {"error": "No matching interview history found"}
    
    flattened_history = "\n".join(all_messages)
    
    prompt = f"""
    Analyze the following interview chat history and provide a detailed report. 
    Include observations on the candidate's skills, communication style, 
    responses to specific questions, and any other relevant insights.
    
    Interview Chat History:
    {flattened_history}
    
    Analysis Report:
    """
        
    try:
        gemini = GeminiService()
        response = gemini.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )

        if not response or not response.text:
            return {"status": 500, "response": "No response from Gemini"}

        interview_results = clean_json_response(response.text)
        return interview_results
    except Exception as e:
        return {"status": 500, "response": f"Error analyzing interview: {str(e)}"}