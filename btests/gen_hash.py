import sys
fn=sys.argv[1]; n=int(sys.argv[2]); ty=sys.argv[3] if len(sys.argv)>3 else "Bytes<32>"
ret="Field" if fn=="transientHash" else "Bytes<32>"
print("pragma language_version >= 0.26;\nimport CompactStandardLibrary;")
print(f"export ledger sink: Bytes<32>;")
print(f"export circuit f(x: {ty}): [] {{")
print(f"  const h0 = x;")
prev="h0"
for i in range(1,n+1):
    if fn=="transientHash":
        # transientHash returns Field; feed back via persistentHash of field
        print(f"  const h{i} = transientHash<Field>(h{i-1});" if i>1 else f"  const h{i} = transientHash<{ty}>(h0);")
    else:
        src_ty = ty if i==1 else "Bytes<32>"
        print(f"  const h{i} = {fn}<{src_ty}>(h{i-1});")
    prev=f"h{i}"
if fn=="transientHash":
    print(f"  sink.write(disclose(persistentHash<Field>({prev})));")
else:
    print(f"  sink.write(disclose({prev}));")
print("}")
