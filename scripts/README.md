# Apex AI Scripts

Helper scripts for managing campaigns, VAPI calls, and diagnostics.

## Campaign Automation

Located in `campaign-automation/`:

- **automated-campaign-processor.cjs** - Main campaign processor that monitors and executes campaigns automatically
- **campaign-lead-creator.cjs** - Automatically creates leads from CSV when campaigns are created
- **start-campaign-processor.cjs** - Simulated campaign processor (for testing)
- **check-duplicate-leads.cjs** - API server for checking duplicate phone numbers
- **minimal-api-server.cjs** - Lightweight API server for serving campaign data

### Running Campaign Automation
```bash
# Start all services
SUPABASE_ANON_KEY=your_key node scripts/campaign-automation/automated-campaign-processor.cjs &
SUPABASE_ANON_KEY=your_key node scripts/campaign-automation/campaign-lead-creator.cjs &
SUPABASE_ANON_KEY=your_key node scripts/campaign-automation/check-duplicate-leads.cjs &
```

## VAPI Calls

Located in `vapi-calls/`:

- **make-real-vapi-call.cjs** - Makes real VAPI calls for existing campaigns
- **call-new-campaign.cjs** - Initiates calls for newly created campaigns
- **reset-and-call-again.cjs** - Resets lead status and makes new calls
- **complete-initiated-calls.cjs** - Marks initiated calls as completed (for testing)

### Making VAPI Calls
```bash
# Make a real call
SUPABASE_ANON_KEY=your_key node scripts/vapi-calls/make-real-vapi-call.cjs

# Call specific campaign
SUPABASE_ANON_KEY=your_key node scripts/vapi-calls/call-new-campaign.cjs
```

## Diagnostics

Located in `diagnostics/`:

- **check-campaign-calls-status.cjs** - Shows detailed campaign and call status
- **check-latest-campaign.cjs** - Displays the most recent campaign
- **check-specific-campaign.cjs** - Checks a specific campaign by ID
- **check-active-campaigns.cjs** - Lists all active campaigns
- **diagnose-campaign-calls.cjs** - Diagnoses call issues
- **check-vapi-resources.cjs** - Verifies VAPI assistants and phone numbers
- **fix-campaign-leads.cjs** - Fixes missing leads from CSV data

### Running Diagnostics
```bash
# Check campaign status
SUPABASE_ANON_KEY=your_key node scripts/diagnostics/check-campaign-calls-status.cjs

# Check latest campaign
SUPABASE_ANON_KEY=your_key node scripts/diagnostics/check-latest-campaign.cjs
```

## Environment Variables

All scripts require:
```bash
export SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Stopping Services

```bash
# Stop all services
pkill -f "campaign-processor\|lead-creator\|duplicate-leads"
```