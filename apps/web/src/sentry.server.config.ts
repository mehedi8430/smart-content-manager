import * as Sentry from '@sentry/nextjs';
import { sanitizeErrorMessage } from './lib/sentry-sanitize';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.SENTRY_ENVIRONMENT || process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release: process.env.SENTRY_RELEASE || process.env.RENDER_GIT_COMMIT || process.env.NEXT_PUBLIC_SENTRY_RELEASE,
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
    tracesSampleRate: environment === 'production' ? 0.1 : 0.5,
    tracePropagationTargets: [
      /^\//,
      ...(process.env.NEXT_PUBLIC_API_BASE_URL ? [process.env.NEXT_PUBLIC_API_BASE_URL] : []),
    ],
    beforeSend(event) {
      if (event.request) {
        event.request.headers = {};
        delete event.request.cookies;
        delete event.request.data;
        if (event.request.url) event.request.url = event.request.url.split('?')[0];
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