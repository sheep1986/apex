# Trinity Labs AI — Strategic Masterplan

**Version**: 1.0
**Created**: 2026-02-11
**Owner**: Sean Wentz
**Status**: ACTIVE — This is the project bible.

---

## 1. VISION

Trinity is an AI-powered voice reception and campaign platform that replaces human call handlers for corporate clients. The benchmark use case is **NHS GP surgery reception** — if Trinity can handle secure patient verification (DPA), symptom triage, appointment booking, and warm transfer to human receptionists with full context summaries, then every other vertical (energy, estate agents, legal, telesales) is trivially simple.

**Tagline**: "Vapi, Google, and Zoho — in a box."

**Acquisition Target**: Build to a standard that Meta or Google would acquire.

---

## 2. LOCKED DECISIONS

These decisions are final. Do not revisit.

| # | Decision | Date | Rationale |
|---|----------|------|-----------|
| 1 | Supabase for auth + database | 2026-02-02 | Full control over UI, simpler stack, RLS built-in |
| 2 | Clerk REMOVED entirely | 2026-02-11 | Dead dependency, causes import errors, replaced by Supabase Auth |
| 3 | Vapi AI as voice infrastructure | 2026-02-02 | White-label wrap model, pre-built voice AI |
| 4 | Twilio for phone numbers | 2026-02-02 | Wider country coverage than Vapi's native numbers |
| 5 | Stripe for payments | 2026-02-02 | Industry standard, handles subscriptions + one-off credits |
| 6 | Netlify for frontend + functions | 2026-02-04 | Already deployed, works well for edge functions |
| 7 | NO n8n | 2026-02-11 | Build our own — protects IP value, reduces security surface, increases acquisition value |
| 8 | NO Railway backend | 2026-02-11 | Use PgBoss (PostgreSQL-native job queue via Supabase) + Netlify scheduled functions |
| 9 | White-label everything | 2026-02-11 | Customers never see Vapi, Twilio, or any provider. All proxied through Trinity |
| 10 | Self-service platform | 2026-02-11 | Customers log in and manage their own assistants, campaigns, numbers |
| 11 | NHS-grade architecture from day one | 2026-02-11 | Build for the hardest use case, deploy to easier ones first |
| 12 | Trinity website is separate project | 2026-02-11 | Marketing + waitlist site. React app at /login IS the product |

---

## 3. TARGET MARKET

### Primary Verticals (Sean's existing client base)
1. **NHS / Healthcare** — AI reception, DPA verification, appointment booking, triage, warm transfer
2. **Energy Suppliers** — Inbound billing/meter queries, outbound debt collection, tariff campaigns
3. **Estate Agents** — Inbound property enquiries, viewing booking, outbound lead qualification
4. **RTA Legal** — Outbound accident lead qualification, inbound claim status
5. **Outbound Telesales / Lead Gen** — Campaign management, script optimization, CRM integration

### Deployment Order (revenue-first strategy)
| Order | Vertical | Complexity | Time to First Contract |
|-------|----------|-----------|----------------------|
| 1st | Outbound telesales / lead gen | LOW | 2-4 weeks after MVP |
| 2nd | Estate agents | MEDIUM | 4-6 weeks |
| 3rd | RTA legal | MEDIUM | 4-6 weeks |
| 4th | Energy suppliers | HIGH | 8-12 weeks |
| 5th | NHS | VERY HIGH | 3-6 months (compliance) |

---

## 4. TECH STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite + TypeScript | SPA product dashboard |
| UI Library | Radix UI + Tailwind CSS | Component system |
| State | Zustand + React Context | Client state management |
| Charts | Recharts | Analytics visualizations |
| Visual Editor | ReactFlow | Squad/workflow builder |
| Auth | Supabase Auth | Email/password + OAuth (Google, Apple) |
| Database | Supabase PostgreSQL | Multi-tenant with RLS |
| Job Queue | PgBoss (via Supabase PostgreSQL) | Campaign execution, scheduled tasks |
| Backend API | Netlify Functions | Serverless API endpoints |
| Voice AI | Vapi AI (proxied) | Assistant management, call handling |
| Telephony | Twilio (proxied) | Phone number provisioning |
| Payments | Stripe | Subscriptions + credit top-ups |
| Email | SendGrid | Transactional emails, notifications |
| Hosting | Netlify | Frontend + functions deployment |
| Error Tracking | Sentry (to add) | Production error monitoring |
| Realtime | Supabase Realtime | Live call updates, notifications |

---

