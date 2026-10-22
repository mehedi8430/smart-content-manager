// This module is loaded with Node's --import before server.ts.
import dotenv from 'dotenv';

dotenv.config();

import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;
const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

const MAX_ERROR_MESSAGE_LENGTH = 500;

/**
 * Keeps enough of an exception message for Sentry to group and title issues,
 * while removing common credentials and identifiers before the event leaves
 * the app. Request headers, cookies, bodies, and query strings are stripped
 * separately in `beforeSend`.
 */
function sanitizeErrorMessage(value: string | undefined): string | undefined {
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

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release: process.env.RENDER_GIT_COMMIT || process.env.SENTRY_RELEASE,
    // Static lifecycle keeps beforeSendTransaction active so request data is scrubbed.
    traceLifecycle: 'static',
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
      genAI: { inputs: false, outputs: false },
    },
    tracesSampler: ({ name, inheritOrSampleWith }) => {
      if (/\/health(?:\?|$)/.test(name)) return 0;
      return inheritOrSampleWith(environment === 'production' ? 0.1 : 0.5);
    },
    integrations: [
      Sentry.expressIntegration({
        shouldHandleError: (error) => Number(error.statusCode ?? error.status ?? 500) >= 500,
      }),
    ],
    beforeSend(event) {
      if (event.request) {
        event.request.headers = {};
        delete event.request.cookies;
        delete event.request.data;
        if (event.request.url) {
          try {
            const url = new URL(event.request.url);
            url.search = '';
            event.request.url = url.toString();
          } catch {
            event.request.url = event.request.url.split('?')[0];
          }
        }
      }
      if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
      if (event.exception?.values) {
        for (const exception of event.exception.values) {
          exception.value = sanitizeErrorMessage(exception.value) || exception.type || 'Application error';
        }
      }
      if (event.message) event.message = sanitizeErrorMessage(event.message);
      event.extra = undefined;
      event.contexts = undefined;
      event.breadcrumbs = [];
      return event;
    },
    beforeSendTransaction(event) {
      if (/\/health(?:\?|$)/.test(event.transaction || '')) return null;
      if (event.request) {
        event.request.headers = {};
        delete event.request.cookies;
        delete event.request.data;
        if (event.request.url) event.request.url = event.request.url.split('?')[0];
      }
      event.breadcrumbs = [];
      return event;
    },
  });
}

export { Sentry };