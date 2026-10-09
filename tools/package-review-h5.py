"""Pack an existing verified Cocos build, preserving prior candidates and sources."""
from pathlib import Path
import hashlib, json, subprocess, sys, zipfile

root = Path(__file__).resolve().parent.parent
if len(sys.argv) != 5:
    raise SystemExit('Usage: build-directory new-output.zip new-record.json build-source-commit')
build, target, record_file = [Path(p).resolve() for p in sys.argv[1:4]]
build_source = subprocess.check_output(['git', 'rev-parse', sys.argv[4]], cwd=root, text=True).strip()
assert (build / 'index.html').is_file(), 'Missing Web Mobile entry'
assert not target.exists() and not record_file.exists(), 'Preserve existing artifacts'
subprocess.run(['git', 'diff', '--exit-code', build_source, '--', 'assets', 'settings', 'build-config', 'build-templates', 'package.json'], cwd=root, check=True)
sha = lambda raw: hashlib.sha256(raw).hexdigest()
target.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(build.rglob('*')):
        if file.is_file():
            archive.write(file, 'game/' + file.relative_to(build).as_posix())
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    names = archive.namelist()
    assert 'game/index.html' in names and all(n.startswith('game/') for n in names)
    hashes = {sha(archive.read(n)) for n in names}
    manifest = json.loads((root / 'art/visual-v2/manifest.json').read_text(encoding='utf-8'))
    generated = []
    for asset in manifest['assets']:
        assert asset['sha256'] in hashes, 'Missing Image delivery bytes: ' + asset['id']
        generated.append(asset['id'])
    voices = {}
    for voice in ['01-full', '01-opening']:
        digest = sha((root / ('assets/resources/audio/' + voice + '.mp3')).read_bytes())
        assert digest in hashes, 'Missing confirmed voice: ' + voice
        voices[voice] = digest
    prior_photos = json.loads((root / 'docs/validation/V2_ALBUM_DELIVERY.json').read_text(encoding='utf-8'))['originalPhotoSha256']
    for photo, digest in prior_photos.items():
        assert digest in hashes, 'Missing original photo bytes: ' + photo
record = {
    'version': json.loads((root / 'package.json').read_text(encoding='utf-8'))['version'],
    'kind': 'development verification, not final release',
    'build': str(build.relative_to(root)).replace('\\', '/'),
    'buildSourceCommit': build_source,
    'file': str(target), 'bytes': target.stat().st_size, 'entries': len(names),
    'sha256': sha(target.read_bytes()), 'crc': 'PASS',
    'generatedAssetBytesVerified': generated, 'voiceSha256': voices,
    'originalPhotoSha256': prior_photos,
    'buildFiles': [],
    'uploadedToTapTap': False,
    'platform': 'Prepared locally. Remote upload, binding, review and publication require separate status verification.',
}
with zipfile.ZipFile(target) as archive:
    record['buildFiles'] = [{'file': n, 'sha256': sha(archive.read(n))} for n in names]
record_file.parent.mkdir(parents=True, exist_ok=True)
record_file.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({k: record[k] for k in ['file', 'bytes', 'entries', 'sha256', 'crc', 'buildSourceCommit']}, ensure_ascii=False))
