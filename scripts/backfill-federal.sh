#!/bin/bash
# =============================================================
# Federal Bill Backfill Script
# Automatically pages through ALL 119th Congress bills
# Usage: bash scripts/backfill-federal.sh
# =============================================================

BASE_URL="https://billbreakdown.vercel.app/api/cron/federal-backfill"
SECRET="bb_cron_secure_2024"
LIMIT=250
BATCH=15
OFFSET=0
TOTAL_CREATED=0
TOTAL_SKIPPED=0
TOTAL_ERRORS=0
RUN=1

echo "========================================="
echo "  BillBreakdown Federal Backfill"
echo "  Starting from offset: $OFFSET"
echo "  Batch size: $BATCH per call"
echo "  Page size: $LIMIT"
echo "========================================="
echo ""

while true; do
  URL="${BASE_URL}?secret=${SECRET}&offset=${OFFSET}&limit=${LIMIT}&batch=${BATCH}"
  echo "[Run $RUN] Fetching offset=$OFFSET ..."

  # Make the API call and capture response
  RESPONSE=$(curl -s -m 120 "$URL")

  # Check if curl succeeded
  if [ $? -ne 0 ]; then
    echo "  ERROR: Request failed (timeout or network error). Retrying in 10s..."
    sleep 10
    continue
  fi

  # Parse response fields using grep/sed (works without jq)
  CREATED=$(echo "$RESPONSE" | grep -o '"created":[0-9]*' | head -1 | cut -d: -f2)
  SKIPPED=$(echo "$RESPONSE" | grep -o '"skipped":[0-9]*' | head -1 | cut -d: -f2)
  ERRORS=$(echo "$RESPONSE" | grep -o '"errors":[0-9]*' | head -1 | cut -d: -f2)
  DONE=$(echo "$RESPONSE" | grep -o '"done":[a-z]*' | head -1 | cut -d: -f2)
  NEXT_OFFSET=$(echo "$RESPONSE" | grep -o '"nextOffset":[0-9]*' | head -1 | cut -d: -f2)
  ELAPSED=$(echo "$RESPONSE" | grep -o '"elapsedMs":[0-9]*' | head -1 | cut -d: -f2)
  BILLS_IN_PAGE=$(echo "$RESPONSE" | grep -o '"billsInPage":[0-9]*' | head -1 | cut -d: -f2)
  TOTAL_AVAIL=$(echo "$RESPONSE" | grep -o '"totalAvailable":[0-9]*' | head -1 | cut -d: -f2)

  # Handle parse failures
  if [ -z "$CREATED" ]; then
    echo "  ERROR: Could not parse response. Raw:"
    echo "  $RESPONSE" | head -c 500
    echo ""
    echo "  Retrying in 10s..."
    sleep 10
    continue
  fi

  TOTAL_CREATED=$((TOTAL_CREATED + CREATED))
  TOTAL_SKIPPED=$((TOTAL_SKIPPED + SKIPPED))
  TOTAL_ERRORS=$((TOTAL_ERRORS + ERRORS))

  echo "  Created: $CREATED | Skipped: $SKIPPED | Errors: $ERRORS | Time: ${ELAPSED}ms"
  echo "  Bills in page: $BILLS_IN_PAGE | Total available: $TOTAL_AVAIL"
  echo "  Running totals — Created: $TOTAL_CREATED | Skipped: $TOTAL_SKIPPED | Errors: $TOTAL_ERRORS"

  # Check if we're done
  if [ "$DONE" = "true" ] || [ -z "$NEXT_OFFSET" ]; then
    echo ""
    echo "========================================="
    echo "  BACKFILL COMPLETE!"
    echo "  Total created: $TOTAL_CREATED"
    echo "  Total skipped: $TOTAL_SKIPPED"
    echo "  Total errors:  $TOTAL_ERRORS"
    echo "========================================="
    break
  fi

  # If everything in this page was skipped (all already in DB),
  # jump ahead to next page immediately
  if [ "$CREATED" -eq 0 ] && [ "$ERRORS" -eq 0 ]; then
    echo "  All bills already in DB, jumping to next page..."
    OFFSET=$NEXT_OFFSET
  else
    # If we created bills but didn't exhaust the page, re-run same offset
    # (there may be more new bills in this 250-bill page)
    PROCESSED=$((CREATED + SKIPPED + ERRORS))
    if [ "$PROCESSED" -lt "$BILLS_IN_PAGE" ] 2>/dev/null; then
      echo "  More bills in this page, re-running same offset..."
    else
      OFFSET=$NEXT_OFFSET
    fi
  fi

  RUN=$((RUN + 1))

  # Small delay between calls to be nice to the server
  echo "  Waiting 3s before next call..."
  sleep 3
  echo ""
done
