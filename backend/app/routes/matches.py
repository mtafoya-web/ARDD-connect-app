"""
ARDD matchmaking.

Deterministic scoring + template explanations. No LLM. Pre-loads every
seeded attendee in memory; fine at conference scale (hundreds, not millions).
"""
from typing import Iterable
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..auth import get_current_user


router = APIRouter(prefix="/matches", tags=["matches"])


# ---------------------------------------------------------------------------
# Lookup tables
# ---------------------------------------------------------------------------
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
    "learn_field": "deploy capital",
    "meet_press": "meet press",
    "meet_kols": "meet KOLs",
    "find_cros": "find CROs",
    "pilot_clinical_partner": "pilot a clinical partner",
}

# Pairs of (roleA, roleB) → (scenario tag, base score boost 0..1)
# Order-insensitive: we sort the role pair before lookup.
SCENARIOS: dict[tuple[str, str], tuple[str, float]] = {
    ("biotech_founder", "investor_vc"): ("investor_meets_startup", 1.0),
    ("biotech_founder", "investor_family_office"): ("investor_meets_startup", 1.0),
    ("biotech_founder", "investor_angel"): ("investor_meets_startup", 0.95),
    ("biotech_founder", "pharma_bd"): ("startup_meets_pharma", 1.0),
    ("biotech_founder", "pharma_scientist"): ("startup_meets_pharma", 0.85),
    ("pharma_bd", "pharma_bd"): ("pharma_meets_pharma", 0.7),
    ("pharma_bd", "pharma_scientist"): ("pharma_meets_pharma", 0.75),
    ("pharma_scientist", "pharma_scientist"): ("pharma_meets_pharma", 0.7),
    ("academic_pi", "biotech_founder"): ("academic_meets_biotech", 0.95),
    ("academic_pi", "biotech_scientist"): ("academic_meets_biotech", 0.95),
    ("academic_pi", "academic_pi"): ("academic_meets_academic", 0.65),
    ("academic_pi", "pharma_scientist"): ("academic_meets_biotech", 0.85),
    ("academic_pi", "pharma_bd"): ("academic_meets_biotech", 0.7),
    ("biotech_scientist", "biotech_scientist"): ("biotech_meets_biotech", 0.7),
}

GOAL_COMPLEMENTS: list[tuple[str, str]] = [
    ("raise_capital", "learn_field"),       # founder ↔ investor deploying
    ("license_out", "license_in"),
    ("find_collaborators", "find_collaborators"),
    ("recruit_talent", "find_jobs"),
    ("pilot_clinical_partner", "license_in"),
    ("pilot_clinical_partner", "pilot_clinical_partner"),
    ("meet_kols", "meet_kols"),
]


def _scenario(role_a: str, role_b: str) -> tuple[str, float]:
    if not role_a or not role_b:
        return ("general_networking", 0.4)
    key = tuple(sorted([role_a, role_b]))
    if key in SCENARIOS:
        return SCENARIOS[key]
    return ("general_networking", 0.4)


def _jaccard(a: Iterable[str], b: Iterable[str]) -> float:
    sa, sb = set(a or []), set(b or [])
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def _goal_compat(goals_a: list[str], goals_b: list[str]) -> tuple[float, list[tuple[str, str]]]:
    """Returns (0..1, list of (goalA, goalB) hits)."""
    ga, gb = set(goals_a or []), set(goals_b or [])
    hits: list[tuple[str, str]] = []
    score = 0.0
    for x, y in GOAL_COMPLEMENTS:
        if (x in ga and y in gb) or (y in ga and x in gb):
            hits.append((x, y))
            score += 1.0
    return min(score / 2.0, 1.0), hits


def _stage_compat(stage_a: str | None, stage_b: str | None, scenario: str) -> float:
    if scenario != "investor_meets_startup":
        return 0.5
    # Both investors deploying or founder is seed/seriesA — assume good match.
    early = {"preseed", "seed", "seriesA"}
    if stage_a in early or stage_b in early:
        return 1.0
    return 0.5


def _format_focus_list(focus: list[str], limit: int = 2) -> str:
    items = [FOCUS_LABELS.get(f, f.replace("_", " ")) for f in focus[:limit]]
    if not items:
        return "shared topics"
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return ", ".join(items[:-1]) + f", and {items[-1]}"


