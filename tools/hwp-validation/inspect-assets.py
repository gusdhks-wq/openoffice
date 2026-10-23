#!/usr/bin/env python3
"""Independent HWP5 BinData comparison; prints counts/booleans, never paths/text."""
import argparse
import hashlib
import json
import zlib
import olefile

p = argparse.ArgumentParser()
p.add_argument('original')
p.add_argument('edited')
args = p.parse_args()

def assets(path):
    with olefile.OleFileIO(path) as doc:
        hashes = []
        for name in doc.listdir():
            if name[0] != 'BinData':
                continue
            raw = doc.openstream(name).read()
            try:
                raw = zlib.decompress(raw, -15)
            except zlib.error:
                pass
            hashes.append(hashlib.sha256(raw).hexdigest())
        return sorted(hashes)

a, b = assets(args.original), assets(args.edited)
print(json.dumps({'originalAssetCount': len(a), 'editedAssetCount': len(b), 'decompressedAssetsEqual': a == b}))
raise SystemExit(0 if a == b else 1)
