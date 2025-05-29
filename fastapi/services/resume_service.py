import json

class ResumeService:
    """
    Service for analyzing resumes and storing results in a JSON file.
    This service handles loading, saving, and updating resume analysis results.
    """
    def __init__(self, results_file='resume_analysis_results.json'):
        self.results_file = results_file
        self.analysis_results = {}
        self.load_results()
    
    def load_results(self):
        """
        Load existing results from JSON file or create a new empty dictionary
        """
        try:
            with open(self.results_file, 'r') as f:
                self.analysis_results = json.load(f)
        except FileNotFoundError:
            self.analysis_results = {}

    def save_results(self):
        """
        Save current analysis results to JSON file
        """
        with open(self.results_file, 'w') as f:
            json.dump(self.analysis_results, f, indent=2)

    def update_results(self, filename, resume_data):
        """
        Update results dictionary and save to file
        """
        self.analysis_results[filename] = resume_data
        self.save_results()