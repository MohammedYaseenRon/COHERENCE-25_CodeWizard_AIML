from fastapi.routing import APIRouter
from models.bias import BiasAnalysisRequest
from fastapi import HTTPException
import json
from services.gemini_service import GeminiService
from utils.response import clean_json_response
import os

router = APIRouter()

@router.post("/bias-analysis")
async def analyze_bias(request: BiasAnalysisRequest):
    """
    Endpoint to analyze potential biases in the selection process using Gemini
    """
    try:
        selected_file = "selected_personnel.json"
        try:
            with open(selected_file, 'r') as f:
                selected_personnel = json.load(f)
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="No selected personnel found for analysis")
        
        selected_profiles = []
        for key in selected_personnel:
            if "profile" in selected_personnel[key]:
                selected_profiles.append(selected_personnel[key]["profile"])
        
        selection_metadata = []
        for key in selected_personnel:
            if "selection_reason" in selected_personnel[key]:
                selection_metadata.append({
                    "resume_id": selected_personnel[key].get("resume_id", key),
                    "selection_reason": selected_personnel[key].get("selection_reason", "Unknown"),
                    "selection_date": selected_personnel[key].get("selection_date", "Unknown")
                })
        
        prompt = f"""
        Analyze the following set of selected candidate profiles for a {request.job_title} position 
        for potential biases. The job description is:
        
        "{request.job_description}"
        
        Return your analysis in the following JSON structure ONLY:
        {{
            "summary": "Overall summary of the bias analysis",
            "fairness_score": 7.5, // A score from 1-10
            "bias_metrics": {{
                "gender": {{
                    "representation": {{
                        "male": 65,
                        "female": 30,
                        "other": 5
                    }},
                    "industry_benchmark": {{
                        "male": 60,
                        "female": 35,
                        "other": 5
                    }},
                    "findings": "Description of gender-related patterns or imbalances",
                    "recommendations": "Suggestions to improve gender diversity"
                }},
                // Repeat this structure for each requested analysis type
            }},
            "recommendations": [
                "Recommendation 1",
                "Recommendation 2",
                "Recommendation 3"
            ]
        }}

        Ensure your analysis covers these requested bias categories: {', '.join(request.analysis_types)}

        
        For each category:
        1. Identify any patterns or imbalances in the selected candidates
        2. Quantify the representation (e.g., percentages, ratios)
        3. Compare against industry standards or expected distributions
        4. Suggest improvements to reduce unintentional bias
        5. Provide a summary of the analysis and a fairness score from 1-10
        
        Ensure that the analysis is data-driven and based on the provided profiles.
        
        IMPORTANT: Be objective, data-driven, and fair in your analysis. Do not make assumptions 
        beyond what's in the data. If certain information is not available for some candidates, 
        note that in your analysis as a potential source of bias itself.
        """
        
        analysis_content = {
            "profiles": selected_profiles,
            "selection_metadata": selection_metadata,
            "job_title": request.job_title,
            "job_description": request.job_description,
            "analysis_types": request.analysis_types
        }

        gemini = GeminiService()
        
        response = gemini.generate_content(
            model="gemini-2.0-flash",
            contents=prompt + "\n\nAnalysis Data: " + json.dumps(analysis_content),
            config={'response_mime_type': 'application/json'}
        )

        if not response or not response.text:
            raise HTTPException(
                status_code=500,
                detail="No response received from Gemini for bias analysis"
            )
        
        bias_analysis = clean_json_response(response.text)
        return bias_analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing bias: {str(e)}")