HONORIFICS = {"dr.", "dr", "prof.", "prof", "professor", "mr.", "ms.", "mrs."}


def _first_name(full_name: str | None) -> str:
    if not full_name:
        return "they"
    parts = full_name.split()
    for p in parts:
        if p.lower() not in HONORIFICS:
            return p
    return parts[0]


def _format_goal_pair(goal_a: str, goal_b: str, name_a: str, name_b: str) -> str:
    label_a = GOAL_LABELS.get(goal_a, goal_a.replace("_", " "))
    label_b = GOAL_LABELS.get(goal_b, goal_b.replace("_", " "))
    if goal_a == goal_b:
        return f"Both want to {label_a}"
    return f"{_first_name(name_a)} wants to {label_a}; {_first_name(name_b)} wants to {label_b}"


def _availability_overlap(av_a: list[str] | None, av_b: list[str] | None) -> tuple[float, str | None]:
    """Naive string-match overlap. Returns (score 0..1, first overlap label)."""
    sa, sb = set(av_a or []), set(av_b or [])
    common = sorted(sa & sb)
    if not common:
        return 0.0, None
    return min(len(common) / 3.0, 1.0), common[0]


def _short_focus_label(focus: list[str]) -> str:
    return _format_focus_list(focus, limit=2)


def _conversation_starter(me, them, shared_focus: list[str], scenario: str) -> str:
    my_first = _first_name(me.full_name or me.username)
    their_first = _first_name(them.full_name or them.username)
    has_topic = bool(shared_focus)
    topic = _short_focus_label(shared_focus)
    if scenario == "investor_meets_startup":
        return (f"Hi {their_first} — I'm {my_first}. Caught your profile; "
                f"would love a quick chat about how a partnership could look.")
    if scenario == "startup_meets_pharma":
        if has_topic:
            return (f"Hi {their_first} — I'm {my_first}. Working on {topic}; "
                    f"would love 15 minutes to compare notes on partnering options.")
        return (f"Hi {their_first} — I'm {my_first}. Would love 15 minutes to compare "
                f"notes on partnering options at ARDD.")
    if scenario == "academic_meets_biotech":
        if has_topic:
            return (f"Hi {their_first} — I'm {my_first}. We both work on {topic}; "
                    f"keen to chat about translating that into in-vivo data.")
        return (f"Hi {their_first} — I'm {my_first}. Saw complementary goals on the BD side; "
                f"want to find 15 minutes at the conference?")
    if scenario == "academic_meets_academic":
        if has_topic:
            return (f"Hi {their_first} — I'm {my_first}. Shared interest in {topic}; "
                    f"want to grab coffee between sessions?")
        return (f"Hi {their_first} — I'm {my_first}. Adjacent research interests; "
                f"want to grab coffee between sessions?")
    return (f"Hi {their_first} — I'm {my_first}. "
            + (f"We seem to overlap on {topic}; " if has_topic else "")
            + "would love a quick chat at ARDD.")


def _explain(me: User, them: User, breakdown: dict) -> dict:
    me_meta = me.ardd_meta or {}
    them_meta = them.ardd_meta or {}

    shared = breakdown["shared_focus"]
    goal_hits = breakdown["goal_hits"]
    overlap_label = breakdown["overlap_label"]
    scenario = breakdown["scenario"]

    bullets: list[str] = []
    if shared:
        bullets.append(f"Both work on {_format_focus_list(shared, 2)}")
    if goal_hits:
        ga, gb = goal_hits[0]
        bullets.append(
            _format_goal_pair(ga, gb, me.full_name or me.username,
                              them.full_name or them.username)
        )
    if overlap_label:
        bullets.append(f"Both free during {overlap_label}")
    if not bullets:
        bullets.append("Strong fit on conference goals and role compatibility")

    return {
        "bullets": bullets[:3],
        "sharedFocus": shared,
        "complementaryGoals": [{"a": a, "b": b} for a, b in goal_hits],
        "conversationStarter": _conversation_starter(
            me, them, shared, scenario
        ),
        "source": "deterministic",
    }


