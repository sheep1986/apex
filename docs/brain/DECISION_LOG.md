# Architectural Decision Log

## [2026-02-02] Pivot to Pure Supabase + Vapi Wrap
*   **Decision**: Abandoned Clerk integration.
*   **Reason**: User requested "Trinity" aesthetic control and simpler stack.
*   **Implication**: We build our own Auth UI using Supabase.
*   **Strategy**: "Vapi AI Wrap" model.
    *   **White Label**: 1 Apex Org = 1 Vapi Sub-Account.
    *   **Financials**: Prepaid Credit System (Arbitrage Model) to manage cashflow float.

## [2026-02-11] Full Clerk Removal — No Exceptions
*   **Decision**: Remove @clerk/clerk-react and ALL Clerk references from entire codebase (~65 files).
*   **Reason**: Dead dependency causing import errors. App still wraps in ClerkProvider despite migration to Supabase. Creates confusion, bloat, and potential security surface.
*   **Implication**: main.tsx rewritten, ~20 files deleted, all auth flows verified against Supabase only.

## [2026-02-11] No n8n — Build Our Own
*   **Decision**: Do not integrate n8n for campaign execution or workflow automation.
*   **Reason**: Protects IP value, eliminates external dependency, reduces security surface area, massively increases acquisition value. Sean's direct instruction.
*   **Implication**: Campaign execution uses PgBoss (PostgreSQL-native job queue via Supabase) + Netlify scheduled functions. All workflow logic is custom TypeScript.

## [2026-02-11] No Railway Backend
*   **Decision**: Remove Railway from the stack entirely.
*   **Reason**: Railway backend was already broken. Simplify to Supabase + Netlify Functions only. PgBoss handles job queuing without needing a persistent server.
*   **Implication**: All API endpoints are Netlify Functions. Long-running jobs use PgBoss polling from scheduled functions.

## [2026-02-11] White-Label Everything
*   **Decision**: Customers never see Vapi, Twilio, Deepgram, or any infrastructure provider name.
*   **Reason**: Sean's direct instruction — protect the brand, maintain value perception, prevent customers from bypassing Trinity.
*   **Implication**: All API calls proxied through Trinity backend. Recording URLs re-hosted. No provider branding in UI, emails, or documentation.

## [2026-02-11] Self-Service Platform
*   **Decision**: Trinity is a self-service SaaS. Customers log in and manage their own setup.
*   **Reason**: Sean wants scalability without needing his team to hand-hold every deployment.
*   **Implication**: UX must be bulletproof. Onboarding wizard required. Help center required. Tutorials required.

## [2026-02-11] NHS-Grade Architecture From Day One
*   **Decision**: Build the platform to NHS/healthcare compliance standards from the start.
*   **Reason**: NHS is the hardest use case (DPA verification, data residency, DSPT compliance). If we build for NHS, every other vertical is trivial.
*   **Implication**: PII redaction, encrypted storage, audit trails, data retention policies, consent management — all built into the core, not bolted on later.

## [2026-02-11] Deploy to Easy Verticals First
*   **Decision**: Despite NHS-grade architecture, first deployments target telesales/lead gen, then estate agents and RTA legal.
*   **Reason**: Faster time to revenue. Validates platform. Generates case studies. NHS procurement takes 3-6 months minimum.
*   **Implication**: Phase 2 (MVP) targets outbound campaign use cases. Phase 3 adds NHS-specific features.

## [2026-02-11] Tool Responsibilities Split
*   **Decision**: Claude Code handles all source code and architecture. Manus AI handles external dashboard/account access (Stripe, Supabase, Twilio, Vapi, Netlify consoles).
*   **Reason**: Claude Code cannot access external web dashboards. Manus AI has access to Sean's accounts.
*   **Implication**: Any task requiring dashboard configuration (API keys, webhook URLs, environment variables) is delegated to Manus via Sean.
