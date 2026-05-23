"""
ARDD Claw Bot: deterministic, profile-aware conference assistant.

The bot does not call an external LLM. It answers from live database context:
the current user profile, ARDD metadata, starred schedule, all sessions/events,
seeded attendees, posts, and deterministic match scoring.
"""
import re
from datetime import datetime, timezone
from typing import Iterable

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Event, Post, User
from .matches import _compute_matches
from .sessions import _score_session


router = APIRouter(prefix="/bot", tags=["bot"])


DEMO_NOW = datetime(2026, 8, 26, 11, 30, tzinfo=timezone.utc)

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

GOAL_LABELS = {
    "raise_capital": "raise capital",
    "find_collaborators": "find research collaborators",
    "recruit_talent": "recruit talent",
    "find_jobs": "find a role",
    "license_in": "license assets in",
    "license_out": "license assets out",
    "find_co_founders": "find co-founders",
    "learn_field": "deploy capital or learn the field",
    "meet_press": "meet press",
    "meet_kols": "meet KOLs",
    "find_cros": "find CROs",
    "pilot_clinical_partner": "pilot a clinical partner",
}

PRE_BAKED_PULSES: dict[str, list[dict]] = {
    "Aging Clocks: From Methylation to Multi-Omics": [
        {"sentiment": "great", "takeaway": "Multi-omics clocks are leapfrogging methylation-only ones for tissue-specific aging."},
        {"sentiment": "good", "takeaway": "CLIA validation still the bottleneck; consensus reference panels are coming."},
        {"sentiment": "mixed", "takeaway": "Replication remains thin on the proteomic side; exciting but early."},
    ],
    "Partial Reprogramming: In-Vivo Safety and Efficacy": [
        {"sentiment": "great", "takeaway": "First evidence of tissue-specific reprogramming without tumorigenesis."},
        {"sentiment": "good", "takeaway": "Delivery is still the rate-limiting step; AAV vs LNP debate is alive."},
        {"sentiment": "mixed", "takeaway": "Pre-clinical data strong; translational gap remains real."},
    ],
    "Senescence: From Mechanism to Senolytics": [
        {"sentiment": "good", "takeaway": "Senolytic combination therapies showing better safety windows than monotherapy."},
    ],
    "ML for Aging Drug Discovery: What's Real": [
        {"sentiment": "mixed", "takeaway": "Generative chemistry is exciting; aging-specific benchmarks are still missing."},
    ],
}

STOPWORDS = {
    "the", "and", "for", "from", "with", "about", "what", "people", "think",
    "did", "of", "on", "a", "an", "to", "in", "panel", "session", "talk",
    "show", "tell", "me", "my", "who", "where", "when", "which", "schedule",
}


class BotQuery(BaseModel):
    text: str


def _now(now_override: datetime | None = None) -> datetime:
    if now_override:
        return now_override
    real = datetime.now(timezone.utc)
    if real.year != 2026 or real.month != 8 or real.day not in (25, 26, 27):
        return DEMO_NOW
    return real


def _meta(obj) -> dict:
    return obj.ardd_meta or {}


def _is_session(event: Event) -> bool:
    return bool(_meta(event).get("sessionType"))


def _all_sessions(db: Session) -> list[Event]:
    return [
        event
        for event in db.query(Event).order_by(Event.start_date).all()
        if _is_session(event)
    ]


def _format_time(dt: datetime | None) -> str:
    if not dt:
        return "time TBD"
    return dt.astimezone(timezone.utc).strftime("%a %H:%M UTC")


def _label_list(values: Iterable[str] | None, labels: dict[str, str] | None = None) -> list[str]:
    labels = labels or {}
    return [labels.get(value, value.replace("_", " ")) for value in (values or [])]


def _join(items: list[str], fallback: str = "not specified") -> str:
    clean = [item for item in items if item]
    if not clean:
        return fallback
    if len(clean) == 1:
        return clean[0]
    return ", ".join(clean[:-1]) + f", and {clean[-1]}"


