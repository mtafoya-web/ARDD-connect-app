"""
Idempotent ARDD demo seed.

Usage:
    python seed_ardd.py              # adds seed rows if missing
    python seed_ardd.py --reset      # deletes all rows tagged seed=True then re-adds

All seeded users/events have ardd_meta.seed == True.
Demo password for every attendee is the same: see DEMO_PASSWORD below.
"""
import sys
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import SessionLocal
from app.models import User, Event
from app.auth import hash_password

load_dotenv()

DEMO_PASSWORD = "ARDD-demo-2026!"

# ARDD 2026 placeholder dates — Copenhagen, late August / early September
DAY1 = datetime(2026, 8, 25, tzinfo=timezone.utc)
DAY2 = datetime(2026, 8, 26, tzinfo=timezone.utc)
DAY3 = datetime(2026, 8, 27, tzinfo=timezone.utc)


def at(day: datetime, hour: int, minute: int = 0) -> datetime:
    return day.replace(hour=hour, minute=minute)


# ---------------------------------------------------------------------------
# Attendees (10 demo profiles — Maya is the hero user)
# ---------------------------------------------------------------------------
ATTENDEES = [
    {
        "username": "maya_chen",
        "email": "maya.chen@demo.ardd",
        "full_name": "Dr. Maya Chen",
        "affiliation": "Stanford University",
        "bio": "Computational aging researcher building biological clocks to validate rejuvenation therapies.",
        "area_of_study": "Computational aging biology",
        "research_interests": "Aging clocks, partial reprogramming, multi-omics integration, in-vivo validation of rejuvenation.",
        "looking_for": "Biotech collaborators to validate aging clocks on their in-vivo reprogramming data; translational partners.",
        "location": "Stanford, CA",
        "ardd_meta": {
            "role": "academic_pi",
            "orgType": "academia",
            "researchFocus": ["compbio_aging", "aging_clocks", "partial_reprogramming"],
            "businessGoals": ["find_collaborators", "license_out", "meet_kols"],
            "sessionsOfInterest": [],   # filled after sessions created
            "availability": ["Tue 13:00-18:00", "Wed 09:00-12:00", "Thu 14:00-17:00"],
            "preferredIntroStyle": "warm",
            "channels": ["#ml-longevity", "#open-science", "#general-ardd2026"],
            "introTagline": "Aging-clock builder hunting in-vivo validation partners.",
        },
    },
    {
        "username": "alex_vargas",
        "email": "alex@reprogrambio.demo",
        "full_name": "Alex Vargas",
        "affiliation": "ReprogramBio (Founder / CEO)",
        "bio": "Seed-stage founder building partial-reprogramming therapeutics. Ex-academic, now translating.",
        "area_of_study": "Partial reprogramming",
        "research_interests": "In-vivo OSK delivery, epigenetic age reversal, safety profiling.",
        "looking_for": "Series A leads, computational aging collaborators to validate in-vivo readouts, translational hires.",
        "location": "Boston, MA",
        "ardd_meta": {
            "role": "biotech_founder",
            "orgType": "biotech",
            "companyStage": "seed",
            "researchFocus": ["partial_reprogramming", "epigenetics"],
            "businessGoals": ["raise_capital", "find_collaborators", "recruit_talent"],
            "sessionsOfInterest": [],
            "availability": ["Tue 13:00-18:00", "Wed 09:00-12:00", "Thu 14:00-17:00"],
            "preferredIntroStyle": "direct",
            "channels": ["#startup-corner", "#deals-and-fundraising", "#general-ardd2026"],
            "introTagline": "Seed founder, in-vivo reprogramming, raising Series A.",
        },
    },
    {
        "username": "priya_natarajan",
        "email": "priya.n@calico.demo",
        "full_name": "Dr. Priya Natarajan",
        "affiliation": "Calico Life Sciences",
        "bio": "Principal scientist working on senescence and proteostasis at scale.",
        "area_of_study": "Cellular senescence",
        "research_interests": "Senolytics, proteostasis collapse with age, mitochondrial dysfunction crosstalk.",
        "looking_for": "Academic collaborators with novel senescence models; KOL conversations on translational endpoints.",
        "location": "South San Francisco, CA",
        "ardd_meta": {
            "role": "biotech_scientist",
            "orgType": "biotech",
            "companyStage": "growth",
            "researchFocus": ["senescence", "proteostasis", "mitochondrial"],
            "businessGoals": ["find_collaborators", "recruit_talent", "meet_kols"],
            "sessionsOfInterest": [],
            "availability": ["Tue 15:00-18:00", "Wed 13:00-17:00"],
            "preferredIntroStyle": "async",
            "channels": ["#open-science", "#translational", "#general-ardd2026"],
            "introTagline": "Calico senescence scientist; love novel models.",
        },
    },
    {
        "username": "jordan_kim",
        "email": "jordan.kim@pfizer.demo",
        "full_name": "Jordan Kim",
        "affiliation": "Pfizer — Worldwide BD",
        "bio": "BD lead scouting longevity assets for partnership and licensing.",
        "area_of_study": "Translational geroscience",
        "research_interests": "Therapeutic modalities, clinical-stage geroscience, biomarker-driven trials.",
        "looking_for": "License-in candidates in senolytics and metabolic geroscience; clinical-stage partners.",
        "location": "New York, NY",
        "ardd_meta": {
            "role": "pharma_bd",
            "orgType": "pharma",
            "researchFocus": ["therapeutic_modalities", "senescence", "geroscience_clinical"],
            "businessGoals": ["license_in", "pilot_clinical_partner", "meet_kols"],
            "sessionsOfInterest": [],
            "availability": ["Tue 10:00-12:00", "Wed 14:00-18:00", "Thu 09:00-12:00"],
            "preferredIntroStyle": "direct",
            "channels": ["#translational", "#deals-and-fundraising", "#general-ardd2026"],
            "introTagline": "Pfizer BD, license-in for senolytics and clinical geroscience.",
        },
    },
    {
        "username": "helena_brandt",
        "email": "helena@brandtfo.demo",
        "full_name": "Helena Brandt",
        "affiliation": "Brandt Family Office",
        "bio": "Family-office principal deploying capital into aging biomarkers and AI-driven discovery.",
        "area_of_study": "Longevity investing",
        "research_interests": "Aging clocks, longevity biomarkers, AI-for-discovery platforms.",
        "looking_for": "Pre-seed and seed founders building biomarker or AI discovery platforms; KOL intros.",
        "location": "Zurich, CH",
        "ardd_meta": {
            "role": "investor_family_office",
            "orgType": "family_office",
            "researchFocus": ["aging_clocks", "longevity_biomarkers", "ai_drug_discovery"],
            "businessGoals": ["learn_field", "meet_kols"],   # deploying, not raising
            "sessionsOfInterest": [],
            "availability": ["Tue 11:00-18:00", "Wed 11:00-16:00"],
            "preferredIntroStyle": "warm",
            "channels": ["#deals-and-fundraising", "#general-ardd2026", "#boston-longevity-week"],
            "introTagline": "Family-office check-writer for longevity biomarkers and AI discovery.",
        },
    },
    {
        "username": "lior_bendavid",
        "email": "lior@weizmann.demo",
        "full_name": "Prof. Lior Ben-David",
        "affiliation": "Weizmann Institute",
        "bio": "PI working at the intersection of immunoaging, senescence, and cancer.",
        "area_of_study": "Immunoaging",
        "research_interests": "Senescence-immune crosstalk, immune aging clocks, cancer-aging interface.",
        "looking_for": "Biotech partners for senolytic-immune combinations; KOL conversations.",
        "location": "Rehovot, IL",
        "ardd_meta": {
            "role": "academic_pi",
            "orgType": "academia",
            "researchFocus": ["senescence", "immunoaging", "cancer_aging"],
            "businessGoals": ["find_collaborators", "license_out", "meet_kols"],
            "sessionsOfInterest": [],
            "availability": ["Wed 10:00-12:00", "Wed 15:00-17:00", "Thu 11:00-13:00"],
            "preferredIntroStyle": "warm",
            "channels": ["#open-science", "#ml-longevity", "#general-ardd2026"],
            "introTagline": "Senescence-immune PI; open to senolytic-immune combo partnerships.",
        },
    },
    {
        "username": "wen_liu",
        "email": "wen.liu@ucsf.demo",
        "full_name": "Dr. Wen Liu",
        "affiliation": "UCSF (Liu Lab)",
        "bio": "Computational biology PI applying ML to aging readouts and small-molecule discovery.",
        "area_of_study": "Computational aging biology",
        "research_interests": "ML for aging clocks, generative models for senolytics, multi-omics.",
        "looking_for": "Postdoc candidates; biotech collaborators with proprietary aging-clock datasets.",
        "location": "San Francisco, CA",
        "ardd_meta": {
            "role": "academic_pi",
            "orgType": "academia",
            "researchFocus": ["compbio_aging", "ai_drug_discovery", "aging_clocks"],
            "businessGoals": ["find_collaborators", "recruit_talent"],
            "sessionsOfInterest": [],
            "availability": ["Tue 14:00-17:00", "Wed 09:00-12:00", "Thu 13:00-16:00"],
            "preferredIntroStyle": "async",
            "channels": ["#ml-longevity", "#open-science", "#general-ardd2026"],
            "introTagline": "ML for aging clocks at UCSF; hiring postdocs.",
        },
    },
    {
        "username": "sam_okafor",
        "email": "sam@longruncap.demo",
        "full_name": "Sam Okafor",
        "affiliation": "Long Run Capital (Partner)",
        "bio": "VC partner focused on therapeutic-modality longevity bets.",
        "area_of_study": "Longevity therapeutics investing",
        "research_interests": "Partial reprogramming, senolytics, cell and gene therapy for aging.",
        "looking_for": "Seed and Series A founders in therapeutic modalities; clinical-stage geroscience.",
        "location": "London, UK",
        "ardd_meta": {
            "role": "investor_vc",
            "orgType": "vc",
            "researchFocus": ["therapeutic_modalities", "partial_reprogramming", "senescence"],
            "businessGoals": ["learn_field", "meet_kols"],   # deploying
            "sessionsOfInterest": [],
            "availability": ["Tue 09:00-18:00", "Wed 09:00-18:00"],
            "preferredIntroStyle": "direct",
            "channels": ["#deals-and-fundraising", "#startup-corner", "#general-ardd2026"],
            "introTagline": "VC partner writing seed/A checks in modality longevity bets.",
        },
    },
    {
        "username": "rosa_alvarez",
        "email": "rosa@clockworkdx.demo",
        "full_name": "Dr. Rosa Alvarez",
        "affiliation": "Clockwork Diagnostics (Co-founder)",
        "bio": "Series A founder building blood-based aging-clock diagnostics for clinical use.",
        "area_of_study": "Longevity biomarkers",
        "research_interests": "Methylation clocks, proteomic clocks, CLIA validation.",
        "looking_for": "Pharma partners for trial endpoints; KOL clinicians; Series A co-leads.",
        "location": "Boston, MA",
        "ardd_meta": {
            "role": "biotech_founder",
            "orgType": "biotech",
            "companyStage": "seriesA",
            "researchFocus": ["aging_clocks", "longevity_biomarkers", "compbio_aging"],
            "businessGoals": ["raise_capital", "pilot_clinical_partner", "meet_kols"],
            "sessionsOfInterest": [],
            "availability": ["Tue 10:00-13:00", "Wed 14:00-17:00", "Thu 10:00-13:00"],
            "preferredIntroStyle": "direct",
            "channels": ["#startup-corner", "#deals-and-fundraising", "#translational"],
            "introTagline": "Series A clock-diagnostics founder seeking pharma trial endpoints.",
        },
    },
    {
        "username": "ken_tanaka",
        "email": "ken.tanaka@takeda.demo",
        "full_name": "Dr. Ken Tanaka",
        "affiliation": "Takeda — Aging Therapeutics Unit",
        "bio": "Pharma scientist leading senolytic discovery for fibrotic disease in aging.",
        "area_of_study": "Senolytic discovery",
        "research_interests": "Senolytics, fibrosis-aging axis, target ID.",
        "looking_for": "Academic targets and tool-compound collaborations; KOL conversations.",
        "location": "Cambridge, MA",
        "ardd_meta": {
            "role": "pharma_scientist",
            "orgType": "pharma",
            "researchFocus": ["senescence", "therapeutic_modalities", "geroscience_clinical"],
            "businessGoals": ["find_collaborators", "license_in", "meet_kols"],
            "sessionsOfInterest": [],
            "availability": ["Tue 14:00-18:00", "Wed 10:00-13:00", "Thu 14:00-17:00"],
            "preferredIntroStyle": "async",
            "channels": ["#translational", "#open-science", "#general-ardd2026"],
            "introTagline": "Takeda senolytic discovery; open to academic tool-compound partnerships.",
        },
    },
]