## 5. PRICING MODEL (Updated 2026-02-13)

### Business Model: "We Provide Everything"
Customers pick a plan and go. Trinity provides all infrastructure — voice AI, phone numbers, transcription, LLM, telephony. No customer-facing API keys.

### Subscription Tiers (IMPLEMENTED)
| Tier | Monthly | Included Minutes | Overage/min | Assistants | Phone Numbers | Concurrent | Users |
|------|---------|-----------------|-------------|------------|---------------|------------|-------|
| Starter | $199 | 1,000 | $0.15 | 3 | 1 | 2 | 3 |
| Growth | $599 | 5,000 | $0.12 | 10 | 5 | 5 | 10 |
| Business | $1,499 | 15,000 | $0.10 | 25 | 15 | 20 | 50 |
| Enterprise | Custom | Negotiated | Negotiated | Unlimited | Unlimited | Unlimited | Unlimited |

Source of truth: `src/config/plans.ts`

### Stripe Price IDs (LIVE)
| Plan | Base Price ID | Overage Price ID |
|------|--------------|------------------|
| Starter | price_1T08lxDN0rITNR2gtCDhYf3H | price_1T08mEDN0rITNR2gBC4YuQRI |
| Growth | price_1T08lyDN0rITNR2gJtkcuCAT | price_1T08mFDN0rITNR2g1XwUfQSM |
| Business | price_1T08lzDN0rITNR2gM2Bo5HbF | price_1T08mHDN0rITNR2gBTmYyIat |

### COGS (Cost of Goods Sold)
- Vapi platform fee: ~$0.05/min
- LLM (GPT-4o-mini): ~$0.004/min
- TTS (ElevenLabs): ~$0.04/min
- STT (Deepgram): ~$0.008/min
- Telephony (Twilio): ~$0.013/min
- **Total COGS: ~$0.085-0.10/min**
- **Starter margin: ~53% | Growth margin: ~40% | Business margin: ~35%**

### Overage Credits
Customers top up a credit balance that's only consumed for minutes beyond their plan's included amount. Top-up options: $10, $25, $50, $100 via Stripe checkout.

### Revenue Projections (100 customers, 3-month target)
- Mix: 60 Starter + 30 Growth + 10 Business = ~$44,840/mo gross
- Est. usage costs: ~$15-20K/mo
- **Net profit: ~$25-30K/mo**

---

## 6. DATABASE ARCHITECTURE

### Core Tables (Existing + Required)
```
organizations                    -- The tenant
  profiles                       -- Users within an org
  organization_members           -- Membership + roles
  organization_controls          -- Spend limits, governance flags

assistants                       -- AI voice agents (mirrors Vapi)
  assistant_tools                -- M2M: which tools an assistant uses

voice_tools                      -- Function/webhook definitions
voice_files                      -- Knowledge base documents
voice_squads                     -- Multi-agent routing configs

phone_numbers                    -- Twilio numbers assigned to orgs
  inbound_routes                 -- Routing rules for inbound calls
  forwarding_targets             -- Human transfer destinations

campaigns                        -- Outbound campaign definitions
  campaign_items                 -- Individual contacts to call

voice_calls                      -- All call records
  voice_call_events              -- Event stream per call
  voice_call_finalisations       -- Idempotency lock
  voice_call_private             -- Transcripts, recordings (service-role only)
  voice_call_recordings          -- Recording references
  call_state_transitions         -- State machine audit trail

crm_leads                        -- Contact/lead records
crm_deals                        -- Sales pipeline deals

credits_ledger                   -- Financial double-entry ledger
conversation_outcome_rules       -- Regex-based call outcome classification
workflow_hooks                   -- Post-call webhook triggers
workflow_hook_logs               -- Hook execution audit

audit_logs                       -- Immutable system audit trail

-- NEW TABLES NEEDED:
dnc_lists                        -- Do Not Call registers per org
dnc_entries                      -- Individual DNC phone numbers
subscription_plans               -- Stripe plan mapping
invoices                         -- Invoice records
notification_preferences         -- Per-user notification settings
announcements                    -- Platform-wide feature announcements
help_articles                    -- Help center content
onboarding_progress              -- Per-org onboarding checklist state
data_retention_policies          -- GDPR retention config per org
staff_access_sessions            -- Support team access audit
api_keys                         -- Customer-facing API keys
```

---

## 7. PHASED BUILD PLAN

### Phase 1: Foundation Fix
**Goal**: App boots cleanly, auth works end-to-end, no dead code, clean build.

