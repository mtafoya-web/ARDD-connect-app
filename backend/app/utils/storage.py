import os
import shutil
import uuid
import logging
from pathlib import Path

import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException

from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Configuration
cloudinary.config(
    cloudinary_url=os.getenv("CLOUDINARY_URL")
)


def _cloudinary_is_configured() -> bool:
    cfg = cloudinary.config()
    values = [cfg.cloud_name, cfg.api_key, cfg.api_secret]
    return all(values) and not any(str(value).startswith("<") for value in values)


def _local_upload(file: UploadFile, folder: str) -> dict:
    suffix = Path(file.filename or "").suffix.lower()
    if not suffix:
        suffix = ".bin"

    safe_folder = folder.strip("/").replace("\\", "/")
    target_dir = settings.upload_root / safe_folder
    target_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{suffix}"
    target_path = target_dir / filename

    file.file.seek(0)
    with target_path.open("wb") as output:
        shutil.copyfileobj(file.file, output)

    public_id = f"local/{safe_folder}/{filename}"
    resource_type = "video" if (file.content_type or "").startswith("video/") else "image"
    return {
        "url": f"{settings.public_base_url}/uploads/{safe_folder}/{filename}",
        "public_id": public_id,
        "format": suffix.lstrip("."),
        "resource_type": resource_type,
    }


def _validate_size(file: UploadFile) -> None:
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    if size > settings.max_upload_bytes:
        limit_mb = settings.max_upload_bytes / (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"File is too large. Max upload size is {limit_mb:g}MB.")


def upload_file(file: UploadFile, folder: str = "ardd_connect"):
    _validate_size(file)

    if not _cloudinary_is_configured():
        return _local_upload(file, folder)

    try:
        file.file.seek(0)
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            resource_type="auto"
        )
        return {
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "format": result.get("format"),
            "resource_type": result.get("resource_type")
        }
    except Exception as e:
        logger.warning("Cloudinary upload failed: %s", e)
        if "Invalid api_key" in str(e):
            return _local_upload(file, folder)
        raise HTTPException(status_code=500, detail="Failed to upload file to storage")

def delete_file(public_id: str):
    if not public_id:
        return
    if public_id.startswith("local/"):
        relative_path = public_id.removeprefix("local/")
        target = (settings.upload_root / relative_path).resolve()
        try:
            target.relative_to(settings.upload_root.resolve())
        except ValueError:
            return
        if target.exists():
            target.unlink()
        return

    try:
        cloudinary.uploader.destroy(public_id)
    except Exception as e:
        logger.warning("Cloudinary delete failed: %s", e)
