# Security Policy

## Overview

This document outlines security best practices, known vulnerabilities that have been addressed, and recommendations for maintaining the security of the Sway application.

## Security Measures Implemented

### 1. File Upload Security

#### Implemented Protections:
- **MIME Type Validation**: Files are validated against their actual MIME type, not just file extension
- **File Size Limits**: Configurable file size limits with proper enforcement
- **Filename Sanitization**:
  - Path traversal prevention (../, ..\, etc.)
  - Removal of null bytes and control characters
  - Dangerous character filtering (<>:"|?*)
  - Prevention of hidden files (starting with .)
  - Filename length limits (255 characters)
- **SVG XSS Prevention**: Special validation for SVG files to detect and block:
  - Embedded `<script>` tags
  - Event handlers (onclick, onload, etc.)
  - javascript: URLs
  - Malicious data: URLs
- **Executable File Blocking**: Automatic rejection of executable file types (.exe, .bat, .sh, .ps1, etc.)

#### Remaining Risks:
- File content analysis is limited to SVG files. Consider implementing server-side antivirus scanning for all files.
- Large files could potentially cause DoS. Current 100MB default limit should be enforced at both client and server level.

### 2. Cross-Site Scripting (XSS) Prevention

#### Implemented Protections:
- **Input Sanitization**: All user text inputs are sanitized using `sanitizeTextInput()`
- **Email Validation**: Email addresses validated with regex and normalized
- **HTML Escaping**: User-generated content is escaped before rendering
- **DOMPurify Integration**: Available for sanitizing rich HTML content when needed
- **Branding Elements**: All custom branding text and URLs are escaped/validated

#### Best Practices:
- Never use `dangerouslySetInnerHTML` without sanitizing content first with DOMPurify
- Always escape user content in React: use `{escapeHTML(userContent)}` instead of `{userContent}`
- Validate URLs before using them in href attributes

### 3. Authentication & Authorization

#### Current Implementation:
- JWT tokens stored in `localStorage`
- Bearer token authentication
- Admin key support for elevated permissions
- Automatic token refresh on 401 responses
- Auto-logout on authentication failures

#### Security Concerns & Recommendations:

**CRITICAL - JWT Storage:**
- ⚠️ **Current**: JWT tokens are stored in `localStorage`
- ✅ **Recommended**: Migrate to httpOnly cookies to prevent XSS token theft
- **Implementation Steps**:
  1. Configure backend to set httpOnly, secure, SameSite cookies
  2. Remove `localStorage.setItem('token')` from Login.jsx and Signup.jsx
  3. Update axios interceptors to rely on cookies instead of Authorization header
  4. Implement CSRF protection when using cookies

**Password Requirements:**
- Current signup enforces 12+ character passwords (good!)
- Recommend adding server-side validation for:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
  - Common password blacklist

### 4. API Security

#### Implemented:
- Centralized axios instance with consistent headers
- Request timeout (30 seconds) to prevent hanging requests
- Automatic error handling with 401 redirect
- Authorization header injection

#### Recommendations:

**CSRF Protection:**
- Implement CSRF tokens for state-changing operations (POST, PUT, DELETE)
- Use SameSite cookie attribute (Lax or Strict)
- Validate Origin/Referer headers on backend

**Rate Limiting:**
- Implement rate limiting on authentication endpoints (login, signup)
- Implement rate limiting on file upload endpoints
- Use exponential backoff for failed authentication attempts

**Error Messages:**
- Current error messages may leak information
- Example: "User not found" vs "Invalid credentials" reveals if email exists
- Use generic error messages for authentication failures

### 5. Data Validation

All user inputs are validated and sanitized using the security utilities:

```javascript
import {
  sanitizeFileName,      // Clean filenames, prevent path traversal
  validateFileType,      // MIME type and extension validation
  validateFileSize,      // Size limit enforcement
  sanitizeHTML,          // DOMPurify integration for HTML
  sanitizeTextInput,     // Remove HTML, clean text
  sanitizeEmail,         // Email validation and normalization
  validateURL,           // URL protocol validation
  escapeHTML,            // Escape HTML entities
  validateCustomField,   // Type-specific field validation
  validateSVGSafety      // SVG XSS detection
} from './utils/security/sanitize'
```

## Security Headers

The following HTTP security headers should be configured on the server:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.swayfiles.com;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Implementation:

**For Vite Development:**
Add to `vite.config.js`:
```javascript
export default {
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
}
```

**For Production (Nginx):**
```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; ..." always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**For Production (Backend - Express):**
```javascript
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.swayfiles.com"]
    }
  }
}));
```

## Vulnerability Disclosure

### Found Vulnerabilities (Now Fixed):

1. **File Upload - Path Traversal** (Severity: HIGH)
   - Files could potentially contain path traversal sequences (../)
   - Fixed by implementing `sanitizeFileName()` with path component removal

2. **File Upload - Extension Bypass** (Severity: MEDIUM)
   - Only file extension was checked, MIME type was not validated
   - Fixed by implementing dual validation (MIME + extension)

3. **SVG XSS** (Severity: HIGH)
   - SVG files could contain embedded JavaScript
   - Fixed by implementing `validateSVGSafety()` with script detection

4. **XSS in Branding Elements** (Severity: MEDIUM)
   - User-provided branding text and URLs were not sanitized
   - Fixed by implementing `escapeHTML()` and `validateURL()`

5. **JWT Storage in localStorage** (Severity: HIGH)
   - Tokens vulnerable to XSS attacks
   - **NOT YET FIXED** - Requires backend changes
   - Recommendation: Migrate to httpOnly cookies

6. **No CSRF Protection** (Severity: MEDIUM)
   - State-changing operations lack CSRF tokens
   - **NOT YET FIXED** - Requires backend implementation

7. **Verbose Error Messages** (Severity: LOW)
   - Error messages may reveal system information
   - Recommendation: Use generic error messages

### Reporting Security Issues

If you discover a security vulnerability, please email security@swayfiles.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

**Please do not create public GitHub issues for security vulnerabilities.**

## Security Checklist for Developers

When adding new features, ensure:

- [ ] All user inputs are validated and sanitized
- [ ] File uploads use the security utilities
- [ ] No use of `dangerouslySetInnerHTML` without DOMPurify
- [ ] URLs are validated before use in href/src attributes
- [ ] Sensitive operations require authentication
- [ ] Error messages don't leak system information
- [ ] API endpoints implement rate limiting (backend)
- [ ] New dependencies are reviewed for vulnerabilities (`npm audit`)
- [ ] Authentication tokens are handled securely
- [ ] CORS is properly configured (backend)

## Dependency Security

Run regular security audits:

```bash
# Check for known vulnerabilities
npm audit

# Fix vulnerabilities automatically where possible
npm audit fix

# For high-severity issues that can't be auto-fixed
npm audit fix --force
```

Currently installed security packages:
- `dompurify` (v3.3.0) - HTML sanitization

## Testing Security

### Manual Testing Checklist:

**File Upload:**
- [ ] Try uploading files with path traversal (../../etc/passwd)
- [ ] Try uploading executable files (.exe, .sh, .bat)
- [ ] Try uploading SVG with `<script>alert('XSS')</script>`
- [ ] Try uploading oversized files
- [ ] Try uploading files with dangerous names (<script>.jpg)

**XSS Prevention:**
- [ ] Try entering `<script>alert('XSS')</script>` in text fields
- [ ] Try entering `<img src=x onerror=alert('XSS')>` in text fields
- [ ] Try entering `javascript:alert('XSS')` in URL fields

**Authentication:**
- [ ] Try accessing authenticated pages without token
- [ ] Try using expired/invalid tokens
- [ ] Try SQL injection in login (`' OR '1'='1`)
- [ ] Try brute force login attempts

## Updates and Maintenance

This security policy should be reviewed and updated:
- After each security incident
- Quarterly as part of regular maintenance
- When new features are added
- When dependencies are updated

Last updated: 2025-11-10