def _score_pair(me: User, them: User) -> dict:
    me_meta = me.ardd_meta or {}
    them_meta = them.ardd_meta or {}

    scenario, scenario_score = _scenario(me_meta.get("role", ""), them_meta.get("role", ""))

    focus_a = me_meta.get("researchFocus", []) or []
    focus_b = them_meta.get("researchFocus", []) or []
    focus_overlap = _jaccard(focus_a, focus_b)
    shared_focus = sorted(set(focus_a) & set(focus_b))

    goal_score, goal_hits = _goal_compat(
        me_meta.get("businessGoals", []) or [],
        them_meta.get("businessGoals", []) or [],
    )

    stage_score = _stage_compat(
        me_meta.get("companyStage"), them_meta.get("companyStage"), scenario
    )

    org_compat = 0.6 if (me_meta.get("orgType") and them_meta.get("orgType")
                         and me_meta.get("orgType") != them_meta.get("orgType")) else 0.4

    avail_score, overlap_label = _availability_overlap(
        me_meta.get("availability"), them_meta.get("availability")
    )

    explicit = 0.0
    sessions_a = set(me_meta.get("sessionsOfInterest", []) or [])
    sessions_b = set(them_meta.get("sessionsOfInterest", []) or [])
    if sessions_a and sessions_b:
        shared_sessions = sessions_a & sessions_b
        explicit = min(len(shared_sessions) / 3.0, 1.0)

    score = (
        0.20 * scenario_score
        + 0.22 * focus_overlap
        + 0.18 * goal_score
        + 0.08 * stage_score
        + 0.06 * org_compat
        + 0.12 * avail_score
        + 0.14 * explicit
    )
    score = round(score * 100)

    breakdown = {
        "scenario": scenario,
        "scenario_score": scenario_score,
        "focus_overlap": focus_overlap,
        "shared_focus": shared_focus,
        "goal_score": goal_score,
        "goal_hits": goal_hits,
        "stage_score": stage_score,
        "org_compat": org_compat,
        "avail_score": avail_score,
        "overlap_label": overlap_label,
        "explicit_session_overlap": explicit,
    }
    return {
        "score": score,
        "scenario": scenario,
        "breakdown": breakdown,
    }


def _public_profile(u: User) -> dict:
    meta = u.ardd_meta or {}
    return {
        "id": u.id,
        "username": u.username,
        "full_name": u.full_name or u.username,
        "affiliation": u.affiliation or "",
        "bio": u.bio or "",
        "profile_photo_url": u.profile_photo_url or "",
        "role": meta.get("role"),
        "orgType": meta.get("orgType"),
        "companyStage": meta.get("companyStage"),
        "researchFocus": meta.get("researchFocus", []),
        "businessGoals": meta.get("businessGoals", []),
        "availability": meta.get("availability", []),
        "introTagline": meta.get("introTagline"),
    }


def _compute_matches(me: User, candidates: list[User], limit: int) -> list[dict]:
    cards: list[dict] = []
    for them in candidates:
        if them.id == me.id:
            continue
        if not (them.ardd_meta or {}).get("seed"):
            # Only match against ARDD-seeded attendees for the demo.
            continue
        scored = _score_pair(me, them)
        explanation = _explain(me, them, scored["breakdown"])
        cards.append({
            "matchId": f"{me.id}:{them.id}",
            "userId": me.id,
            "candidateId": them.id,
            "candidate": _public_profile(them),
            "score": scored["score"],
            "scenario": scored["scenario"],
            "reasons": explanation,
        })
    cards.sort(key=lambda c: c["score"], reverse=True)
    return cards[:limit]


@router.get("/me")
def my_matches(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidates = db.query(User).filter(User.id != current_user.id).all()
    return {
        "me": _public_profile(current_user),
        "matches": _compute_matches(current_user, candidates, limit=limit),
    }


@router.get("/compare/{candidate_id}")
def compare_match(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    them = db.query(User).filter(User.id == candidate_id).first()
    if them is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    scored = _score_pair(current_user, them)
    return {
        "me": _public_profile(current_user),
        "them": _public_profile(them),
        "score": scored["score"],
        "scenario": scored["scenario"],
        "reasons": _explain(current_user, them, scored["breakdown"]),
    }
