from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from typing import Optional
from ..database import get_db
from ..models import Expert, User
from ..schemas import (
    ExpertOut,
    ExpertWithUserOut,
    ExpertClaimRequest,
    ExpertVerificationRequest,
    ExpertClaimResponse,
)
from ..auth import get_current_user

router = APIRouter(prefix="/experts", tags=["experts"])


@router.get("/", response_model=list[ExpertOut])
def list_experts(
    field: Optional[str] = Query(None, description="Filter by field of study"),
    keyword: Optional[str] = Query(None, description="Filter by keyword"),
    claimed: bool = Query(False, description="Include claimed experts"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    List experts from the CSV.
    By default shows unclaimed experts only.
    """
    query = db.query(Expert)

    if not claimed:
        query = query.filter(Expert.is_claimed == False)

    if field:
        query = query.filter(Expert.csv_field.ilike(f"%{field}%"))

    if keyword:
        query = query.filter(Expert.csv_keywords.ilike(f"%{keyword}%"))

    experts = query.offset(skip).limit(limit).all()
    return experts


@router.get("/search", response_model=list[ExpertOut])
def search_experts(
    query: str = Query(..., min_length=2, description="Search by name or affiliation"),
    db: Session = Depends(get_db),
):
    """
    Search for experts by name or affiliation.
    Returns unclaimed experts matching the query.
    """
    search_term = f"%{query}%"
    results = (
        db.query(Expert)
        .filter(
            Expert.is_claimed == False,
            or_(
                Expert.csv_name.ilike(search_term),
                Expert.csv_affiliation.ilike(search_term),
            ),
        )
        .limit(20)
        .all()
    )
    return results


@router.get("/{expert_id}", response_model=ExpertWithUserOut)
def get_expert(
    expert_id: int,
    db: Session = Depends(get_db),
):
    """Get a specific expert profile."""
    expert = db.query(Expert).filter(Expert.id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
    return expert


@router.post("/claim-by-email", response_model=ExpertClaimResponse)
def claim_expert_by_email(
    request: ExpertClaimRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Claim an expert profile by email.
    User's registration email must match the CSV email exactly.
    """
    # Find expert by csv_email
    expert = db.query(Expert).filter(Expert.csv_email == request.email).first()

    if not expert:
        # Try case-insensitive search
        expert = (
            db.query(Expert)
            .filter(Expert.csv_email.ilike(request.email))
            .first()
        )

    if not expert:
        return ExpertClaimResponse(
            success=False,
            message="No expert profile found with that email",
            expert=None,
            requires_admin_verification=False,
        )

    if expert.is_claimed:
        return ExpertClaimResponse(
            success=False,
            message="This expert profile has already been claimed",
            expert=None,
            requires_admin_verification=False,
        )

    # Check if user already has an expert profile
    existing_expert = (
        db.query(Expert).filter(Expert.user_id == current_user.id).first()
    )
    if existing_expert:
        return ExpertClaimResponse(
            success=False,
            message="Your account already has a linked expert profile",
            expert=None,
            requires_admin_verification=False,
        )

    # Claim the expert profile
    expert.user_id = current_user.id
    expert.is_claimed = True
    expert.claimed_at = db.func.now()
    expert.verified_by_admin = True  # Email match = auto-verified

    db.commit()
    db.refresh(expert)

    return ExpertClaimResponse(
        success=True,
        message=f"Successfully claimed expert profile for {expert.csv_name}",
        expert=ExpertOut.model_validate(expert),
        requires_admin_verification=False,
    )


@router.post("/request-verification", response_model=ExpertClaimResponse)
def request_expert_verification(
    request: ExpertVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Request admin verification to claim an expert profile.
    User provides name and affiliation, we search for a match in CSV.
    """
    # Search for fuzzy match
    search_term = f"%{request.csv_name}%"
    candidates = (
        db.query(Expert)
        .filter(
            Expert.is_claimed == False,
            or_(
                Expert.csv_name.ilike(search_term),
                Expert.csv_affiliation.ilike(request.csv_affiliation),
            ),
        )
        .limit(5)
        .all()
    )

    if not candidates:
        return ExpertClaimResponse(
            success=False,
            message="No expert profiles found matching that name and affiliation. Please check the spelling.",
            expert=None,
            requires_admin_verification=False,
        )

    # Check if user already has a pending verification request
    # (would need a VerificationRequest model for tracking this)
    # For now, we'll just return the candidates

    if len(candidates) == 1:
        # Auto-match if there's only one candidate
        expert = candidates[0]

        # Check if already claimed
        if expert.is_claimed:
            return ExpertClaimResponse(
                success=False,
                message="This expert profile has already been claimed",
                expert=None,
                requires_admin_verification=False,
            )

        # Check if user already has expert profile
        existing = db.query(Expert).filter(Expert.user_id == current_user.id).first()
        if existing:
            return ExpertClaimResponse(
                success=False,
                message="Your account already has a linked expert profile",
                expert=None,
                requires_admin_verification=False,
            )

        # Link them provisionally (admin must verify)
        expert.user_id = current_user.id
        expert.verified_by_admin = False

        db.commit()
        db.refresh(expert)

        return ExpertClaimResponse(
            success=True,
            message=f"Verification request submitted for {expert.csv_name}. Admin will review shortly.",
            expert=ExpertOut.model_validate(expert),
            requires_admin_verification=True,
        )
    else:
        # Multiple candidates - return them for user to select
        return ExpertClaimResponse(
            success=False,
            message=f"Found {len(candidates)} possible matches. Please contact support with more details.",
            expert=None,
            requires_admin_verification=True,
        )


@router.get("/{expert_id}/match-candidates", response_model=list[ExpertOut])
def get_match_candidates(
    expert_id: int,
    db: Session = Depends(get_db),
):
    """
    Get potential expert profiles for manual matching.
    Used when multiple candidates are found.
    """
    expert = db.query(Expert).filter(Expert.id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")

    # Find similar experts (same field, similar affiliation)
    candidates = (
        db.query(Expert)
        .filter(
            Expert.is_claimed == False,
            Expert.csv_field == expert.csv_field,
        )
        .limit(10)
        .all()
    )
    return candidates