def _session_to_dict(event: Event) -> dict:
    sm = _meta(event)
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_date": event.start_date.isoformat() if event.start_date else None,
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "location": event.location,
        "room": sm.get("room"),
        "track": sm.get("track"),
        "sessionType": sm.get("sessionType"),
        "topicTags": sm.get("topicTags", []),
        "speakers": sm.get("speakers", []),
    }


def _attachments(events: list[Event]) -> list[dict]:
    return [{"type": "session", "session": _session_to_dict(event)} for event in events]


def _tokens(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if len(token) > 2 and token not in STOPWORDS
    }


def _event_search_score(event: Event, text: str) -> int:
    sm = _meta(event)
    haystack = " ".join(
        [
            event.title or "",
            event.description or "",
            event.location or "",
            sm.get("room") or "",
            sm.get("track") or "",
            sm.get("sessionType") or "",
            " ".join(sm.get("topicTags", []) or []),
            " ".join(sp.get("name", "") for sp in sm.get("speakers", []) or []),
            " ".join(sp.get("affiliation", "") for sp in sm.get("speakers", []) or []),
        ]
    )
    return len(_tokens(text) & _tokens(haystack))


def _find_sessions(db: Session, text: str, limit: int = 5) -> list[Event]:
    scored = [
        (_event_search_score(event, text), event)
        for event in _all_sessions(db)
    ]
    scored.sort(
        key=lambda pair: (
            -pair[0],
            pair[1].start_date or datetime.max.replace(tzinfo=timezone.utc),
        )
    )
    return [event for score, event in scored if score > 0][:limit]


def _profile_context(user: User) -> dict:
    meta = _meta(user)
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name or user.username,
        "affiliation": user.affiliation or "",
        "role": meta.get("role") or user.role or "",
        "orgType": meta.get("orgType") or "",
        "companyStage": meta.get("companyStage") or "",
        "researchFocus": meta.get("researchFocus", []) or [],
        "businessGoals": meta.get("businessGoals", []) or [],
        "availability": meta.get("availability", []) or [],
        "sessionsOfInterest": meta.get("sessionsOfInterest", []) or [],
        "introTagline": meta.get("introTagline") or "",
        "bio": user.bio or "",
    }


def _context_snapshot(db: Session, user: User, now: datetime) -> dict:
    sessions = _all_sessions(db)
    profile = _profile_context(user)
    starred_ids = set(profile["sessionsOfInterest"])
    starred = [event for event in sessions if event.id in starred_ids]
    current = [event for event in sessions if event.start_date and event.end_date and event.start_date <= now <= event.end_date]
    upcoming = [event for event in sessions if event.start_date and event.start_date > now]
    attendees = db.query(User).filter(User.id != user.id).all()
    matches = _compute_matches(user, attendees, limit=5)
    recommended = sorted(
        [(event, _score_session(_meta(user), event, starred_ids)) for event in sessions],
        key=lambda pair: pair[1]["score"],
        reverse=True,
    )[:5]
    return {
        "profile": profile,
        "sessions": sessions,
        "starred": starred,
        "current": current,
        "upcoming": upcoming,
        "matches": matches,
        "recommended": recommended,
    }


def handle_profile(db: Session, user: User, _text: str, now: datetime) -> dict:
    ctx = _context_snapshot(db, user, now)
    p = ctx["profile"]
    focus = _join(_label_list(p["researchFocus"], FOCUS_LABELS))
    goals = _join(_label_list(p["businessGoals"], GOAL_LABELS))
    starred_count = len(ctx["starred"])
    response = (
        f"Your ARDD profile says you are {p['full_name']} from {p['affiliation'] or 'an unspecified affiliation'}. "
        f"Role: {p['role'] or 'not specified'}. Focus: {focus}. Goals: {goals}. "
        f"You have {starred_count} starred session{'s' if starred_count != 1 else ''}."
    )
    return {"intent": "profile", "response": response, "attachments": _attachments(ctx["starred"][:3])}


