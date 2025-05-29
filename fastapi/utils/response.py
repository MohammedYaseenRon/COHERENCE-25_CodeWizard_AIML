import json

def clean_json_response(text: str) -> dict:
    """
    Removes markdown formatting ('''json ... ''') from the response and parses it as JSON.
    """
    if text.startswith("```json"):
        text = text[len("```json"):].strip()
    if text.endswith("```"):
        text = text[:-3].strip()
    return json.loads(text)