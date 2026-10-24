"""Download a pinned Cloudflare connector and verify its published SHA-256."""
import hashlib
import pathlib
import sys
import urllib.request

VERSION = '2026.10.3'
FILES = {
    'windows': ('cloudflared-windows-amd64.exe', '76b2805253d0d6ffacb092a7acfbee99e7af6917835c0c5410e23f3ef5052da2', 'cloudflared.exe'),
    'linux': ('cloudflared-linux-amd64', '053b80b0a23031a038fdbf3c073f59f82b8f1f152aa67971d7383ffafc0dbab0', 'cloudflared'),
}
if len(sys.argv) != 3 or sys.argv[1] not in FILES:
    raise SystemExit('Usage: download-mobile-connector.py windows|linux NEW_DIRECTORY')
name, expected, output = FILES[sys.argv[1]]
directory = pathlib.Path(sys.argv[2]).resolve()
directory.mkdir(parents=True, exist_ok=False)
target = directory / output
urllib.request.urlretrieve(f'https://github.com/cloudflare/cloudflared/releases/download/{VERSION}/{name}', target)
with target.open('rb') as stream:
    actual = hashlib.file_digest(stream, 'sha256').hexdigest()
if actual != expected:
    target.unlink()
    raise SystemExit('Connector checksum mismatch; refusing this download.')
# Retain the binary's upstream license beside the runtime.
urllib.request.urlretrieve(f'https://raw.githubusercontent.com/cloudflare/cloudflared/{VERSION}/LICENSE', directory / 'CLOUDFLARED-LICENSE')
target.chmod(0o755)
print(f'Verified cloudflared {VERSION}.')
