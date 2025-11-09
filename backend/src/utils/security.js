const fs = require('fs')

// Dangerous file extensions that should always be blocked
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jse',
  '.wsf', '.wsh', '.msi', '.msp', '.cpl', '.dll', '.jar', '.app', '.deb',
  '.rpm', '.dmg', '.pkg', '.sh', '.bash', '.ps1', '.psm1', '.py', '.rb',
  '.pl', '.php', '.asp', '.aspx', '.jsp', '.cgi', '.elf', '.so', '.dylib'
]

// Known malicious patterns in filenames
const MALICIOUS_FILENAME_PATTERNS = [
  /ransomware/i,
  /trojan/i,
  /virus/i,
  /malware/i,
  /backdoor/i,
  /keylog/i,
  /exploit/i,
  /payload/i,
  /inject/i,
  /shell/i,
  /reverse.*shell/i,
  /netcat/i,
  /metasploit/i,
  /mimikatz/i
]

// Profanity and inappropriate content patterns
const INAPPROPRIATE_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|cunt|dick|pussy|cock|nigger|faggot|retard)\b/gi,
  /\b(porn|xxx|sex|nude|naked)\b/gi,
  // Add more as needed
]

// Spam/scam patterns
const SPAM_PATTERNS = [
  /click.*here.*now/i,
  /limited.*time.*offer/i,
  /act.*now/i,
  /congratulations.*won/i,
  /claim.*prize/i,
  /verify.*account/i,
  /urgent.*action.*required/i,
  /bitcoin.*investment/i,
  /crypto.*guarantee/i,
  /\$\d+.*per.*day/i
]

// File magic bytes for validation (first few bytes of common file types)
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'application/zip': [0x50, 0x4B, 0x03, 0x04],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B], // DOCX (zip-based)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4B], // XLSX (zip-based)
  'text/plain': null // Text files don't have magic bytes
}

/**
 * Check if file extension is blocked
 */
function isBlockedExtension(filename) {
  const ext = require('path').extname(filename).toLowerCase()
  return BLOCKED_EXTENSIONS.includes(ext)
}

/**
 * Check filename for malicious patterns
 */
function hasMaliciousFilename(filename) {
  return MALICIOUS_FILENAME_PATTERNS.some(pattern => pattern.test(filename))
}

/**
 * Validate file content matches declared MIME type
 */
async function validateFileContent(filePath, declaredMimeType) {
  try {
    const expectedSignature = FILE_SIGNATURES[declaredMimeType]

    // If no signature expected (like text files), skip validation
    if (expectedSignature === null) {
      return true
    }

    // If we don't have a signature for this type, be cautious and reject
    if (!expectedSignature) {
      console.warn(`[Security] No signature validation for MIME type: ${declaredMimeType}`)
      return false
    }

    // Read first 10 bytes of file
    const buffer = Buffer.alloc(10)
    const fd = fs.openSync(filePath, 'r')
    fs.readSync(fd, buffer, 0, 10, 0)
    fs.closeSync(fd)

    // Check if file signature matches
    for (let i = 0; i < expectedSignature.length; i++) {
      if (buffer[i] !== expectedSignature[i]) {
        console.warn(`[Security] File signature mismatch. Expected ${declaredMimeType}, got different bytes`)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('[Security] Error validating file content:', error)
    return false
  }
}

/**
 * Scan file content for executable patterns (basic check)
 */
async function scanForExecutableContent(filePath) {
  try {
    const buffer = Buffer.alloc(4096) // Read first 4KB
    const fd = fs.openSync(filePath, 'r')
    const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0)
    fs.closeSync(fd)

    const content = buffer.slice(0, bytesRead).toString('utf8', 0, Math.min(bytesRead, 1000))

    // Check for executable patterns
    const executablePatterns = [
      /MZ/, // Windows executable header
      /\x7fELF/, // Linux executable header
      /#!\/bin\/(bash|sh|python|perl|ruby)/, // Script shebangs
      /eval\(/i,
      /exec\(/i,
      /system\(/i,
      /<script/i, // HTML scripts
      /javascript:/i,
      /vbscript:/i,
      /on(load|error|click)=/i // Event handlers
    ]

    return executablePatterns.some(pattern => pattern.test(content))
  } catch (error) {
    // If we can't read it, be safe and flag it
    console.error('[Security] Error scanning file:', error)
    return true
  }
}

/**
 * Moderate text content for inappropriate/malicious content
 */
function moderateText(text) {
  if (!text || typeof text !== 'string') {
    return { safe: true, reason: null }
  }

  // Check for profanity
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'Contains inappropriate language' }
    }
  }

  // Check for spam/scam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'Contains spam/scam patterns' }
    }
  }

  // Check for suspicious URLs
  const urlPattern = /(https?:\/\/[^\s]+)/gi
  const urls = text.match(urlPattern) || []

  // Suspicious TLDs
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.pw', '.cc', '.su', '.zip']
  for (const url of urls) {
    if (suspiciousTLDs.some(tld => url.endsWith(tld))) {
      return { safe: false, reason: 'Contains suspicious URLs' }
    }
  }

  // Check for excessive links (spam indicator)
  if (urls.length > 5) {
    return { safe: false, reason: 'Too many links (spam indicator)' }
  }

  return { safe: true, reason: null }
}

/**
 * Comprehensive file security check
 */
async function validateFileUpload(file) {
  const issues = []

  // Check 1: Blocked extension
  if (isBlockedExtension(file.originalname)) {
    issues.push(`Blocked file type: ${require('path').extname(file.originalname)}`)
  }

  // Check 2: Malicious filename
  if (hasMaliciousFilename(file.originalname)) {
    issues.push('Filename contains suspicious keywords')
  }

  // Check 3: File size (already checked by multer, but double-check)
  if (file.size > 50 * 1024 * 1024) {
    issues.push('File exceeds 50MB limit')
  }

  // Check 4: Empty file
  if (file.size === 0) {
    issues.push('Empty file not allowed')
  }

  // Check 5: MIME type validation
  const contentValid = await validateFileContent(file.path, file.mimetype)
  if (!contentValid) {
    issues.push('File content does not match declared type (possible disguised malware)')
  }

  // Check 6: Scan for executable content
  const hasExecutable = await scanForExecutableContent(file.path)
  if (hasExecutable) {
    issues.push('File contains executable code or scripts')
  }

  return {
    safe: issues.length === 0,
    issues
  }
}

/**
 * Detect suspicious upload patterns (rate abuse, etc.)
 */
function detectSuspiciousActivity(uploaderInfo) {
  const flags = []

  // Check for disposable email domains
  const disposableEmailDomains = [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
    'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'maildrop.cc'
  ]

  if (uploaderInfo.email) {
    const domain = uploaderInfo.email.split('@')[1]?.toLowerCase()
    if (disposableEmailDomains.includes(domain)) {
      flags.push('Disposable email address used')
    }
  }

  // Check for suspicious name patterns
  if (uploaderInfo.name) {
    // Check for random character spam
    if (/^[a-z]{20,}$/i.test(uploaderInfo.name.replace(/\s/g, ''))) {
      flags.push('Name appears to be random characters')
    }

    // Check for repeated characters
    if (/(.)\1{5,}/.test(uploaderInfo.name)) {
      flags.push('Name contains suspicious repeated characters')
    }
  }

  return {
    suspicious: flags.length > 0,
    flags
  }
}

module.exports = {
  validateFileUpload,
  moderateText,
  detectSuspiciousActivity,
  isBlockedExtension,
  hasMaliciousFilename
}
