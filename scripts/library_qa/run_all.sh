#!/usr/bin/env bash
# Full Library QA: static checks, then browser checks against a local server. Needs Playwright + Chrome.
set -u
cd "$(dirname "$0")/../.."
python3 scripts/library_qa/check_static.py || exit 1
(pgrep -f "http.server 8765" >/dev/null) || (python3 -m http.server 8765 >/dev/null 2>&1 &)
sleep 1
fail=0
out=$(python3 scripts/library_qa/layout.py 2>&1); echo "$out" | grep -v "overflow 0 small \['Skip to content:25'\]" | grep -q . && { echo "LAYOUT:"; echo "$out" | grep -v "overflow 0 small \['Skip to content:25'\]"; fail=1; }
python3 scripts/library_qa/game.py | grep -q "bad: \[\]" || { echo "GAME FAILED"; fail=1; }
for t in interactions problems books ai_search; do r=$(timeout 300 python3 scripts/library_qa/$t.py 2>&1 | tail -1); echo "$t: $r"; echo "$r" | grep -q "errs \[\]" || fail=1; done
exit $fail