# ---------------------------------------------------------------------------
# Sessions (15 — three days, distributed)
# ---------------------------------------------------------------------------
SESSIONS = [
    # ---- Day 1 (Tue) ----
    {
        "title": "Opening Keynote: The State of Aging Drug Discovery",
        "description": "A field-wide outlook on translational progress in aging therapeutics, biomarker readiness, and regulatory pathways.",
        "location": "Main Hall, Tivoli Congress Center",
        "start_date": at(DAY1, 9), "end_date": at(DAY1, 10),
        "ardd_meta": {
            "sessionType": "keynote",
            "topicTags": ["therapeutic_modalities", "geroscience_clinical"],
            "speakers": [{"name": "Conference Organizers", "affiliation": "ARDD 2026"}],
            "room": "Main Hall", "track": "Plenary",
        },
    },
    {
        "title": "Aging Clocks: From Methylation to Multi-Omics",
        "description": "Panel on the state of aging clocks across modalities, their clinical applicability, and validation challenges.",
        "location": "Hall A",
        "start_date": at(DAY1, 10, 30), "end_date": at(DAY1, 12),
        "ardd_meta": {
            "sessionType": "panel",
            "topicTags": ["aging_clocks", "compbio_aging", "longevity_biomarkers"],
            "speakers": [
                {"name": "Panel of aging-clock researchers", "affiliation": "Multiple"},
            ],
            "room": "Hall A", "track": "Biomarkers",
        },
    },
    {
        "title": "Partial Reprogramming: In-Vivo Safety and Efficacy",
        "description": "Latest pre-clinical data on partial OSK reprogramming and the open questions on tissue-specific safety.",
        "location": "Hall B",
        "start_date": at(DAY1, 13, 30), "end_date": at(DAY1, 15),
        "ardd_meta": {
            "sessionType": "panel",
            "topicTags": ["partial_reprogramming", "epigenetics", "therapeutic_modalities"],
            "speakers": [{"name": "Reprogramming leaders", "affiliation": "Multiple"}],
            "room": "Hall B", "track": "Therapeutic Modalities",
        },
    },
    {
        "title": "ML for Aging Drug Discovery: What's Real",
        "description": "Where machine-learning approaches actually move the needle in aging drug discovery, with honest results.",
        "location": "Hall C",
        "start_date": at(DAY1, 15, 30), "end_date": at(DAY1, 17),
        "ardd_meta": {
            "sessionType": "panel",
            "topicTags": ["ai_drug_discovery", "compbio_aging"],
            "speakers": [{"name": "ML-in-aging panel", "affiliation": "Multiple"}],
            "room": "Hall C", "track": "Computation",
        },
    },
    {
        "title": "Day 1 Welcome Mixer",
        "description": "Open networking with all attendees over drinks and snacks.",
        "location": "Garden Foyer",
        "start_date": at(DAY1, 18), "end_date": at(DAY1, 20),
        "ardd_meta": {
            "sessionType": "mixer",
            "topicTags": [],
            "speakers": [],
            "room": "Garden Foyer", "track": "Networking",
        },
    },
    # ---- Day 2 (Wed) ----
    {
        "title": "Senescence: From Mechanism to Senolytics",
        "description": "Mechanistic updates on cellular senescence and the current clinical landscape of senolytics.",
        "location": "Main Hall",
        "start_date": at(DAY2, 9), "end_date": at(DAY2, 10, 30),
        "ardd_meta": {
            "sessionType": "panel",
            "topicTags": ["senescence", "therapeutic_modalities", "geroscience_clinical"],
            "speakers": [{"name": "Senescence panel", "affiliation": "Multiple"}],
            "room": "Main Hall", "track": "Mechanisms",
        },
    },
    {
        "title": "Aging Clocks at the Bedside",
        "description": "Workshop on deploying methylation and proteomic clocks in clinical settings; CLIA pathways and pitfalls.",
        "location": "Hall A",
        "start_date": at(DAY2, 11), "end_date": at(DAY2, 12, 30),
        "ardd_meta": {
            "sessionType": "workshop",
            "topicTags": ["aging_clocks", "longevity_biomarkers", "geroscience_clinical"],
            "speakers": [{"name": "Clinical biomarker leaders", "affiliation": "Multiple"}],
            "room": "Hall A", "track": "Translation",
        },
    },
    {
        "title": "Investor Spotlight: Funding Aging in 2026",
        "description": "Investor panel on what is and isn't getting funded in longevity right now.",
        "location": "Hall B",
        "start_date": at(DAY2, 13, 30), "end_date": at(DAY2, 15),
        "ardd_meta": {
            "sessionType": "panel",
            "topicTags": ["therapeutic_modalities", "ai_drug_discovery"],
            "speakers": [{"name": "Investor panel", "affiliation": "Multiple"}],
            "room": "Hall B", "track": "Business",
        },
    },
    {
        "title": "Proteostasis, Mitochondria, and the Hallmarks Revisited",
        "description": "Mechanistic deep-dive on proteostasis collapse, mitochondrial dysfunction, and how the hallmarks connect.",
        "location": "Hall C",
        "start_date": at(DAY2, 15, 30), "end_date": at(DAY2, 17),
        "ardd_meta": {
            "sessionType": "panel",
            "topicTags": ["proteostasis", "mitochondrial", "senescence"],
            "speakers": [{"name": "Hallmarks panel", "affiliation": "Multiple"}],
            "room": "Hall C", "track": "Mechanisms",
        },
    },
    {
        "title": "Startup Pitch Showcase",
        "description": "Eight early-stage longevity startups present to investors and partners.",
        "location": "Main Hall",
        "start_date": at(DAY2, 17), "end_date": at(DAY2, 18, 30),
        "ardd_meta": {
            "sessionType": "pitch",
            "topicTags": ["therapeutic_modalities", "longevity_biomarkers", "ai_drug_discovery"],
            "speakers": [{"name": "Selected startups", "affiliation": "Multiple"}],
            "room": "Main Hall", "track": "Business",
        },
    },
    # ---- Day 3 (Thu) ----
    {
        "title": "Translational Geroscience: From Trials to Approval",
        "description": "What it takes to run a geroscience trial and the realistic regulatory pathways.",
        "location": "Main Hall",
        "start_date": at(DAY3, 9), "end_date": at(DAY3, 10, 30),
        "ardd_meta": {
            "sessionType": "panel",
            "topicTags": ["geroscience_clinical", "therapeutic_modalities"],
            "speakers": [{"name": "Translational panel", "affiliation": "Multiple"}],
            "room": "Main Hall", "track": "Translation",
        },
    },
    {
        "title": "Immune Aging and Inflammaging",
        "description": "How the aging immune system drives age-related disease and where therapeutic leverage exists.",
        "location": "Hall A",
        "start_date": at(DAY3, 11), "end_date": at(DAY3, 12, 30),
        "ardd_meta": {
            "sessionType": "panel",
            "topicTags": ["immunoaging", "senescence", "cancer_aging"],
            "speakers": [{"name": "Immunoaging panel", "affiliation": "Multiple"}],
            "room": "Hall A", "track": "Mechanisms",
        },
    },
    {
        "title": "AI and Generative Models in Aging Drug Discovery",
        "description": "Generative chemistry and protein-design models applied specifically to aging targets.",
        "location": "Hall B",
        "start_date": at(DAY3, 13), "end_date": at(DAY3, 14, 30),
        "ardd_meta": {
            "sessionType": "panel",
            "topicTags": ["ai_drug_discovery", "compbio_aging", "therapeutic_modalities"],
            "speakers": [{"name": "AI-in-drug-discovery panel", "affiliation": "Multiple"}],
            "room": "Hall B", "track": "Computation",
        },
    },
    {
        "title": "Networking Hall: BD and Partnering",
        "description": "Curated networking block for BD, partnering, and investor conversations.",
        "location": "Networking Hall B",
        "start_date": at(DAY3, 14, 30), "end_date": at(DAY3, 16),
        "ardd_meta": {
            "sessionType": "mixer",
            "topicTags": [],
            "speakers": [],
            "room": "Networking Hall B", "track": "Networking",
        },
    },
    {
        "title": "Closing Keynote: The Next Decade of Aging Therapeutics",
        "description": "Closing keynote on the next decade — what to expect, what to watch, what to build.",
        "location": "Main Hall",
        "start_date": at(DAY3, 16, 30), "end_date": at(DAY3, 17, 30),
        "ardd_meta": {
            "sessionType": "keynote",
            "topicTags": ["therapeutic_modalities", "geroscience_clinical"],
            "speakers": [{"name": "Closing speaker", "affiliation": "ARDD 2026"}],
            "room": "Main Hall", "track": "Plenary",
        },
    },
]


