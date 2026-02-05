# Phase 3.2: CRM Foundation

## Goal
Implement the core CRM entities to anchor voice operations. Calls must be linked to "Contacts" (People) and "Accounts" (Organizations).

## 1. Database Schema
### `contacts`
- `id` UUID PK
- `organization_id` UUID FK
- `phone_e164` Text (Indexed, Unique per Org)
- `email` Text
- `name` Text
- `attributes` JSONB
- `created_at` Timestamptz

### Updates to `voice_calls`
- `contact_id` UUID FK (already added in 3.1 migration, need to populate)

## 2. Telephony Architecture
**Inbound Call Flow Update**:
1. After resolving Number & Org...
2. Lookup `contacts` by `(organization_id, caller_number)`.
3. If found -> Link `contact_id`.
4. If not found -> Create new Contact (Name: null, Phone: caller_number) -> Link `contact_id`.
5. Proceed to trace/route.

## 3. UI Modules
### `src/pages/Contacts.tsx`
- List view of contacts.
- Filter by name/phone.

### `src/pages/ContactDetail.tsx`
- Profile View.
- Activity Timeline (Voice Calls).

## 4. Acceptance Criteria
- [ ] Inbound call auto-creates a Contact if new number.
- [ ] Inbound call links to existing Contact if known number.
- [ ] Contact Detail page shows call history (Trinity Call IDs).