Key tasks:
- Remove Clerk entirely (package.json, main.tsx, all imports)
- Fix main.tsx to use only Supabase Auth
- Clean dead Vercel proxy references from netlify.toml
- Verify all routes work behind ProtectedRoute
- Ensure RLS policies don't recurse
- Delete dead/backup files (App.backup.tsx, main.debug.tsx, etc.)
- Get `npm run build` passing with zero errors

### Phase 2: Core Product (Minimum Sellable Product)
**Goal**: Close first telesales/lead gen contract.

- Assistant Management (full Vapi CRUD via UI)
- Phone Number Management (Twilio search/purchase/assign via UI)
- Campaign Engine (PgBoss queue, upload contacts, launch, monitor)
- Call Dashboard (transcripts, recordings, outcomes, sentiment)
- Credit System (Stripe checkout, auto-deduction, low balance alerts, auto top-up)
- Basic CRM (auto-create contacts from calls, outcome tagging)
- Warm Transfer (handoff to human with AI summary)
- Onboarding Wizard (guided setup for new customers)

### Phase 3: Enterprise Grade (NHS-Ready)
**Goal**: Pass security questionnaires, handle compliance requirements.

- DPA Verification Framework (tool calling templates)
- Custom Tool Builder (UI for webhook-based tools)
- Multi-Language (100+ languages via Azure TTS, auto-detection)
- GDPR Controls (retention policies, right to erasure, consent tracking)
- DNC Management (TPS/CTPS for UK, custom lists)
- Audit Trail (complete event logging)
- External CRM Connectors (webhook framework + Salesforce, HubSpot, Zoho pre-built)
- Staff Access (DPA-controlled support team access with session audit)
- Recording Consent (configurable announcement at call start)
- Data Residency (download recordings from Vapi, re-host on UK storage)

### Phase 4: Scale & Polish
**Goal**: Product feels like it's worth acquiring.

- Owner Admin Dashboard (MRR, churn, customer health, system status)
- Customer Communication (in-app messaging, feature announcements)
- AI Help Center (AI-driven support, tutorials, documentation)
- Analytics V2 (ROI calculators, A/B testing, conversion funnels)
- Customer API (self-service API keys with docs)
- White-label Sub-Accounts (agencies give their clients logins)
- Booking System Integrations (Calendly, Cal.com, industry-specific)
- Feature Flags (PostHog or custom, for zero-downtime releases)
- Mobile Responsive Polish
- Accessibility (WCAG compliance)

---

## 8. NHS USE CASE — TECHNICAL SPEC

### Call Flow
1. Patient calls GP surgery number
2. Trinity AI answers immediately (zero wait time)
3. AI greets, explains it's an AI assistant, begins DPA verification
4. **Tool call: `verifyPatientDPA`** — queries surgery patient database via customer-hosted webhook
5. AI confirms identity, asks reason for call
6. AI triages: appointment booking, prescription, test results, transfer to human, general info
7. **Tool call: `bookAppointment`** (if applicable) — queries surgery booking system
8. If human intervention needed: **Vapi `transferCall` tool** — warm transfer to receptionist
9. **Pre-transfer: `prepareHandoff` tool** — pushes DPA-verified summary to receptionist's screen
10. Receptionist picks up with full context — patient doesn't repeat themselves
11. Post-call: transcript stored securely, summary pushed to patient record, outcome logged

### Integration Model
- **V1**: Customer provides webhook URLs for DPA verification + appointment booking. Trinity sends structured requests, customer's IT handles CRM lookup.
- **V2**: Pre-built connectors for EMIS Web, SystmOne (requires partnership agreements).
- **V3**: Direct NHS Spine integration (requires NHS Digital certification).

### Compliance Requirements
- NHS DSPT (Data Security and Protection Toolkit) registration
- UK GDPR compliance
- Call recording with consent announcement
- Data residency: recordings stored in UK
- Penetration test report
- Business continuity plan

---

## 9. WHITE-LABEL ARCHITECTURE

### What Customers See
- Trinity branding only (or their own branding on Agency tier)
- `app.trinitylabs.ai` or custom domain
- No mention of Vapi, Twilio, Deepgram, or any provider anywhere

### How It Works
```
Customer Dashboard (React)
    |
    v
Trinity API (/api/* via Netlify Functions)
    |
    +---> Supabase (auth, data, RLS)
    |
    +---> Vapi API (proxied, customer never sees)
    |       - Assistants CRUD
    |       - Call initiation
    |       - Webhook receiving
    |
    +---> Twilio API (proxied, customer never sees)
    |       - Number search/purchase
    |       - Number management
    |
    +---> Stripe API
            - Subscriptions
            - Credit purchases
            - Invoice generation
```