# Map each session title to the usernames of seeded attendees who appear
# on its speaker panel. Lets the bot's `where_speaker` intent return real hits.
SPEAKERS_BY_SESSION_TITLE = {
    "Aging Clocks: From Methylation to Multi-Omics": ["maya_chen", "wen_liu", "rosa_alvarez"],
    "Partial Reprogramming: In-Vivo Safety and Efficacy": ["alex_vargas", "lior_bendavid"],
    "ML for Aging Drug Discovery: What's Real": ["wen_liu", "maya_chen"],
    "Senescence: From Mechanism to Senolytics": ["priya_natarajan", "ken_tanaka", "lior_bendavid"],
    "Aging Clocks at the Bedside": ["rosa_alvarez", "maya_chen"],
    "Investor Spotlight: Funding Aging in 2026": ["sam_okafor", "helena_brandt"],
    "Proteostasis, Mitochondria, and the Hallmarks Revisited": ["priya_natarajan"],
    "Startup Pitch Showcase": ["alex_vargas", "rosa_alvarez"],
    "Translational Geroscience: From Trials to Approval": ["jordan_kim", "ken_tanaka"],
    "Immune Aging and Inflammaging": ["lior_bendavid"],
    "AI and Generative Models in Aging Drug Discovery": ["wen_liu"],
}


