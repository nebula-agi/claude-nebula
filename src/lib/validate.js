// Nebula API validation utilities

/**
 * Validate Nebula API key format
 */
function validateApiKeyFormat(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, reason: 'key is empty or not a string' };
  }

  if (key.length < 10) {
    return { valid: false, reason: 'key is too short' };
  }

  if (/\s/.test(key)) {
    return { valid: false, reason: 'key contains whitespace' };
  }

  return { valid: true };
}

/**
 * Validate container tag format (used for collection naming)
 */
function validateContainerTag(tag) {
  if (!tag || typeof tag !== 'string') {
    return { valid: false, reason: 'tag is empty' };
  }

  if (tag.length > 100) {
    return { valid: false, reason: 'tag exceeds 100 characters' };
  }

  // Allow alphanumeric, underscore, and hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
    return {
      valid: false,
      reason: 'tag contains invalid characters (only alphanumeric, underscore, hyphen allowed)',
    };
  }

  // Must not start or end with dash/underscore
  if (/^[-_]|[-_]$/.test(tag)) {
    return { valid: false, reason: 'tag must not start or end with - or _' };
  }

  return { valid: true };
}

/**
 * Remove control characters and other problematic Unicode
 */
const SANITIZE_PATTERNS = [
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, // Control chars except \n
  /\uFEFF/g, // Zero-width no-break space
  /[\uFFF0-\uFFFF]/g, // Specials block
];

function sanitizeContent(content, maxLength = 100000) {
  if (!content || typeof content !== 'string') return '';

  let sanitized = content;
  for (const pattern of SANITIZE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate content length
 */
function validateContentLength(content, minLength = 1, maxLength = 100000) {
  if (content.length < minLength) {
    return { valid: false, reason: `content below minimum length (${minLength})` };
  }

  if (content.length > maxLength) {
    return { valid: false, reason: `content exceeds maximum length (${maxLength})` };
  }

  return { valid: true };
}

/**
 * Sanitize metadata object for API submission
 */
const MAX_METADATA_KEYS = 50;
const MAX_KEY_LENGTH = 128;
const MAX_VALUE_LENGTH = 1024;

function sanitizeMetadata(metadata) {
  const sanitized = {};
  let keyCount = 0;

  for (const [key, value] of Object.entries(metadata)) {
    if (keyCount >= MAX_METADATA_KEYS) break;

    // Skip keys that are too long or have invalid chars
    if (key.length > MAX_KEY_LENGTH || /[^\w.-]/.test(key)) {
      continue;
    }

    // Only allow string, number, boolean
    if (typeof value === 'string') {
      sanitized[key] = value.slice(0, MAX_VALUE_LENGTH);
      keyCount++;
    } else if ((typeof value === 'number' && Number.isFinite(value)) || typeof value === 'boolean') {
      sanitized[key] = value;
      keyCount++;
    }
  }

  return sanitized;
}

module.exports = {
  validateApiKeyFormat,
  validateContainerTag,
  sanitizeContent,
  validateContentLength,
  sanitizeMetadata,
};