### Provider Abstraction
All provider-specific code lives behind interfaces. If we swap Vapi for Retell, or Twilio for Telnyx, the frontend and business logic don't change. Only the provider implementation changes.

---

## 10. COMPETITIVE POSITION

```
Enterprise ($50K+/yr): Cognigy, Parloa, Calldesk
    |
Mid-Market ($5K-$50K/yr): Air AI, Synthflow Enterprise
    |
SMB SaaS ($500-$5K/yr): <-- TRINITY
    |
Developer API: Vapi, Retell, Bland <-- TRINITY'S INFRASTRUCTURE
```

### Direct Competitor: Synthflow AI
- They already have agency/white-label, assistant builder, CRM integrations
- Their weakness: weaker on outbound campaigns, no NHS-grade compliance
- Trinity edge: full campaign management, governance/audit, credit ledger, multi-tenant from day one

### Trinity's Moat
1. NHS-grade security and compliance (most competitors can't touch healthcare)
2. Full campaign engine (outbound dialer + inbound in one platform)
3. Real financial accounting (double-entry credit ledger, not simple balance)
4. Provider-agnostic architecture (can swap Vapi/Twilio without customer impact)
5. Vertical-specific templates (pre-built agents for NHS, estate agents, legal, energy)

---

## 11. AI HANDOVER PROTOCOL

### For Any AI Agent Starting a Session:
1. Read `docs/brain/STRATEGIC_MASTERPLAN.md` (this file)
2. Read `docs/brain/CURRENT_STATE.md`
3. Read `docs/brain/DECISION_LOG.md`
4. Check git log for recent changes
5. Check `docs/brain/PHASE_TRACKER.md` for current phase and task

### At End of Every Session:
1. Update `CURRENT_STATE.md` with:
   - What was completed
   - What is currently broken
   - Exact next steps (file names, function names)
2. Update `DECISION_LOG.md` if any architectural decisions were made
3. Update `PHASE_TRACKER.md` with task completion status
4. Commit the brain updates

### If Connection Lost:
- Brain directory is the source of truth
- New AI reads the brain, checks git log, continues from last known state
- No work is lost because all code changes are in files, not just chat history

---

## 12. TOOL RESPONSIBILITIES

### Claude Code (Primary AI — Code & Architecture)
- All source code (TypeScript, React, SQL, CSS)
- Database schema and migrations
- API functions (Netlify)
- Frontend pages and components
- Business logic and integrations
- Documentation and brain updates
- Git commits

### Manus AI (External Account Access)
- Supabase Dashboard (project setup, extensions, logs)
- Stripe Dashboard (products, prices, webhooks)
- Twilio Console (credentials, number inventory)
- Vapi Dashboard (API keys, webhook URLs)
- Netlify Dashboard (env vars, deploy settings, domains)
- SendGrid (API keys, domain verification)
- DNS configuration

### Sean (Founder)
- Strategic decisions
- Client relationships
- Business development
- Final approval on plans and architecture
- Testing with real clients

---

## 13. INFRASTRUCTURE BUDGET

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Supabase | Pro | $25 |
| Netlify | Pro | $19 |
| Vapi | Growth (pre-fund) | $100-500 (usage) |
| Twilio | Pay-as-you-go | $20-100 (numbers + usage) |
| Stripe | Standard | 2.9% + 30c per transaction |
| SendGrid | Free (40K emails/month) | $0 |
| Sentry | Developer | $0 (free tier) |
| **Total fixed** | | **~$65-75/month** |
| **Total with usage** | | **~$150-500/month** |

---

## 14. SUCCESS METRICS

### Platform Health
- Build passes with zero errors
- All pages load without console errors
- Auth flow completes in < 3 seconds
- API response times < 500ms
- Zero PII in logs

### Business Metrics (Post-Launch)
- Time to first paying customer: < 4 weeks after Phase 2
- MRR target month 1: $500
- MRR target month 3: $5,000
- MRR target month 6: $20,000
- Churn rate target: < 5% monthly
- NPS target: > 50

### Technical Metrics
- Test coverage: > 60% by Phase 3
- Deployment frequency: daily
- Mean time to recovery: < 1 hour
- Uptime: 99.9%

---

*This document is the single source of truth for the Trinity project. All AI agents, all decisions, all architecture flows from here. Update it as the project evolves.*
