"""Fetch a fixed official Node runtime, verify its SHA-256, then extract it."""
import hashlib
import pathlib
import sys
import urllib.request
import zipfile

VERSION = '22.23.4'
ARCHIVE = f'node-v{VERSION}-win-x64.zip'
SHA256 = 'cbc74b5e0982c9dbb41525fd8fb5dcd32fbee237863f7829072f4639a1ce5f20'
if len(sys.argv) != 2:
    raise SystemExit('Usage: download-windows-runtime.py NEW_DIRECTORY')
destination = pathlib.Path(sys.argv[1]).resolve()
destination.mkdir(parents=True, exist_ok=False)
archive = destination / ARCHIVE
urllib.request.urlretrieve(f'https://nodejs.org/dist/v{VERSION}/{ARCHIVE}', archive)
if hashlib.file_digest(archive.open('rb'), 'sha256').hexdigest() != SHA256:
    archive.unlink()
    raise SystemExit('Node runtime checksum did not match; extraction refused.')
with zipfile.ZipFile(archive) as package:
    for member in package.infolist():
        target = (destination / member.filename).resolve()
        if not target.is_relative_to(destination):
            raise SystemExit('Unexpected archive path; extraction refused.')
    package.extractall(destination)
print(destination / f'node-v{VERSION}-win-x64')
