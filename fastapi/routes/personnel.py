from fastapi import APIRouter, HTTPException
import json
from models.resume import SelectedPersonnel

router = APIRouter()

@router.post("/selected-personnel/upload")
async def upload_selected_personnel(personnel: SelectedPersonnel):
    """
    Endpoint to upload a selected personnel's resume to the selected candidates pool
    """
    try:
        selected_file = "selected_personnel.json"
        try:
            with open(selected_file, 'r') as f:
                selected_personnel = json.load(f)
        except FileNotFoundError:
            selected_personnel = {}
        
        selected_personnel[personnel.resume_id] = personnel.model_dump()
        
        with open(selected_file, 'w') as f:
            json.dump(selected_personnel, f, indent=2)
        
        return {"status": "success", "message": f"Personnel with ID {personnel.resume_id} added to selected pool"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading selected personnel: {str(e)}")

@router.get("/selected-personnel")
async def get_selected_personnel():
    """
    Endpoint to retrieve all selected personnel
    """
    try:
        selected_file = "selected_personnel.json"
        try:
            with open(selected_file, 'r') as f:
                selected_personnel = json.load(f)
        except FileNotFoundError:
            selected_personnel = {}
        
        return selected_personnel
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving selected personnel: {str(e)}")