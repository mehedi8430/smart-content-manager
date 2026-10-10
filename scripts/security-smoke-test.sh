#!/usr/bin/env bash
#
# Security smoke test for the API hardening work (see docs/security-review.md).
#
# Requires a running API and the seeded demo user (mock AI mode is fine):
#   bun run dev --filter=api            # or the e2e stack
#   API_BASE=http://localhost:8000 bash scripts/security-smoke-test.sh
#
# Env overrides: API_BASE (default http://localhost:8000),
#                SMOKE_EMAIL / SMOKE_PASSWORD (defaults to the seed demo user).
#
set -uo pipefail

API_BASE="${API_BASE:-http://localhost:8000}"
PREFIX="/api/v1"
EMAIL="${SMOKE_EMAIL:-demo@smartcontent.test}"
PASSWORD="${SMOKE_PASSWORD:-Password123!}"

JAR="$(mktemp)"
TMP="$(mktemp -d)"
trap 'rm -f "$JAR"; rm -rf "$TMP"' EXIT

# The auth limiter (10 failures / 15 min) counts validation failures, so give each
# run its own bucket. In local dev the API trusts the first proxy hop, so a random
# X-Forwarded-For isolates the run; behind a real edge proxy the header is replaced
# and repeated runs may still be rate-limited (checks then report 429).
FAKE_IP="10.$((RANDOM % 254 + 1)).$((RANDOM % 254 + 1)).$((RANDOM % 254 + 1))"
XFF=(-H "X-Forwarded-For: ${FAKE_IP}")

PASS=0
FAIL=0

green=$'\033[32m'; red=$'\033[31m'; reset=$'\033[0m'

check() {
  local expected="$1" actual="$2" label="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf '  %sPASS%s %-58s (%s)\n' "$green" "$reset" "$label" "$actual"
    PASS=$((PASS + 1))
  else
    printf '  %sFAIL%s %-58s expected %s, got %s\n' "$red" "$reset" "$label" "$expected" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

# check_status METHOD PATH EXPECTED [extra curl args...]
check_status() {
  local method="$1" path="$2" expected="$3"
  shift 3
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -X "$method" "${XFF[@]}" "$@" "${API_BASE}${path}")
  check "$expected" "$code" "$method $path"
}

# Auth endpoints share a 10/15min limiter (skipSuccessfulRequests). Validation
# failures intentionally consume it, so a 429 means "already rate-limited from a
# previous run", not a validation regression — accept it.
check_auth_status() {
  local path="$1"
  shift
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "${XFF[@]}" "$@" "${API_BASE}${path}")
  [[ "$code" == "429" ]] && code="400"
  check "400" "$code" "POST $path"
}

echo "Security smoke test against ${API_BASE}"
echo

echo "Health & limiter headers"
health_code=$(curl -s -o /dev/null -w '%{http_code}' "${XFF[@]}" "${API_BASE}/health")
check "200" "$health_code" "GET /health"
rl_header=$(curl -s -D - "${XFF[@]}" -o /dev/null "${API_BASE}${PREFIX}/campaigns" | tr -d '\r' | grep -ci '^ratelimit')
check "present" "$([[ "$rl_header" -ge 1 ]] && echo present || echo missing)" "rate-limit headers present on /api"

echo
echo "Auth input validation (unauthenticated)"
check_auth_status "${PREFIX}/auth/register" \
  -H 'Content-Type: application/json' -d '{"email":"smoke@example.com","password":"short"}'
check_auth_status "${PREFIX}/auth/register" \
  -H 'Content-Type: application/json' -d '{"email":"smoke2@example.com","password":"password123","role":"admin"}'
check_auth_status "${PREFIX}/auth/register" \
  -H 'Content-Type: application/json' -d '{"email":"not-an-email","password":"password123"}'
check_auth_status "${PREFIX}/auth/login" \
  -H 'Content-Type: application/json' -d '{"email":"demo@smartcontent.test","password":"definitely-wrong"}'

echo
echo "Body size limits (parsed before auth, so no auth-limiter budget used)"
head -c 200000 /dev/zero | tr '\0' 'a' > "$TMP/pad"
printf '{"email":"a@b.co","password":"%s"}' "$(cat "$TMP/pad")" > "$TMP/big.json"
check_status POST "${PREFIX}/campaigns" 413 \
  -H 'Content-Type: application/json' --data @"$TMP/big.json"
check_status POST "${PREFIX}/campaigns" 400 \
  -H 'Content-Type: application/json' -d '{"email":'

echo
echo "Authentication & authorization"
check_status GET "${PREFIX}/campaigns" 401

