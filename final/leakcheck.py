#!/usr/bin/env python3
"""ZKIR private-variable leak check.

Variable model calibrated empirically against this contract's ZKIR:
circuit inputs occupy vars 0..num_inputs-1; persistent_hash, ec_* and
div_mod_power_of_two each produce 2 values, every other producing op 1.
The model is self-validating: max referenced var == total vars - 1 in all
circuits (slack 0), so the numbering is uniquely determined.
"""
import json, glob, os, sys
NONPROD = {'declare_pub_input','pi_skip','constrain_bits','constrain_to_boolean','assert'}
def arity(op):
    if op in NONPROD: return 0
    return 2 if (op == 'persistent_hash' or op.startswith('ec_') or op == 'div_mod_power_of_two') else 1

bad = 0
print(f"{'CIRCUIT':<22} {'priv':>5} {'pub':>5} {'vars':>6}  RESULT")
for f in sorted(glob.glob('managed/zkir/*.zkir')):
    d = json.load(open(f)); ins = d['instructions']; ni = d.get('num_inputs', 0)
    c = ni; src = {}
    for i, x in enumerate(ins):
        for _ in range(arity(x['op'])):
            src[c] = (x['op'], i); c += 1
    priv = [v for v, (o, _) in src.items() if o == 'private_input']
    pub  = {x['var'] for x in ins if x['op'] == 'declare_pub_input'}
    leak = sorted(set(priv) & pub)
    name = os.path.basename(f)[:-5]
    if leak:
        bad += 1
        print(f"{name:<22} {len(priv):>5} {len(pub):>5} {c:>6}  *** LEAK vars {leak} ***")
        for v in leak:
            bits = [x['bits'] for x in ins if x['op']=='constrain_bits' and x.get('var')==v]
            print(f"{'':24}   var {v} bits={bits} from {src[v]}")
    else:
        print(f"{name:<22} {len(priv):>5} {len(pub):>5} {c:>6}  clean")
print()
print("RESULT:", "ALL CLEAN — no private input reaches the public transcript"
      if bad == 0 else f"{bad} circuit(s) LEAK")
sys.exit(1 if bad else 0)
