# ARDD Connect: Product Specification

## 1. Overview
**ARDD Connect** is a high-fidelity networking and engagement platform tailored specifically for the **Aging Research and Drug Discovery (ARDD) conference**. Available on Web and Mobile, it transforms the conference experience from a passive schedule into an active, intelligent collaboration ecosystem.

## 2. Core Functional Pillars

### A. Intelligent Networking (The Match Engine)
*   **What it is**: A multi-tiered matching system that connects attendees based on scientific and business synergy.
*   **How it works**:
    1.  **Tag Similarity**: Calculates Jaccard overlap between research interests (e.g., "Partial Reprogramming", "Aging Clocks").
    2.  **Strategic Alignment**: Prioritizes cross-functional matches (e.g., matching a "Biotech Founder" with an "Investor" or "Pharma BD").
    3.  **Semantic Synthesis**: Uses LLM-based reasoning to explain *why* two people should meet, referencing specific fields from their profiles.

### B. AI Conference Assistant (The ARDD Bot)
*   **What it is**: A context-aware chatbot that serves as a personal conference concierge.
*   **How it works**:
    1.  **Knowledge Base**: Indexed conference schedule, speaker biographies, and venue logistics.
    2.  **RAG Architecture**: Uses Retrieval-Augmented Generation to ensure answers are grounded in real conference data.
    3.  **Interactive Discovery**: Can recommend sessions based on user interests or find experts in specific longevity niches.

### C. Expert Profile Claiming
*   **What it is**: An onboarding shortcut for high-profile speakers and researchers.
*   **How it works**:
    1.  **Dataset Sync**: Integrates with the official ARDD speaker directory (`agingpharma_profiles.csv`).
    2.  **Email Validation**: When a speaker registers with their professional email, the system automatically detects their legacy profile.
    3.  **Instant Populating**: One-click "claiming" populates their profile with affiliation, bio, and expertise, ensuring a rich directory from day one.

### D. Dynamic Conference Feed & Smart Schedule
*   **Personalized Agenda**: Sessions are scored and ranked based on a user's research focus.
*   **Real-time Feed**: A social layer for sharing insights, photos from Copenhagen, and session takeaways.
*   **Direct Messaging**: Real-time professional communication enabled immediately after a match is made.

## 3. Technical Stack

### Backend (FastAPI)
*   **Asynchronous Performance**: Built with FastAPI for rapid, non-blocking API responses.
*   **Relational Integrity**: PostgreSQL with SQLAlchemy ORM.
*   **Matching Logic**: Custom Python algorithms for deterministic matching + OpenAI/Gemini for semantic reasoning.

### Frontend (React)
*   **Modern Web**: React 18 with TypeScript.
*   **Design Tokens**: Custom design system using Tailwind CSS, focusing on a "Modern Lab" aesthetic.
*   **Responsive**: Fully optimized for desktop and mobile web views.

### Mobile (React Native / Expo)
*   **Native Experience**: Built with Expo for native performance on iOS and Android.
*   **File-Based Routing**: Expo Router for clean, scalable navigation.
*   **State Management**: Zustand for lightweight, high-performance state handling.

---

# Pitch: ARDD Connect — Accelerating Longevity Collaboration

**The Hook**: "Scientific breakthroughs don't happen in a vacuum; they happen when the right minds collide. But at a massive conference like ARDD, those collisions are often left to chance. We built ARDD Connect to turn chance into certainty."

**The Problem**: Every year, thousands of researchers and investors gather in Copenhagen. They have three days to find their next collaborator, their next hire, or their next lead investor. Standard conference apps are just digital pamphlets—static, boring, and disconnected.

**The Solution**: **ARDD Connect**. It is the **Networking Accelerator** for the longevity field.

**Why It Wins**:
1.  **Day Zero Value**: Most apps are empty on day one. Ours isn't. With our **Expert Claiming** system, we've pre-seeded the directory with hundreds of world-class scientists. They don't fill out profiles; they *claim* them.
2.  **The "Why" Behind the Match**: We don't just show you a list of names. Our **Match Engine** tells you exactly *why* you should talk to Maya Chen or Alex Vargas—whether it's her data on biological clocks or his need for Series A funding.
3.  **The ARDD Bot**: It’s like having the conference organizer in your pocket. "Where is the senolytics panel?" "Who here is an expert in epigenetic clocks?" The bot knows, and it answers instantly.

**Closing**: "ARDD Connect doesn't just manage your schedule; it manages your professional future. By connecting the longevity ecosystem more intelligently, we're not just building an app—we're accelerating the science of human healthspan."
