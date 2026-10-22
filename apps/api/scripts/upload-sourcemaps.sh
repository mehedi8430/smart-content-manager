#!/bin/sh
set -eu

if [ -z "${SENTRY_AUTH_TOKEN:-}" ] || [ -z "${SENTRY_ORG:-}" ] || [ -z "${SENTRY_PROJECT:-}" ]; then
  echo "Skipping Sentry source map upload (SENTRY_AUTH_TOKEN, SENTRY_ORG, or SENTRY_PROJECT is unset)."
  exit 0
fi

release="${RENDER_GIT_COMMIT:-${SENTRY_RELEASE:-}}"
if [ -z "$release" ]; then
  echo "Skipping Sentry source map upload (RENDER_GIT_COMMIT or SENTRY_RELEASE is unset)."
  exit 0
fi

./node_modules/.bin/sentry-cli sourcemaps inject --org "$SENTRY_ORG" --project "$SENTRY_PROJECT" dist
./node_modules/.bin/sentry-cli sourcemaps upload --org "$SENTRY_ORG" --project "$SENTRY_PROJECT" --release "$release" dist