#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"
Z=~/.compact/versions/0.31.1/aarch64-darwin/zkir
n="$1"; mkdir -p src out
cat > "src/$n.compact"
if ! compact compile +0.31.1 --skip-zk "src/$n.compact" "out/$n" > "out/$n.err" 2>&1; then
  echo "  $n: COMPILE_FAIL"; sed -n '1,6p' "out/$n.err" | sed 's/^/      /'; exit 1
fi
tot=0
for f in out/$n/zkir/*.zkir; do
  r=$($Z mock-compile "$f" 2>&1 | grep -oE 'rows=[0-9]+' | cut -d= -f2)
  k=$($Z mock-compile "$f" 2>&1 | grep -oE 'k=[0-9]+' | cut -d= -f2)
  printf "  %-28s k=%-3s rows=%s\n" "$(basename $f .zkir)" "$k" "$r"
  tot=$((tot+r))
done
echo "  TOTAL rows: $tot"