login_code=$(curl -s -o /dev/null -w '%{http_code}' "${XFF[@]}" -c "$JAR" -b "$JAR" \
  -X POST -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" "${API_BASE}${PREFIX}/auth/login")
check "200" "$login_code" "POST /auth/login (demo user)"

auth=( -b "$JAR" )

echo
echo "Campaign query validation"
check_status GET "${PREFIX}/campaigns?limit=500" 400 "${auth[@]}"
check_status GET "${PREFIX}/campaigns?page=0" 400 "${auth[@]}"
check_status GET "${PREFIX}/campaigns?search=$(head -c 101 /dev/zero | tr '\0' 'a')" 400 "${auth[@]}"
check_status GET "${PREFIX}/campaigns/not-a-uuid" 400 "${auth[@]}"
check_status GET "${PREFIX}/campaigns?limit=all" 200 "${auth[@]}"
check_status GET "${PREFIX}/campaigns?limit=50" 200 "${auth[@]}"

echo
echo "Chat & AI validation (authenticated)"
check_status POST "${PREFIX}/chat/sessions/00000000-0000-4000-8000-000000000000/messages/stream" 400 \
  "${auth[@]}" -H 'Content-Type: application/json' -d "{\"content\":\"$(head -c 4001 /dev/zero | tr '\0' 'a')\"}"

campaign_json=$(curl -s "${XFF[@]}" "${auth[@]}" -X POST -H 'Content-Type: application/json' \
  -d '{"name":"Smoke test campaign"}' "${API_BASE}${PREFIX}/campaigns")
campaign_id=$(printf '%s' "$campaign_json" | grep -oE '"id":"[^"]+"' | head -1 | cut -d'"' -f4)

if [[ -z "$campaign_id" ]]; then
  printf '  %sFAIL%s could not create a temp campaign (%s)\n' "$red" "$reset" "$campaign_json"
  FAIL=$((FAIL + 1))
else
  check_status POST "${PREFIX}/campaigns/${campaign_id}/ai-outputs/generate" 400 \
    "${auth[@]}" -H 'Content-Type: application/json' -d '{"type":"ad","prompt":"hello world","tone":"whisper"}'
  check_status POST "${PREFIX}/campaigns/${campaign_id}/posts" 400 \
    "${auth[@]}" -H 'Content-Type: application/json' -d '{"title":"t","campaignId":"x"}'

  { printf '{"posts":['; \
    for i in $(seq 1 201); do \
      [[ $i -gt 1 ]] && printf ','; \
      printf '{"id":"00000000-0000-4000-8000-000000000000","status":"todo"}'; \
    done; \
    printf ']}'; } > "$TMP/bulk.json"
  check_status PATCH "${PREFIX}/campaigns/${campaign_id}/posts/bulk-update" 400 \
    "${auth[@]}" -H 'Content-Type: application/json' --data @"$TMP/bulk.json"

  echo
  echo "Ownership (404, not 400/403)"
  post_json=$(curl -s "${XFF[@]}" "${auth[@]}" -X POST -H 'Content-Type: application/json' \
    -d '{"title":"Smoke post"}' "${API_BASE}${PREFIX}/campaigns/${campaign_id}/posts")
  post_id=$(printf '%s' "$post_json" | grep -oE '"id":"[^"]+"' | head -1 | cut -d'"' -f4)

  if [[ -n "$post_id" ]]; then
    check_status PATCH "${PREFIX}/campaigns/${campaign_id}/posts/bulk-update" 404 \
      "${auth[@]}" -H 'Content-Type: application/json' \
      -d "{\"posts\":[{\"id\":\"${post_id}\",\"status\":\"done\"},{\"id\":\"00000000-0000-4000-8000-000000000000\",\"status\":\"done\"}]}"
    check_status PATCH "${PREFIX}/campaigns/${campaign_id}/posts/bulk-update" 200 \
      "${auth[@]}" -H 'Content-Type: application/json' \
      -d "{\"posts\":[{\"id\":\"${post_id}\",\"status\":\"in_progress\"},{\"id\":\"${post_id}\",\"order\":2}]}"
  else
    printf '  %sFAIL%s could not create a temp post (%s)\n' "$red" "$reset" "$post_json"
    FAIL=$((FAIL + 1))
  fi

  check_status DELETE "${PREFIX}/campaigns/${campaign_id}" 200 "${auth[@]}"
fi

echo
if [[ "$FAIL" -eq 0 ]]; then
  printf '%sAll %d checks passed.%s\n' "$green" "$PASS" "$reset"
  exit 0
fi
printf '%s%d passed, %d failed.%s\n' "$red" "$PASS" "$FAIL" "$reset"
exit 1
