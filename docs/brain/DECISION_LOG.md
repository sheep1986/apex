# Architectural Decision Log

## [2026-02-02] Pivot to Pure Supabase + Vapi Wrap
*   **Decision**: Abandoned Clerk integration.
*   **Reason**: User requested "Trinity" aesthetic control and simpler stack.
*   **Implication**: We build our own Auth UI using Supabase.
*   **Strategy**: "Vapi AI Wrap" model.
    *   **White Label**: 1 Apex Org = 1 Vapi Sub-Account.
    *   **Financials**: Prepaid Credit System (Arbitrage Model) to manage cashflow float.
