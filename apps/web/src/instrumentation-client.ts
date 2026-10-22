import * as Sentry from '@sentry/nextjs';
import { sanitizeErrorMessage } from './lib/sentry-sanitize';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
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
    integrations: [
      Sentry.browserApiErrorsIntegration({ setTimeout: true, setInterval: true, requestAnimationFrame: true, XMLHttpRequest: true }),
    ],
    beforeSend(event, hint) {
      const error = hint.originalException;
      const message = error instanceof Error ? error.message : String(error ?? '');
      if (/AbortError|ResizeObserver/i.test(message)) return null;
      if (/extensions?\//i.test(message) || /extension context invalidated/i.test(message)) return null;
      if (event.exception?.values?.some((exception) => exception.stacktrace?.frames?.some((frame) => /^(chrome|moz|safari)-extension:\/\//i.test(frame.filename || '')))) return null;
      if (/chrome-extension:|moz-extension:|safari-web-extension:/i.test(event.request?.url || '')) return null;
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

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;