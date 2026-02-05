# 🧠 The Brain: Persistent Memory System

## Purpose
This folder serves as the long-term memory for the Trinity Labs AI project. In the event of a chat disconnection or AI handover, **the new AI agent must read this folder first.**

## Structure
1.  **`STRATEGIC_MASTERPLAN.md`**: The "Bible" of the project. Contains the high-level vision, architecture, and current phase.
2.  **`CURRENT_STATE.md`**: A living document updated at the end of every major session, listing:
    *   What was just finished.
    *   What is currently broken.
    *   Exact next steps.
3.  **`DECISION_LOG.md`**: Records key architectural decisions (e.g., "Why we chose Supabase over Clerk", "Why we use Ledger instead of simple balance").

## Protocol for AI Agents
1.  **Start of Session**: Read `STRATEGIC_MASTERPLAN.md` and `CURRENT_STATE.md`.
2.  **End of Session**: Update `CURRENT_STATE.md` with the latest status.
