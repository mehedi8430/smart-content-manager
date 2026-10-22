const MAX_ERROR_MESSAGE_LENGTH = 500;

/**
 * Keeps enough of an exception message for Sentry to group and title issues,
 * while removing common credentials and identifiers before the event leaves
 * the app. Request headers, cookies, bodies, and query strings are stripped
 * separately in the Sentry `beforeSend` hooks.
 */
export function sanitizeErrorMessage(value: string | undefined): string | undefined {
  if (!value) return value;

  return value
    .replace(
      /\b(password|passwd|pwd|token|secret|api[_-]?key|authorization)\s*[:=]\s*(?:Bearer\s+)?[^\s,;]+/gi,
      '$1=[redacted]'
    )
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/(https?:\/\/[^\s?#]+)\?[^\s#]*/gi, '$1?[redacted]')
    .replace(/\bsk-[A-Za-z0-9_-]{16,}\b/g, '[api-key]')
    .replace(/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, '[github-token]')
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, '[aws-key]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[jwt]')
    .replace(/\b[0-9a-f]{32,}\b/gi, '[hex]')
    .slice(0, MAX_ERROR_MESSAGE_LENGTH);
}
