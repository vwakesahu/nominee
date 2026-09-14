#!/bin/bash
# usage: probe.sh <name> <<'SRC' ... SRC
n="$1"; mkdir -p src out
cat > "src/$n.compact"
echo "######## $n ########"
compact compile --skip-zk "src/$n.compact" "out/$n" 2>&1
echo "EXIT=$?"
