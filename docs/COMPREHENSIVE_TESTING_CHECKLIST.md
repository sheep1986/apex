# APEX Platform - Comprehensive Testing Checklist

## Pre-Testing Setup
- [ ] Ensure all database fixes are applied (leads table, phone_numbers table)
- [ ] Verify VAPI credentials are configured
- [ ] Have test phone numbers ready
- [ ] Clear browser cache and cookies
- [ ] Have browser developer console open (F12)

---

## 1. AUTHENTICATION & ACCESS TESTING

### 1.1 Login Flow
- [ ] Navigate to https://aquamarine-klepon-bcb066.netlify.app
- [ ] Test login with valid credentials
- [ ] Verify redirect to dashboard after login
- [ ] Test logout functionality
- [ ] Test "Remember me" functionality
- [ ] Test password reset flow
- [ ] Verify session persistence across browser refresh
- [ ] Check for any console errors during auth

### 1.2 Role-Based Access
- [ ] Login as admin - verify full menu access
- [ ] Login as client_admin - verify restricted menu
- [ ] Login as agent - verify limited access
- [ ] Test unauthorized page access attempts
- [ ] Verify proper error messages for restricted areas

---

## 2. FRONTEND FUNCTIONALITY TESTING

### 2.1 Dashboard
- [ ] Dashboard loads without errors
- [ ] All widgets display correctly
- [ ] Real-time stats update properly
- [ ] Charts and graphs render correctly
- [ ] Recent calls list populates
- [ ] Campaign cards show correct data
- [ ] No 400/404/500 errors in console
- [ ] Page is responsive on mobile/tablet

### 2.2 Campaign Management
- [ ] List all campaigns
- [ ] Create new campaign
  - [ ] Enter campaign name
  - [ ] Set working hours
  - [ ] Configure call settings
  - [ ] Select assistant
  - [ ] Select phone number
  - [ ] Save successfully
- [ ] Edit existing campaign
  - [ ] Change settings
  - [ ] Update and save
  - [ ] Verify changes persist
- [ ] Delete campaign (if applicable)
- [ ] Pause/Resume campaign
- [ ] View campaign details
- [ ] Export campaign data

### 2.3 Leads Management
- [ ] View all leads
- [ ] Add single lead manually
  - [ ] First name
  - [ ] Last name
  - [ ] Phone number
  - [ ] Email
  - [ ] Additional fields
- [ ] Import leads via CSV
  - [ ] Upload CSV file
  - [ ] Map columns correctly
  - [ ] Validate data
  - [ ] Import successfully
- [ ] Edit lead information
- [ ] Delete leads
- [ ] Filter leads by status
- [ ] Search leads
- [ ] Assign leads to campaigns
- [ ] View lead history/timeline

### 2.4 Phone Numbers
- [ ] List available phone numbers
- [ ] No errors loading phone numbers
- [ ] Filter by country/status
- [ ] Assign to campaigns
- [ ] View usage statistics

### 2.5 Call Management
- [ ] View all calls
- [ ] Filter calls by:
  - [ ] Date range
  - [ ] Status
  - [ ] Campaign
  - [ ] Outcome
- [ ] View call details modal
  - [ ] Duration displays correctly
  - [ ] Cost calculation accurate
  - [ ] Transcript loads
  - [ ] Recording plays (if available)
- [ ] Export call data
- [ ] Real-time call status updates

### 2.6 Analytics & Reports
- [ ] Analytics page loads
- [ ] Date range selector works
- [ ] Metrics calculate correctly
- [ ] Charts update with filters
- [ ] Export reports to CSV/PDF
- [ ] Email report scheduling

---

## 3. BACKEND API TESTING

### 3.1 API Endpoints
Test each endpoint using the browser console or Postman:

```javascript
// Run these in browser console while logged in

// Test campaigns endpoint
fetch('/api/campaigns').then(r => r.json()).then(console.log)

// Test leads endpoint  
fetch('/api/leads').then(r => r.json()).then(console.log)

// Test calls endpoint
fetch('/api/calls').then(r => r.json()).then(console.log)

// Test organization settings
fetch('/api/organization-settings').then(r => r.json()).then(console.log)
```

- [ ] GET /api/campaigns - Returns campaigns
- [ ] POST /api/campaigns - Creates campaign
- [ ] PUT /api/campaigns/:id - Updates campaign
- [ ] DELETE /api/campaigns/:id - Deletes campaign
- [ ] GET /api/leads - Returns leads
- [ ] POST /api/leads - Creates lead
- [ ] POST /api/leads/import - Imports CSV
- [ ] GET /api/calls - Returns calls
- [ ] POST /api/calls - Initiates call
- [ ] GET /api/vapi/assistants - Returns assistants
- [ ] GET /api/vapi/phone-numbers - Returns phone numbers

### 3.2 Database Operations
Check Supabase for:
- [ ] Tables have correct schema
- [ ] Row Level Security (RLS) enabled
- [ ] Indexes are present
- [ ] Foreign key constraints work
- [ ] Triggers function properly

---

## 4. VAPI INTEGRATION TESTING

### 4.1 VAPI Configuration
- [ ] VAPI API key is valid
- [ ] Assistant ID is valid
- [ ] Phone Number ID is valid
- [ ] Webhook URL is configured in VAPI
- [ ] VAPI dashboard shows active status

### 4.2 Call Flow Testing
- [ ] Create test campaign with:
  - [ ] Valid assistant ID
  - [ ] Valid phone number ID
  - [ ] Test leads (your number)
- [ ] Initiate single call
  - [ ] Call connects successfully
  - [ ] AI assistant speaks
  - [ ] Can interact with assistant
  - [ ] Call ends properly
