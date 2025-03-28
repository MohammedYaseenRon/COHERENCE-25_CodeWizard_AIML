import os
import shutil
import tempfile
import uuid

class FileUploadHandler:
    def __init__(self, upload_directory='uploaded_resumes'):
        """
        Initialize the file upload handler with a specific upload directory.
        
        :param upload_directory: Directory to save uploaded files
        """
        # Create the upload directory if it doesn't exist
        self.upload_directory = os.path.abspath(upload_directory)
        os.makedirs(self.upload_directory, exist_ok=True)
    
    async def save_uploaded_file(self, filename):
        """
        Asynchronously save the uploaded file with its original name.
        
        :param filename: Original filename of the uploaded file
        :return: Full path to the saved file
        """
        # Sanitize the filename to prevent directory traversal
        safe_filename = self._sanitize_filename(filename)
        
        # Full path where the file will be saved
        destination_path = os.path.join(self.upload_directory, safe_filename)
        
        return destination_path, safe_filename
    
    def _sanitize_filename(self, filename):
        """
        Sanitize the filename to prevent security issues.
        
        :param filename: Original filename
        :return: Sanitized filename
        """
        # Remove any path traversal attempts
        filename = os.path.basename(filename)
        
        # Replace or remove problematic characters
        filename = "".join(c for c in filename if c.isalnum() or c in (' ', '.', '_', '-'))
        
        # Ensure the filename is not empty
        if not filename:
            filename = f"uploaded_file_{uuid.uuid4().hex[:8]}"
        
        return filename
    
    def get_file_path(self, filename):
        """
        Retrieve the full path of a saved file.
        
        :param filename: Name of the file
        :return: Full path to the file, or None if not found
        """
        file_path = os.path.join(self.upload_directory, filename)
        return file_path if os.path.exists(file_path) else None
    
    def list_uploaded_files(self):
        """
        List all uploaded files in the directory.
        
        :return: List of filenames
        """
        return os.listdir(self.upload_directory)