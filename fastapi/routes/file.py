from fastapi.routing import APIRouter
from fastapi import HTTPException, Body
import os
from fastapi.responses import FileResponse

router = APIRouter()

@router.get("/get_file/{file_name}")
async def get_file(file_name: str):
    if not os.path.exists(file_name):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_name, media_type="text/plain", filename=file_name)