def handle_program(db: Session, user: User, text: str, now: datetime) -> dict:
    ctx = _context_snapshot(db, user, now)
    sessions = ctx["sessions"]
    if not sessions:
        return {"intent": "program", "response": "I do not see any ARDD sessions in the database yet.", "attachments": []}

    hits = _find_sessions(db, text, limit=5) if _tokens(text) else []
    selected = hits or sessions[:5]
    lines = [
        f"{event.title} at {_format_time(event.start_date)} in {_meta(event).get('room') or event.location}"
        for event in selected
    ]
    prefix = "Here are the sessions I found:" if hits else f"The program has {len(sessions)} sessions. First up:"
    return {
        "intent": "program",
        "response": f"{prefix} " + " | ".join(lines),
        "attachments": _attachments(selected),
    }


def handle_whats_now(db: Session, user: User, _text: str, now: datetime) -> dict:
    ctx = _context_snapshot(db, user, now)
    current = ctx["current"]
    if current:
        lines = [
            f"{event.title} is happening now in {_meta(event).get('room') or event.location}"
            for event in current
        ]
        return {"intent": "whats_now", "response": "Right now: " + " | ".join(lines), "attachments": _attachments(current)}

    upcoming = ctx["upcoming"]
    if upcoming:
        event = upcoming[0]
        return {
            "intent": "whats_now",
            "response": (
                f"Nothing is live at {_format_time(now)}. Next up is {event.title} "
                f"at {_format_time(event.start_date)} in {_meta(event).get('room') or event.location}."
            ),
            "attachments": _attachments([event]),
        }
    return {"intent": "whats_now", "response": f"Nothing is on the program at {_format_time(now)}.", "attachments": []}


def handle_whats_next(db: Session, user: User, _text: str, now: datetime) -> dict:
    ctx = _context_snapshot(db, user, now)
    next_starred = [event for event in ctx["starred"] if event.start_date and event.start_date > now]
    next_starred.sort(key=lambda event: event.start_date)
    if next_starred:
        event = next_starred[0]
        return {
            "intent": "whats_next",
            "response": f"Next on your schedule: {event.title} at {_format_time(event.start_date)} in {_meta(event).get('room') or event.location}.",
            "attachments": _attachments([event]),
        }
    if ctx["upcoming"]:
        event = ctx["upcoming"][0]
        return {
            "intent": "whats_next",
            "response": f"Your personal schedule has no upcoming starred sessions, so I would look at {event.title} at {_format_time(event.start_date)}.",
            "attachments": _attachments([event]),
        }
    return {"intent": "whats_next", "response": "I do not see any upcoming sessions.", "attachments": []}


def handle_my_schedule(db: Session, user: User, _text: str, now: datetime) -> dict:
    ctx = _context_snapshot(db, user, now)
    starred = sorted(ctx["starred"], key=lambda event: event.start_date or datetime.max.replace(tzinfo=timezone.utc))
    if not starred:
        return {
            "intent": "my_schedule",
            "response": "Your schedule is empty. Ask for recommendations, then save sessions from the Program page.",
            "attachments": [],
        }
    lines = [
        f"{event.title} at {_format_time(event.start_date)} in {_meta(event).get('room') or event.location}"
        for event in starred[:5]
    ]
    return {"intent": "my_schedule", "response": "Your saved schedule: " + " | ".join(lines), "attachments": _attachments(starred[:5])}


def handle_recommendations(db: Session, user: User, _text: str, now: datetime) -> dict:
    ctx = _context_snapshot(db, user, now)
    recs = ctx["recommended"]
    if not recs:
        return {"intent": "recommendations", "response": "I do not see sessions to recommend yet.", "attachments": []}
    lines = []
    events = []
    for event, scoring in recs[:3]:
        reason = "; ".join(scoring.get("reasons") or []) or "general profile fit"
        lines.append(f"{event.title} ({scoring['score']}/100): {reason}")
        events.append(event)
    return {
        "intent": "recommendations",
        "response": "Based on your profile, I would prioritize: " + " | ".join(lines),
        "attachments": _attachments(events),
    }


def handle_matches(db: Session, user: User, _text: str, now: datetime) -> dict:
    ctx = _context_snapshot(db, user, now)
    matches = ctx["matches"]
    if not matches:
        return {
            "intent": "matches",
            "response": "I do not see seeded attendee matches yet. Make sure seed_ardd.py has been run and your profile has ARDD metadata.",
            "attachments": [],
        }
    lines = []
    for match in matches[:3]:
        candidate = match["candidate"]
        reason = match["reasons"]["bullets"][0] if match["reasons"]["bullets"] else match["scenario"]
        lines.append(f"{candidate['full_name']} ({match['score']}/100): {reason}")
    return {
        "intent": "matches",
        "response": "Your strongest matches are: " + " | ".join(lines),
        "attachments": [{"type": "match", "match": match} for match in matches[:3]],
    }


