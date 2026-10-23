"""Verify the built APK and add its public certificate fingerprint to the setup guide."""
import os
from pathlib import Path
import re
import subprocess
import sys

apk, template, output = map(Path, sys.argv[1:])
sdk = os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT')
if not sdk or not apk.is_file():
    raise RuntimeError('Android SDK and built APK are required.')
signers = sorted((Path(sdk) / 'build-tools').glob('*/apksigner'))
if not signers:
    raise RuntimeError('Android SDK apksigner was not found.')
result = subprocess.run([str(signers[-1]), 'verify', '--print-certs', str(apk)],
                        text=True, capture_output=True, check=False)
if result.returncode:
    raise RuntimeError('The built APK signature could not be verified.')
fingerprints = set(re.findall(r'Signer #\d+ certificate SHA-1 digest: ([0-9a-fA-F]{40})', result.stdout))
if len(fingerprints) != 1:
    raise RuntimeError('Expected one verified APK signing certificate.')
digest = fingerprints.pop().upper()
fingerprint = ':'.join(digest[index:index + 2] for index in range(0, len(digest), 2))
output.write_text(template.read_text(encoding='utf-8') +
                  '\n이 APK의 Android OAuth 설정값\n패키지: com.ieumoffice.mobile.prototype\nSHA-1: ' +
                  fingerprint + '\n', encoding='utf-8')
print('Verified APK public signing SHA-1: ' + fingerprint)
