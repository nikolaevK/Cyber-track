#!/usr/bin/env bash
# Stages Vercel WAF rules for this site in LOG mode (nothing is blocked yet), then shows the diff.
# Run from the repo root after `vercel link`. Review the staged rules and publish yourself:
#
#   npx vercel firewall publish --yes
#
# After a day of production traffic in the Firewall dashboard, tighten each rule:
#   npx vercel firewall rules edit "<name>" --rate-limit-action rate_limit --yes   (429 on excess)
#   npx vercel firewall rules edit "<name>" --action deny --yes                    (for the probe rule)
#
# Rate-limit counters are per region, so the effective limit is a small multiple of the number below.
set -euo pipefail

vc="npx vercel"

# 1. POST /api/checkout — the only endpoint that writes to the database and calls Stripe.
#    A real visitor needs one or two per visit; ten per minute per IP is generous.
$vc firewall rules add "Rate limit checkout" \
  --condition '{"type":"path","op":"eq","value":"/api/checkout"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 10 \
  --rate-limit-keys ip \
  --rate-limit-action log \
  --yes

# 2. /success — every hit with a session id costs one Stripe API call.
$vc firewall rules add "Rate limit success page" \
  --condition '{"type":"path","op":"eq","value":"/success"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 20 \
  --rate-limit-keys ip \
  --rate-limit-action log \
  --yes

# 3. Car pages — each view is a server render. Sixty per minute per IP is far above human browsing.
$vc firewall rules add "Rate limit page renders" \
  --condition '{"type":"path","op":"inc","value":["/","/cybertruck","/g-wagon","/gt3"]}' \
  --condition '{"type":"method","op":"eq","value":"GET"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 60 \
  --rate-limit-keys ip \
  --rate-limit-action log \
  --yes

# 4. Common exploit probes. This site has none of these paths.
$vc firewall rules add "Log exploit probes" \
  --condition '{"type":"path","op":"inc","value":["/wp-admin","/wp-login.php","/.env","/.git/config","/phpmyadmin","/xmlrpc.php"]}' \
  --action log \
  --yes

$vc firewall diff
