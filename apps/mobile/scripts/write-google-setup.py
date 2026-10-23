"""Verify the built APK and add its public certificate fingerprint to the setup guide."""
import hashlib
import os
from pathlib import Path
import struct
import subprocess
import sys


def length_prefixed(data, offset=0):
    size = struct.unpack_from('<I', data, offset)[0]
    end = offset + 4 + size
    if end > len(data):
        raise ValueError('Invalid APK signing field.')
    return data[offset + 4:end], end


def signing_certificates(data):
    # APK Signature Scheme v2/v3: verified signer -> signed data -> certificate chain.
    eocd = data.rfind(b'PK\x05\x06', max(0, len(data) - 65557))
    if eocd < 0 or eocd + 22 + struct.unpack_from('<H', data, eocd + 20)[0] != len(data):
        raise ValueError('APK ZIP directory was not found.')
    central = struct.unpack_from('<I', data, eocd + 16)[0]
    if data[central - 16:central] != b'APK Sig Block 42':
        raise ValueError('A modern APK signing block is required.')
    size = struct.unpack_from('<Q', data, central - 24)[0]
    start = central - size - 8
    if start < 0 or struct.unpack_from('<Q', data, start)[0] != size:
        raise ValueError('Invalid APK signing block size.')
    certificates = set()
    offset = start + 8
    while offset < central - 24:
        pair_size = struct.unpack_from('<Q', data, offset)[0]
        end = offset + 8 + pair_size
        if pair_size < 4 or end > central - 24:
            raise ValueError('Invalid APK signer pair.')
        identifier = struct.unpack_from('<I', data, offset + 8)[0]
        if identifier in (0x7109871a, 0xf05368c0):
            signers, _ = length_prefixed(data[offset + 12:end])
            signer_offset = 0
            while signer_offset < len(signers):
                signer, signer_offset = length_prefixed(signers, signer_offset)
                signed, _ = length_prefixed(signer)
                _, after_digests = length_prefixed(signed)
                chain, _ = length_prefixed(signed, after_digests)
                certificate, _ = length_prefixed(chain)
                certificates.add(certificate)
        offset = end
    if len(certificates) != 1:
        raise ValueError('Expected a single consistent debug APK signer.')
    return certificates


def main():
    apk, template, output = map(Path, sys.argv[1:])
    sdk = os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT')
    if not sdk or not apk.is_file():
        raise RuntimeError('Android SDK and built APK are required.')
    signers = sorted((Path(sdk) / 'build-tools').glob('*/apksigner'))
    if not signers:
        raise RuntimeError('Android SDK apksigner was not found.')
    result = subprocess.run([str(signers[-1]), 'verify', str(apk)],
                            text=True, capture_output=True, check=False)
    if result.returncode:
        raise RuntimeError('The built APK signature could not be verified.')
    certificate = next(iter(signing_certificates(apk.read_bytes())))
    digest = hashlib.sha1(certificate).hexdigest().upper()
    fingerprint = ':'.join(digest[index:index + 2] for index in range(0, len(digest), 2))
    output.write_text(template.read_text(encoding='utf-8') +
                      '\n이 APK의 Android OAuth 설정값\n패키지: com.ieumoffice.mobile.prototype\nSHA-1: ' +
                      fingerprint + '\n', encoding='utf-8')
    print('Verified APK public signing SHA-1: ' + fingerprint)


if __name__ == '__main__':
    main()
