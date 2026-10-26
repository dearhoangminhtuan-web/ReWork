# Dev helper: deep-merge a JSON chunk {"en": {...}, "vi": {...}, "ja": {...}} into messages/*.json
import json, sys, os
root = os.path.join(os.path.dirname(__file__), "..", "messages")
chunk = json.load(open(sys.argv[1]))
def merge(a, b):
    for k, v in b.items():
        if isinstance(v, dict) and isinstance(a.get(k), dict): merge(a[k], v)
        else: a[k] = v
for lang, data in chunk.items():
    p = os.path.join(root, f"{lang}.json")
    cur = json.load(open(p)) if os.path.exists(p) else {}
    merge(cur, data)
    with open(p, "w") as f: json.dump(cur, f, ensure_ascii=False, indent=2); f.write("\n")
print("merged", sys.argv[1])
