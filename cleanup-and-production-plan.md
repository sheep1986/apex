# Apex Platform - Production Readiness Plan

## Current State Assessment

### Database Status
- **36 campaigns** (31 are test data)
- **7 leads** (mostly test)
- **26 calls** (test calls)
- **Multiple duplicate tables** and unused endpoints

### Critical Issues
1. **Railway backend is broken** - No webhook processing
2. **No automatic call processing** - Manual intervention required
3. **OpenAI lead qualification not working** - CRM not updating
4. **Test data everywhere** - Dashboard shows dummy data
5. **No phone number rotation** - Will be blocked quickly
6. **No rate limiting** - System will crash at scale

## Phase 1: Emergency Cleanup (2-3 days)

### Data Cleanup
```sql
-- Backup real data first
CREATE TABLE campaigns_backup AS SELECT * FROM campaigns WHERE name = 'Emerald Green Energy Demo';

-- Delete test campaigns and related data
DELETE FROM calls WHERE campaign_id IN (
  SELECT id FROM campaigns WHERE 
  name LIKE '%test%' OR 
  name LIKE '11%' OR 
  name LIKE '12%' OR
  name = 'TST001'
);

DELETE FROM leads WHERE campaign_id IN (
  SELECT id FROM campaigns WHERE 
  name LIKE '%test%' OR 
  name LIKE '11%'
);

DELETE FROM campaigns WHERE id NOT IN (
  SELECT id FROM campaigns WHERE name = 'Emerald Green Energy Demo'
);
```

### File Cleanup
- Remove test scripts: `rm *.cjs` (after backing up important ones)
- Clean unused backend services
- Remove test API endpoints

## Phase 2: Fix Core Infrastructure (Week 1)

### 1. Backend Server
```javascript
// Option A: Fix Railway
- Reconnect Railway to Supabase
- Fix authentication flow
- Test webhook processing

// Option B: Move to Render.com
- Deploy backend to Render
- Set up environment variables
- Configure automatic deploys
```

### 2. Campaign Processor
```javascript
// Create automated campaign processor
class CampaignProcessor {
  constructor() {
    this.queue = new Bull('campaign-calls');
    this.maxCallsPerMinute = 10;
    this.phoneNumbers = [/* 12 numbers */];
  }
  
  async processCampaign(campaignId) {
    // 1. Get leads to call
    // 2. Check time windows
    // 3. Rate limit calls
    // 4. Rotate phone numbers
    // 5. Make calls via VAPI
    // 6. Process webhooks
    // 7. Update database
  }
}
```

### 3. OpenAI Lead Qualification
```javascript
// Fix AI lead scoring
async function qualifyLead(transcript) {
  const response = await openai.createCompletion({
    model: "gpt-3.5-turbo",
    messages: [{
      role: "system",
      content: "Analyze this call and score lead quality 1-10..."
    }, {
      role: "user",
      content: transcript
    }]
  });
  
  return {
    score: response.score,
    qualified: response.score >= 7,
    nextAction: response.nextAction,
    notes: response.summary
  };
}
```

## Phase 3: Scale Preparation (Week 2)

### Infrastructure Upgrades
- [ ] Upgrade Supabase to Pro ($25/month)
- [ ] Upgrade VAPI to Growth plan ($500/month)
- [ ] Purchase 12 UK phone numbers ($12/month)
- [ ] Set up monitoring (Better Stack)

### Performance Optimization
```sql
-- Add indexes for performance
CREATE INDEX idx_calls_campaign_id ON calls(campaign_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_campaigns_org_id ON campaigns(organization_id);
```

### Rate Limiting & Phone Rotation
```javascript
const phoneRotation = {
  numbers: ['+44xxx001', '+44xxx002', /* ... 12 total */],
  currentIndex: 0,
  
  getNext() {
    const number = this.numbers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.numbers.length;
    return number;
  },
  
  // Max 166 calls per number per day
  getDailyLimit(number) {
    return 166;
  }
};
```

## Phase 4: Testing & Launch (Week 3)

### Testing Schedule
1. **Day 1-2**: Test with 100 calls/day
2. **Day 3-4**: Test with 500 calls/day
3. **Day 5-6**: Test with 1000 calls/day
4. **Day 7**: Launch 2000 calls/day

### Monitoring Dashboard
- Real-time call status
- Cost tracking
- Success rates
- Lead qualification scores
- System health metrics

## Cost Summary

### Monthly Infrastructure
- Supabase Pro: £20
- Backend hosting: £20
- Phone numbers (12): £12
- VAPI Growth: £400
- Monitoring: £20
- **Total: £472/month**

### Per Campaign Costs (2000 calls/day)
- VAPI call costs: £4,100/month
- Total with infrastructure: £4,572/month
- Charge client: £10,000/month
- **Profit: £5,428/month**

## Priority Action Items

### Immediate (Today)
1. Backup all data
2. Clean test campaigns
3. Fix Railway or migrate backend

### This Week
1. Build campaign processor
2. Fix OpenAI integration
3. Set up phone rotation
4. Implement rate limiting

### Next Week
1. Purchase phone numbers
2. Upgrade services
3. Test at scale
4. Monitor and optimize

## Success Metrics
- ✅ 2000 calls/day capacity
- ✅ <1% error rate
- ✅ 95% uptime
- ✅ Automatic lead qualification
- ✅ Real-time dashboard
- ✅ Cost under £5/1000 calls