"""
ARDD session recommendations + personal schedule.

Reuses the existing Event table. Sessions are events whose ardd_meta has
sessionType set. Each user's starred sessions live in
User.ardd_meta.sessionsOfInterest (list[int]) — same field as the seed.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Event, User
from ..auth import get_current_user


router = APIRouter(prefix="/sessions", tags=["sessions"])


# Reuse the same labels server-side for explanations.
FOCUS_LABELS = {
    "compbio_aging": "computational aging biology",
    "aging_clocks": "aging clocks",
    "partial_reprogramming": "partial reprogramming",
    "epigenetics": "epigenetics",
    "senescence": "cellular senescence",
    "proteostasis": "proteostasis",
    "mitochondrial": "mitochondrial biology",
    "immunoaging": "immune aging",
    "cancer_aging": "the cancer-aging interface",
    "therapeutic_modalities": "therapeutic modalities",
    "geroscience_clinical": "clinical geroscience",
    "ai_drug_discovery": "AI-driven drug discovery",
    "longevity_biomarkers": "longevity biomarkers",
}


def _session_meta(event: Event) -> dict:
    return event.ardd_meta or {}


def _is_session(event: Event) -> bool:
    return bool(_session_meta(event).get("sessionType"))


def _jaccard(a, b) -> float:
    sa, sb = set(a or []), set(b or [])
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def _role_relevance(role: str | None, session_type: str | None) -> float:
    if not role or not session_type:
        return 0.3
    pitch_or_business = {"pitch", "panel"}
    if "investor" in role and session_type in {"pitch", "panel"}:
        return 0.9
    if role in {"biotech_founder", "biotech_scientist", "pharma_bd"} and session_type in {"panel", "workshop", "pitch"}:
        return 0.7
    if role in {"academic_pi", "academic_postdoc"} and session_type in {"keynote", "panel", "poster", "workshop"}:
        return 0.7
    if session_type == "mixer":
        return 0.6
    return 0.4


def _score_session(user_meta: dict, session: Event, starred_ids: set[int]) -> dict:
    sm = _session_meta(session)
    focus = user_meta.get("researchFocus", []) or []
    tags = sm.get("topicTags", []) or []
    focus_score = _jaccard(focus, tags)

    role_score = _role_relevance(user_meta.get("role"), sm.get("sessionType"))

    explicit_score = 1.0 if session.id in starred_ids else 0.0

    # Goal relevance: business goals × session type
    goals = user_meta.get("businessGoals", []) or []
    business = {
        "pitch": {"raise_capital", "learn_field", "license_in"},
        "panel": {"meet_kols", "find_collaborators", "license_in", "license_out", "learn_field"},
        "keynote": {"meet_kols", "learn_field"},
        "workshop": {"find_collaborators", "find_jobs"},
        "mixer": {"find_collaborators", "raise_capital", "meet_kols", "find_jobs"},
        "poster": {"find_collaborators", "meet_kols"},
        "tutorial": {"find_jobs", "learn_field"},
    }
    relevant = business.get(sm.get("sessionType", ""), set())
    goal_score = (len(set(goals) & relevant) / max(len(relevant), 1)) if relevant else 0.0

    score_01 = (
        0.30 * focus_score
        + 0.20 * role_score
        + 0.20 * goal_score
        + 0.30 * explicit_score
    )
    score = round(score_01 * 100)

    shared_tags = sorted(set(focus) & set(tags))
    reasons: list[str] = []
    if shared_tags:
        labels = [FOCUS_LABELS.get(t, t.replace("_", " ")) for t in shared_tags[:2]]
        if len(labels) == 1:
            reasons.append(f"Matches your focus on {labels[0]}")
        else:
            reasons.append(f"Matches your focus on {labels[0]} and {labels[1]}")
    if explicit_score:
        reasons.append("You've already starred this session")
    if relevant and (set(goals) & relevant):
        reasons.append("Aligned with your stated conference goals")
    if not reasons:
        reasons.append("Worth scanning — strong general fit for ARDD attendees")

    return {
        "score": score,
        "reasons": reasons,
        "starred": bool(explicit_score),
    }


def _serialize(event: Event, scoring: dict | None = None) -> dict:
    sm = _session_meta(event)
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "location": event.location,
        "start_date": event.start_date.isoformat() if event.start_date else None,
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "image_url": event.image_url,
        "status": event.status,
        "sessionType": sm.get("sessionType"),
        "topicTags": sm.get("topicTags", []),
        "speakers": sm.get("speakers", []),
        "room": sm.get("room"),
        "track": sm.get("track"),
        "score": scoring["score"] if scoring else None,
        "reasons": scoring["reasons"] if scoring else None,
        "starred": scoring["starred"] if scoring else False,
    }


@router.get("/")
def list_sessions(db: Session = Depends(get_db)):
    """All sessions (events with sessionType set)."""
    events = db.query(Event).order_by(Event.start_date).all()
    return [_serialize(e) for e in events if _is_session(e)]


@router.get("/recommended")
def recommended_sessions(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_meta = current_user.ardd_meta or {}
    starred_ids = set(user_meta.get("sessionsOfInterest", []) or [])

    events = db.query(Event).order_by(Event.start_date).all()
    sessions = [e for e in events if _is_session(e)]

    scored = [(s, _score_session(user_meta, s, starred_ids)) for s in sessions]
    scored.sort(key=lambda pair: pair[1]["score"], reverse=True)
    return [_serialize(s, sc) for s, sc in scored[:limit]]


@router.get("/my")
def my_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Sessions the user has starred (ardd_meta.sessionsOfInterest)."""
    user_meta = current_user.ardd_meta or {}
    starred_ids = list(user_meta.get("sessionsOfInterest", []) or [])
    if not starred_ids:
        return []
    events = (
        db.query(Event)
        .filter(Event.id.in_(starred_ids))
        .order_by(Event.start_date)
        .all()
    )
    starred_marker = {"score": None, "reasons": None, "starred": True}
    return [_serialize(e, starred_marker) for e in events]


class StarRequest(BaseModel):
    star: bool = True


@router.post("/{session_id}/star")
def star_session(
    session_id: int,
    body: StarRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == session_id).first()
    if event is None or not _is_session(event):
        raise HTTPException(status_code=404, detail="Session not found")

    meta = dict(current_user.ardd_meta or {})
    starred = list(meta.get("sessionsOfInterest", []) or [])
    if body.star and session_id not in starred:
        starred.append(session_id)
    elif not body.star:
        starred = [s for s in starred if s != session_id]
    meta["sessionsOfInterest"] = starred
    current_user.ardd_meta = meta
    db.commit()
    return {"starred": body.star, "sessionsOfInterest": starred}
