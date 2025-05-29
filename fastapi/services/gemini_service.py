from google import genai
import os

class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

    def upload_file(self, file_path):
        """
        Uploads a file to Gemini and returns the file object.
        """
        return self.client.files.upload(file=file_path)

    def generate_content(self, contents, model="gemini-2.0-flash", config={'response_mime_type': 'application/json'}):
        return self.client.models.generate_content(
            model=model,
            contents=contents,
            config=config
        )