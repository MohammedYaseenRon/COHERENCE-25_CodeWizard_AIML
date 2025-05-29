import json
from typing import Dict, Any

class ChatService:
    def __init__(self, CHAT_HISTORY_FILE: str = "chat_history.json"):
        self.CHAT_HISTORY_FILE = CHAT_HISTORY_FILE
        self.chat_history = self.load_chat_history()

    def load_chat_history(self):
        """Loads chat history from the JSON file."""
        try:
            with open(self.CHAT_HISTORY_FILE, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
        except json.JSONDecodeError:
            print(f"Warning: {self.CHAT_HISTORY_FILE} is corrupted. Starting with an empty history.")
            return {}

    def save_chat_history(self, chat_history: Dict[str, Any]):
        """Saves chat history to the JSON file."""
        try:
            with open(self.CHAT_HISTORY_FILE, "w") as f:
                json.dump(chat_history, f, indent=4)
        except IOError as e:
            print(f"Error saving chat history: {e}")