- [ ] Check call record created
- [ ] Verify webhook received
- [ ] Transcript saves to database
- [ ] Call status updates correctly
- [ ] Duration and cost calculated

### 4.3 Campaign Automation
- [ ] Start campaign processor:
```bash
cd /Users/seanwentz/Desktop/Apex
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24 node scripts/campaign-automation/start-campaign-processor.cjs
```
- [ ] Processor starts without errors
- [ ] Detects pending leads
- [ ] Initiates calls in sequence
- [ ] Respects rate limits
- [ ] Updates lead status
- [ ] Handles errors gracefully

---

## 5. ERROR HANDLING & EDGE CASES

### 5.1 Error Scenarios
- [ ] Invalid phone number format
- [ ] Duplicate lead prevention
- [ ] API rate limit handling
- [ ] Network timeout recovery
- [ ] Invalid CSV format handling
- [ ] Database connection loss
- [ ] VAPI service downtime
- [ ] Webhook failure retry

### 5.2 Data Validation
- [ ] Phone number validation
- [ ] Email format validation
- [ ] Required fields enforcement
- [ ] Data type checking
- [ ] SQL injection prevention
- [ ] XSS attack prevention

---

## 6. PERFORMANCE TESTING

### 6.1 Load Testing
- [ ] Dashboard loads < 3 seconds
- [ ] API responses < 1 second
- [ ] Can handle 100+ concurrent users
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Pagination works for large datasets

### 6.2 Stress Testing
- [ ] Import 10,000 leads
- [ ] Run campaign with 1,000 leads
- [ ] Handle 50 concurrent calls
- [ ] Process large CSV files (>5MB)

---

## 7. INTEGRATION TESTING

### 7.1 External Services
- [ ] Supabase connection stable
- [ ] VAPI API integration working
- [ ] Clerk authentication functioning
- [ ] Webhook delivery successful
- [ ] Email notifications sending

### 7.2 Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

---

## 8. DEPLOYMENT & MONITORING

### 8.1 Deployment Verification
- [ ] Netlify deployment successful
- [ ] Vercel backend deployed
- [ ] Environment variables set
- [ ] SSL certificates valid
- [ ] Custom domain working

### 8.2 Monitoring Setup
- [ ] Error tracking configured
- [ ] Uptime monitoring active
- [ ] Database backups scheduled
- [ ] Log aggregation working
- [ ] Alert notifications configured

---

## 9. USER ACCEPTANCE TESTING

### 9.1 Business Workflows
- [ ] Complete campaign creation workflow
- [ ] Full lead import and processing
- [ ] End-to-end call execution
- [ ] Report generation and export
- [ ] Team member invitation flow
- [ ] Billing and usage tracking

### 9.2 Real-World Scenarios
- [ ] Create campaign for sales team
- [ ] Import client lead list
- [ ] Run 10-lead test campaign
- [ ] Review call outcomes
- [ ] Export results for client
- [ ] Schedule follow-up campaign

---

## 10. CRITICAL TEST COMMANDS

```bash
# 1. Check Campaign Readiness
cd /Users/seanwentz/Desktop/Apex
node check-campaign-readiness.cjs

# 2. Test Single Call
node make-test-call-now.cjs

# 3. Start Campaign Processor
SUPABASE_ANON_KEY=[YOUR_KEY] node scripts/campaign-automation/start-campaign-processor.cjs

# 4. Check VAPI Resources
node scripts/diagnostics/check-vapi-resources.cjs

# 5. Verify Database Structure
node check-calls-columns.js
```

---

## TEST RESULT DOCUMENTATION

### Pass/Fail Criteria
- **PASS**: Feature works as expected, no errors
- **PARTIAL**: Feature works with minor issues
- **FAIL**: Feature doesn't work or has critical errors

### Issue Tracking Template
```
Issue #: [Number]
Component: [Frontend/Backend/Database/Integration]
Severity: [Critical/Major/Minor]
Description: [What went wrong]
Steps to Reproduce: [How to recreate]
Expected: [What should happen]
Actual: [What actually happened]
Screenshot/Error: [Attach if applicable]
```

---

## SIGN-OFF CHECKLIST

### Minimum Viable Product (MVP)
- [ ] Users can login
- [ ] Campaigns can be created
- [ ] Leads can be imported
- [ ] Calls can be initiated
- [ ] Call records are saved
- [ ] Basic reporting works

### Production Ready
- [ ] All critical features working
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Backup system configured
- [ ] Monitoring active
- [ ] Documentation complete

### Final Approval
- [ ] Technical Lead Sign-off
- [ ] Product Owner Sign-off
- [ ] Client Acceptance
- [ ] Go-Live Authorization

---

## TESTING SCHEDULE

**Day 1: Core Functionality**
- Morning: Authentication & Dashboard
- Afternoon: Campaign & Lead Management

**Day 2: Integration Testing**
- Morning: VAPI Integration & Calling
- Afternoon: API & Database Testing

**Day 3: Edge Cases & Performance**
- Morning: Error Scenarios & Validation
- Afternoon: Load Testing & Browser Compatibility

**Day 4: User Acceptance**
- Morning: Business Workflows
- Afternoon: Final Review & Sign-off

---

## CONTACT FOR ISSUES

**Technical Issues**: sean@artificialmedia.co.uk
**VAPI Support**: support@vapi.ai
**Database**: Supabase Dashboard
**Frontend**: Netlify Dashboard
**Backend**: Vercel Dashboard

---

*Last Updated: September 20, 2025*
*Version: 1.0*