def handle_where_speaker(db: Session, _user: User, text: str, _now: datetime) -> dict:
    normalized = text.lower()
    for lead in ("where is", "where's", "where"):
        normalized = normalized.replace(lead, " ")
    target_tokens = _tokens(normalized)
    hits: list[tuple[Event, dict]] = []
    for event in _all_sessions(db):
        for speaker in _meta(event).get("speakers", []) or []:
            speaker_text = f"{speaker.get('name', '')} {speaker.get('affiliation', '')}"
            if target_tokens and target_tokens <= _tokens(speaker_text):
                hits.append((event, speaker))
            elif target_tokens and target_tokens & _tokens(speaker_text):
                hits.append((event, speaker))

    if not hits:
        return {
            "intent": "where_speaker",
            "response": "I could not find that speaker in the ARDD program. Try their first or last name.",
            "attachments": [],
        }

    event, speaker = hits[0]
    response = (
        f"{speaker.get('name')} is listed for {event.title} at {_format_time(event.start_date)} "
        f"in {_meta(event).get('room') or event.location}."
    )
    return {"intent": "where_speaker", "response": response, "attachments": _attachments([event])}


def handle_session_pulse(db: Session, _user: User, text: str, _now: datetime) -> dict:
    hits = _find_sessions(db, text, limit=1)
    if hits:
        target = hits[0]
    else:
        target = next((event for event in _all_sessions(db) if event.title in PRE_BAKED_PULSES), None)
    if not target:
        return {"intent": "session_pulse", "response": "Tell me which session you want a pulse on.", "attachments": []}

    real = (
        db.query(Post)
        .filter(Post.category == "session_impression")
        .filter(Post.content.contains(f"session#{target.id}"))
        .order_by(Post.created_at.desc())
        .limit(3)
        .all()
    )
    live_quotes = [{"sentiment": "live", "takeaway": post.content.split("|", 2)[-1].strip()} for post in real]
    quotes = live_quotes + PRE_BAKED_PULSES.get(target.title, [])
    if not quotes:
        return {
            "intent": "session_pulse",
            "response": f"No impressions yet for {target.title}.",
            "attachments": _attachments([target]),
        }
    summary = "; ".join(f"({quote['sentiment']}) {quote['takeaway']}" for quote in quotes[:3])
    return {
        "intent": "session_pulse",
        "response": f"Pulse on {target.title}: {summary}",
        "attachments": _attachments([target]),
    }