# Index of session titles → ardd_meta tag, used to fill each user's
# sessionsOfInterest by title (so changing session ids never breaks the seed)
INTERESTS_BY_USERNAME = {
    "maya_chen": ["Aging Clocks: From Methylation to Multi-Omics",
                  "Partial Reprogramming: In-Vivo Safety and Efficacy",
                  "Aging Clocks at the Bedside",
                  "Networking Hall: BD and Partnering"],
    "alex_vargas": ["Partial Reprogramming: In-Vivo Safety and Efficacy",
                    "Investor Spotlight: Funding Aging in 2026",
                    "Startup Pitch Showcase",
                    "Networking Hall: BD and Partnering"],
    "priya_natarajan": ["Senescence: From Mechanism to Senolytics",
                        "Proteostasis, Mitochondria, and the Hallmarks Revisited",
                        "Immune Aging and Inflammaging"],
    "jordan_kim": ["Senescence: From Mechanism to Senolytics",
                   "Translational Geroscience: From Trials to Approval",
                   "Networking Hall: BD and Partnering",
                   "Startup Pitch Showcase"],
    "helena_brandt": ["Aging Clocks: From Methylation to Multi-Omics",
                      "Investor Spotlight: Funding Aging in 2026",
                      "Startup Pitch Showcase",
                      "AI and Generative Models in Aging Drug Discovery"],
    "lior_bendavid": ["Senescence: From Mechanism to Senolytics",
                      "Immune Aging and Inflammaging",
                      "Translational Geroscience: From Trials to Approval"],
    "wen_liu": ["Aging Clocks: From Methylation to Multi-Omics",
                "ML for Aging Drug Discovery: What's Real",
                "AI and Generative Models in Aging Drug Discovery"],
    "sam_okafor": ["Investor Spotlight: Funding Aging in 2026",
                   "Startup Pitch Showcase",
                   "Partial Reprogramming: In-Vivo Safety and Efficacy",
                   "Networking Hall: BD and Partnering"],
    "rosa_alvarez": ["Aging Clocks: From Methylation to Multi-Omics",
                     "Aging Clocks at the Bedside",
                     "Investor Spotlight: Funding Aging in 2026",
                     "Translational Geroscience: From Trials to Approval"],
    "ken_tanaka": ["Senescence: From Mechanism to Senolytics",
                   "Proteostasis, Mitochondria, and the Hallmarks Revisited",
                   "Translational Geroscience: From Trials to Approval",
                   "Immune Aging and Inflammaging"],
}


