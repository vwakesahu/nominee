#!/usr/bin/env python3
"""Byte-scan a deployed Midnight contract's serialized public state for
plausible encodings of values that are supposed to be private, with
positive controls for values that ARE public."""
import sys, json, hashlib

hexs = open('raw/preprod_contract_state.hex').read().strip()
blob = bytes.fromhex(hexs)
print(f"state: {len(blob)} bytes   header={blob[:26]!r}\n")

def encodings(v: int):
    """Every plausible on-wire encoding of an integer."""
    out = {}
    for width in (1,2,4,8,16,32):
        try:
            be = v.to_bytes(width,'big'); le = v.to_bytes(width,'little')
        except OverflowError:
            continue
        out[f"u{width*8}be"] = be
        out[f"u{width*8}le"] = le
    # minimal big-endian / little-endian
    n = max(1,(v.bit_length()+7)//8)
    out["minbe"] = v.to_bytes(n,'big'); out["minle"] = v.to_bytes(n,'little')
    # decimal ASCII
    out["ascii"] = str(v).encode()
    return out

def scan(label, v, expect):
    hits = []
    for name, pat in encodings(v).items():
        if len(pat) < 2:            # 1-byte patterns match by chance; skip
            continue
        off = blob.find(pat)
        if off != -1:
            hits.append((name, off, pat.hex()))
    status = "FOUND" if hits else "absent"
    ok = "OK " if (bool(hits) == (expect=="public")) else "!! "
    print(f"{ok}{label:<34} value={v:<22} expect={expect:<8} -> {status}")
    for n,o,h in hits[:3]:
        print(f"      {n} @byte {o}: {h}")
    return bool(hits)

print("=== POSITIVE CONTROLS (these ARE public; scanner must find them) ===")
scan("windowStart (public param)", 20635, "public")
scan("windowEnd (public param)",   20819, "public")
scan("tagAuthority.x (public key)",
     48817866768362115749717640132431737144656854862769456630695825445246438828101, "public")
scan("tagAuthority.y (public key)",
     26210506021675530152345939211530494862711628490685782702923573844959068851475, "public")

print("\n=== NEGATIVE CONTROLS (private-by-design; scanner must NOT find them) ===")
for cand in [1,2,3,42,1000,5000,10000,12345,100000,250000,1000000]:
    scan(f"plausible invoice amount", cand, "private")
