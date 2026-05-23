from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from ..auth import get_current_active_superuser, get_current_user
from ..utils.storage import upload_file, delete_file

router = APIRouter(prefix="/media", tags=["media"])

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    if not file.content_type:
        raise HTTPException(status_code=400, detail="File type could not be detected")

    if not (file.content_type.startswith("image/") or file.content_type.startswith("video/")):
        raise HTTPException(status_code=400, detail="File must be an image or video")
    
    # Resource type 'auto' handles images and videos
    result = upload_file(file, folder="post_media")
    return result

@router.delete("/{public_id}")
async def remove_media(
    public_id: str,
    current_user = Depends(get_current_active_superuser)
):
    delete_file(public_id)
    return {"status": "deleted"}