def reset_seed(db: Session) -> None:
    """Remove every previously seeded row (ardd_meta.seed == True)."""
    # Postgres JSON cast trick: cast text and check
    deleted_events = db.query(Event).filter(
        Event.ardd_meta["seed"].as_string() == "true"
    ).delete(synchronize_session=False)
    deleted_users = db.query(User).filter(
        User.ardd_meta["seed"].as_string() == "true"
    ).delete(synchronize_session=False)
    db.commit()
    print(f"[reset] deleted {deleted_users} users, {deleted_events} events")


def get_or_create_user(db: Session, spec: dict) -> User:
    user = db.query(User).filter(
        or_(User.username == spec["username"], User.email == spec["email"])
    ).first()
    if user is None:
        user = User(
            username=spec["username"],
            email=spec["email"],
            password_hash=hash_password(DEMO_PASSWORD),
            full_name=spec["full_name"],
            bio=spec["bio"],
            affiliation=spec["affiliation"],
            area_of_study=spec["area_of_study"],
            research_interests=spec["research_interests"],
            looking_for=spec["looking_for"],
            location=spec["location"],
            role="user",
            is_superuser=False,
        )
        db.add(user)
    # Refresh ARDD metadata every run (cheap)
    meta = dict(spec["ardd_meta"])
    meta["seed"] = True
    user.ardd_meta = meta
    return user


