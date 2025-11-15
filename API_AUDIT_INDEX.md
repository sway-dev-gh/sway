# SwayFiles API Audit - Complete Documentation Index

**Audit Date**: November 14, 2025  
**Status**: CRITICAL FINDINGS - 13 Missing Endpoints  
**Severity**: HIGH - Direct Cause of 404/500 Errors  

---

## Quick Start Guide

**You are here because:** The frontend is getting 404/500 errors due to missing or misconfigured API endpoints.

**What you need to do:** Read the documents in this order:
1. **START HERE**: `API_AUDIT_SUMMARY.txt` - 5 minute overview
2. **THEN READ**: `API_ENDPOINT_AUDIT.md` - Detailed analysis
3. **THEN IMPLEMENT**: `API_FIX_IMPLEMENTATION_GUIDE.md` - Code changes
4. **THEN REFERENCE**: `FILES_TO_MODIFY.txt` - Quick checklist

---

## Documentation Files

### 1. API_AUDIT_SUMMARY.txt
**Length**: 2-3 minutes to read  
**Best for**: Quick understanding of what's broken and why  
**Contains**:
- Executive summary of all 13 missing endpoints
- Critical vs high priority issues
- Impacted features (what users can't do)
- Quick fix checklist
- Effort estimation (2-4 hours to fix)
- Root cause analysis
- Verification steps

**Start here if**: You want a quick overview in 5 minutes

---

### 2. API_ENDPOINT_AUDIT.md
**Length**: 10-15 minutes to read  
**Best for**: Understanding each missing endpoint in detail  
**Contains**:
- Part 1: All 13 missing endpoints with detailed explanations
- Part 2: Wrong HTTP method issues
- Part 3: Data structure mismatches
- Part 4: Routing configuration issues
- Part 5: Authentication issues
- Part 6: Configuration issues
- Summary table of all issues
- Immediate action items
- Files that need modification

**Start here if**: You want detailed technical information

---

### 3. API_FIX_IMPLEMENTATION_GUIDE.md
**Length**: Reference document (consult as needed)  
**Best for**: Copy-paste code and step-by-step implementation  
**Contains**:
- FIX #1: Change /api/team to /api/teams (critical)
- FIX #2: Add authenticated file upload endpoint
- FIX #3: Add user workspace and automation settings
- FIX #4: Add all 4 team management endpoints
- FIX #5: Add project update and invite endpoints
- FIX #6: Fix stripe portal endpoint
- FIX #7: Verify prompting endpoints
- Validation checklist
- Testing procedures

**Use this when**: You're ready to implement the fixes

---

### 4. FILES_TO_MODIFY.txt
**Length**: 2-3 minutes to read  
**Best for**: Quick reference of what needs to change  
**Contains**:
- Complete list of 7 files to modify
- Specific line numbers and changes
- Implementation order (4 phases)
- Validation and testing instructions
- Deployment checklist
- Common mistakes to avoid
- Troubleshooting guide

**Use this when**: You need a quick checklist of changes

---

### 5. API_ENDPOINTS_SUMMARY.md (Existing)
**Status**: Previously created reference  
**Contents**: General API endpoint summary  
**Note**: See newer documents for complete audit findings

### 6. API_QUICK_REFERENCE.md (Existing)
**Status**: Previously created reference  
**Contents**: Quick API reference guide  
**Note**: See newer documents for complete audit findings

---

## Problem Summary

### What's Broken (13 Issues Found)

**CRITICAL (Fix immediately):**
1. `/api/team` mounted instead of `/api/teams` - All team endpoints return 404
2. `/api/files/upload` missing - Users can't upload authenticated files
3. `/api/teams/*` endpoints missing (4 endpoints) - No team management

**HIGH PRIORITY (Fix this week):**
4. `/api/user/workspace-settings` missing - No workspace configuration
5. `/api/user/automation-settings` missing - No automation setup
6. `/api/projects/:id` PATCH missing - Can't update projects
7. `/api/projects/invite` missing - Can't invite collaborators
8. `/api/stripe/create-portal-session` mismatch - Billing portal broken
9. Prompting endpoints unclear - May not work

### Impact on Users

**Completely Broken Features:**
- File uploads (authenticated)
- Team management
- Workspace settings
- Project editing
- Automations
- Billing portal
- Prompting system

**Still Working:**
- Login/signup
- Project creation
- Viewing projects
- Public file uploads

---

## Implementation Guide

### Phase 1: Quick Critical Fix (15 minutes)
Change one line in `/backend/src/server.js` line 202:
```
FROM: app.use('/api/team', ...)
TO:   app.use('/api/teams', ...)
```

### Phase 2: Add Core Endpoints (2 hours)
1. Add `/api/files/upload` to `files.js`
2. Add project endpoints to `projects.js`
3. Add user settings to `user.js`
4. Add team endpoints to `team.js`

### Phase 3: Payment Integration (30 minutes)
Add `/api/stripe/create-portal-session` to `stripe.js`

### Phase 4: Verification (15 minutes)
Verify prompting endpoints in `prompting.js`

### Total Time: 3-4 hours

---

## Verification

After fixes, test with curl:

```bash
# Should return 401 (unauthorized), not 404
curl http://localhost:5001/api/teams/current
curl http://localhost:5001/api/files/upload
curl http://localhost:5001/api/user/workspace-settings

# If you get 404, something wasn't fixed correctly
# If you get 401, that's normal (need JWT token)
# If you get 200, endpoint is working!
```

---

## Files Modified

- `backend/src/server.js` - Line 202 (route mount fix)
- `backend/src/routes/files.js` - Add upload endpoint
- `backend/src/routes/user.js` - Add settings endpoints
- `backend/src/routes/team.js` - Add team endpoints
- `backend/src/routes/projects.js` - Add project endpoints
- `backend/src/routes/stripe.js` - Add portal endpoint
- `backend/src/routes/prompting.js` - Verify endpoints

---

## Deployment Checklist

- [ ] Read all audit documents
- [ ] Implement Phase 1 (critical fix)
- [ ] Test Phase 1 fix
- [ ] Implement Phase 2 (core endpoints)
- [ ] Test Phase 2 endpoints
- [ ] Implement Phase 3 (payment)
- [ ] Implement Phase 4 (verification)
- [ ] Run full test suite
- [ ] Test with frontend
- [ ] Deploy to production
- [ ] Monitor logs post-deployment

---

## Support

**If you have questions:**
1. Check `API_AUDIT_SUMMARY.txt` for quick answers
2. Check `API_ENDPOINT_AUDIT.md` for detailed info
3. Check `API_FIX_IMPLEMENTATION_GUIDE.md` for code
4. Check `FILES_TO_MODIFY.txt` for checklist

**If something breaks:**
1. See troubleshooting section in `FILES_TO_MODIFY.txt`
2. Check git log to see what changed
3. Review error messages in server logs
4. Verify database queries are correct
5. Test endpoints with curl before using in UI

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Missing Endpoints | 13 |
| Critical Issues | 3 |
| High Priority Issues | 6 |
| Files to Modify | 7 |
| Estimated Fix Time | 2-4 hours |
| Difficulty Level | Low-Medium |
| Risk Level | Low |
| Testing Time | 30 mins per feature |

---

## Timeline

- **Read Documentation**: 15-20 minutes
- **Implement Fixes**: 2-3 hours
- **Test Fixes**: 1-2 hours
- **Deploy**: 15-30 minutes
- **Total**: 3-5 hours

---

## Root Cause

1. **Route Mounting Error**: Frontend uses plural `/api/teams`, backend mounts singular `/api/team`
2. **Incomplete Implementation**: Many routes started but not finished
3. **Endpoint Mismatch**: Frontend and backend disagree on some paths
4. **Missing Methods**: Some routes exist but lack required HTTP methods (PATCH, etc.)

---

## Results After Fixes

All 13 endpoints will be implemented and working:
- File uploads will work
- Team management will work
- Settings will work
- Project editing will work
- Billing will work
- All 404 errors will be resolved

---

**Generated**: November 14, 2025  
**For**: Fixing 404/500 API errors in SwayFiles  
**Status**: Ready to implement  

Start with `API_AUDIT_SUMMARY.txt` →