def handle_submit_impression(db: Session, user: User, text: str, now: datetime) -> dict:
    ctx = _context_snapshot(db, user, now)
    candidates = ctx["starred"] or ctx["current"]
    candidates = sorted(candidates, key=lambda event: event.start_date or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    target = candidates[0] if candidates else None
    if not target:
        return {
            "intent": "submit_impression",
            "response": "I can file an impression after you star a session or while a session is happening.",
            "attachments": [],
        }

    sentiment = "great" if re.search(r"\b(love|great|amazing|loved|fantastic)\b", text, re.I) else (
        "skip" if re.search(r"\b(boring|skip|meh|terrible|bad)\b", text, re.I) else "mixed"
    )
    takeaway = text.strip()
    if len(takeaway) > 280:
        takeaway = takeaway[:277] + "..."

    post = Post(
        title=f"Impression: {target.title[:60]}",
        content=f"session#{target.id} | {sentiment} | {takeaway}",
        category="session_impression",
        status="published",
        user_id=user.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {
        "intent": "submit_impression",
        "response": f"Filed your impression on {target.title} as {sentiment}. It will feed the ARDD pulse.",
        "attachments": [
            {"type": "session", "session": _session_to_dict(target)},
            {"type": "post", "post_id": post.id, "sentiment": sentiment, "takeaway": takeaway},
        ],
    }


def handle_help(db: Session, user: User, _text: str, now: datetime) -> dict:
    ctx = _context_snapshot(db, user, now)
    response = (
        "I can answer from your profile, starred schedule, the full ARDD program, speakers, topics, session pulse posts, "
        f"and your top {len(ctx['matches'])} attendee matches. Try: 'what should I attend?', 'show my schedule', "
        "'where is Maya Chen?', 'find senescence sessions', or 'who should I meet?'."
    )
    recommended_events = [event for event, _scoring in ctx["recommended"][:1]]
    return {"intent": "help", "response": response, "attachments": _attachments(recommended_events)}


INTENT_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("whats_now", re.compile(r"\b(happening now|right now|what'?s now|now\b|going on now)\b", re.I)),
    ("whats_next", re.compile(r"\b(next for me|what'?s next|after this|coming up)\b", re.I)),
    ("my_schedule", re.compile(r"\b(my schedule|saved sessions|starred|agenda)\b", re.I)),
    ("recommendations", re.compile(r"\b(recommend|should i attend|prioritize|best sessions|for me)\b", re.I)),
    ("matches", re.compile(r"\b(matches|who should i meet|meet|network|introduce|intro)\b", re.I)),
    ("profile", re.compile(r"\b(my profile|profile|about me|my focus|my goals)\b", re.I)),
    ("where_speaker", re.compile(r"\b(where(?:'s| is)?|speaker|presenting|talking)\b", re.I)),
    ("session_pulse", re.compile(r"\b(pulse|think of|reviews?|impressions?|how was)\b", re.I)),
    ("submit_impression", re.compile(r"\b(loved|love|boring|amazing|terrible|skip|takeaway|impression:)\b", re.I)),
    ("program", re.compile(r"\b(program|sessions?|events?|schedule|topic|track|room|find)\b", re.I)),
]

HANDLERS = {
    "profile": handle_profile,
    "program": handle_program,
    "whats_now": handle_whats_now,
    "whats_next": handle_whats_next,
    "my_schedule": handle_my_schedule,
    "recommendations": handle_recommendations,
    "matches": handle_matches,
    "where_speaker": handle_where_speaker,
    "session_pulse": handle_session_pulse,
    "submit_impression": handle_submit_impression,
    "help": handle_help,
}


def classify(text: str) -> str:
    for name, pattern in INTENT_PATTERNS:
        if pattern.search(text or ""):
            return name
    return "help"


@router.post("/query")
def query_bot(
    body: BotQuery,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    text = body.text or ""
    now = _now()
    intent = classify(text)
    handler = HANDLERS[intent]
    return handler(db, user, text, now)


@router.get("/context")
def bot_context(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now = _now()
    ctx = _context_snapshot(db, user, now)
    return {
        "now": now.isoformat(),
        "profile": ctx["profile"],
        "currentSessions": [_session_to_dict(event) for event in ctx["current"]],
        "upcomingSessions": [_session_to_dict(event) for event in ctx["upcoming"][:10]],
        "mySchedule": [_session_to_dict(event) for event in ctx["starred"]],
        "recommendedSessions": [
            {"session": _session_to_dict(event), "score": scoring["score"], "reasons": scoring["reasons"]}
            for event, scoring in ctx["recommended"]
        ],
        "matches": ctx["matches"],
    }


@router.get("/intents")
def list_intents():
    return [
        {"intent": "whats_now", "label": "Happening now", "sample": "what's happening now?"},
        {"intent": "whats_next", "label": "Next for me", "sample": "what's next for me?"},
        {"intent": "my_schedule", "label": "My schedule", "sample": "show my schedule"},
        {"intent": "recommendations", "label": "Recommend", "sample": "what should I attend?"},
        {"intent": "matches", "label": "Matches", "sample": "who should I meet?"},
        {"intent": "where_speaker", "label": "Speaker", "sample": "where is Maya Chen presenting?"},
        {"intent": "program", "label": "Find topic", "sample": "find senescence sessions"},
        {"intent": "session_pulse", "label": "Pulse", "sample": "what did people think of aging clocks?"},
        {"intent": "submit_impression", "label": "Share impression", "sample": "loved the partial reprogramming panel"},
    ]