def admin_user(db: Session) -> User:
    admin = db.query(User).filter(User.is_superuser.is_(True)).first()
    if admin is None:
        raise RuntimeError(
            "No superuser exists. Run seed_admin.py first so events can have a creator."
        )
    return admin


def get_or_create_event(db: Session, spec: dict, creator_id: int) -> Event:
    event = db.query(Event).filter(Event.title == spec["title"]).first()
    if event is None:
        event = Event(
            title=spec["title"],
            description=spec["description"],
            location=spec["location"],
            start_date=spec["start_date"],
            end_date=spec["end_date"],
            status="current",
            created_by=creator_id,
        )
        db.add(event)
    meta = dict(spec["ardd_meta"])
    meta["seed"] = True
    event.ardd_meta = meta
    event.start_date = spec["start_date"]
    event.end_date = spec["end_date"]
    event.location = spec["location"]
    event.description = spec["description"]
    event.status = "current"
    return event


def run(reset: bool = False) -> None:
    db: Session = SessionLocal()
    try:
        if reset:
            reset_seed(db)

        admin = admin_user(db)

        # ---- create sessions first, capture id by title ----
        for spec in SESSIONS:
            get_or_create_event(db, spec, creator_id=admin.id)
        db.commit()

        title_to_id = {e.title: e.id for e in db.query(Event).all()}

        # ---- create users, then patch sessionsOfInterest with real ids ----
        attendee_by_username: dict[str, dict] = {a["username"]: a for a in ATTENDEES}
        for spec in ATTENDEES:
            user = get_or_create_user(db, spec)
            db.flush()
            interest_titles = INTERESTS_BY_USERNAME.get(spec["username"], [])
            interest_ids = [title_to_id[t] for t in interest_titles if t in title_to_id]
            meta = dict(user.ardd_meta or {})
            meta["sessionsOfInterest"] = interest_ids
            user.ardd_meta = meta
        db.commit()

        # ---- patch session speakers using the attendee-as-speaker map ----
        for title, usernames in SPEAKERS_BY_SESSION_TITLE.items():
            event = db.query(Event).filter(Event.title == title).first()
            if event is None:
                continue
            speakers = [
                {
                    "name": attendee_by_username[u]["full_name"],
                    "affiliation": attendee_by_username[u]["affiliation"],
                }
                for u in usernames
                if u in attendee_by_username
            ]
            meta = dict(event.ardd_meta or {})
            meta["speakers"] = speakers
            event.ardd_meta = meta
        db.commit()

        n_users = db.query(User).filter(
            User.ardd_meta["seed"].as_string() == "true"
        ).count()
        n_events = db.query(Event).filter(
            Event.ardd_meta["seed"].as_string() == "true"
        ).count()
        print(f"[ok] seeded {n_users} attendees and {n_events} sessions")
        print(f"[info] demo password for every seeded attendee: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    run(reset="--reset" in sys.argv)
