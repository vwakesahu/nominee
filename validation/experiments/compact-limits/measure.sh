#!/bin/bash
# measure.sh <name>  ; reads compact source on stdin; prints rows
export PATH="$HOME/.local/bin:$PATH"
Z=~/.compact/versions/0.34.0/aarch64-darwin/zkir-v3
n="$1"; cat > cal/$n.compact
if ! compact compile --feature-zkir-v3 --skip-zk cal/$n.compact cal/out_$n > cal/$n.err 2>&1; then
  echo "$n: COMPILE_FAIL: $(sed -n 2p cal/$n.err | tr -s ' ')"; exit 1
fi
tot=0
for f in cal/out_$n/zkir/*.zkir; do
  r=$($Z mock-compile "$f" 2>&1 | grep -oE 'k=[0-9]+, rows=[0-9]+')
  echo "$n [$(basename $f .zkir)]: $r"
done
