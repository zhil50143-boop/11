"""Archive a committed review snapshot with its already verified H5 and copy."""
from pathlib import Path
import hashlib, json, subprocess, sys, zipfile

root = Path(__file__).resolve().parent.parent
if len(sys.argv) != 4:
    raise SystemExit('Usage: delivery-record.json new-output.zip new-source-record.json')
delivery_path, target, record_path = [Path(p).resolve() for p in sys.argv[1:]]
assert not target.exists() and not record_path.exists(), 'Preserve prior artifacts'
delivery = json.loads(delivery_path.read_text(encoding='utf-8'))
index = json.loads((root / 'docs/PLATFORM_REVIEW_COPY.index.json').read_text(encoding='utf-8'))
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
subprocess.run(['git', 'diff', '--exit-code', 'HEAD', '--', 'docs', 'assets', 'settings', 'build-config', 'package.json'], cwd=root, check=True)
temporary = root / ('work/review-source-' + commit[:12] + '.zip')
assert not temporary.exists(), 'Preserve archive snapshot'
subprocess.run(['git', '-c', 'core.autocrlf=false', 'archive', '--format=zip', '--output=' + str(temporary), commit], cwd=root, check=True)
sha = lambda raw: hashlib.sha256(raw).hexdigest()
assert sha(Path(delivery['file']).read_bytes()) == delivery['sha256']
with zipfile.ZipFile(temporary) as source:
    assert not any(n.startswith(('work/', 'node_modules/', '.git/')) or n == '.env' or n.endswith('/.env') for n in source.namelist())
    for entry in index['inputs']:
        text = source.read(entry['file']).decode('utf-8').replace('\r\n', '\n')
        assert sha(text.encode('utf-8')) == entry['sha256'], entry['file']
    assert sha(source.read('docs/PLATFORM_REVIEW_COPY.md')) == index['export']['sha256']
    target.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for entry in source.infolist():
            if not entry.is_dir(): archive.writestr('source/' + entry.filename, source.read(entry.filename))
        archive.write(delivery['file'], 'H5/' + Path(delivery['file']).name)
        for file, destination in [('docs/PLATFORM_REVIEW_COPY.md', 'review/全部文案.md'), ('docs/PLATFORM_REVIEW_COPY.md', 'review/全部文案.txt'), ('docs/PLATFORM_REVIEW_COPY.index.json', 'review/文案来源索引.json'), ('docs/REVIEW_HANDOFF.md', 'review/审核交接.md'), ('docs/REGRESSION_10000.md', 'review/万轮测试报告.md')]:
            archive.writestr(destination, source.read(file))
        baseline = {'repository': 'https://github.com/zhil50143-boop/11', 'branch': 'main', 'gameSourceCommit': delivery['buildSourceCommit'], 'copySourceCommit': index['sourceCommit'], 'documentCommit': commit, 'H5sha256': delivery['sha256'], 'copySha256': index['export']['sha256'], 'verifiedSourceInputs': len(index['inputs']), 'kind': 'development verification, not final release', 'physicalTapTapAndHumanAcceptance': 'pending', 'uploadedToTapTap': False}
        archive.writestr('BASELINE.json', json.dumps(baseline, ensure_ascii=False, indent=2) + '\n')
with zipfile.ZipFile(target) as check:
    assert check.testzip() is None
    assert sha(check.read('review/全部文案.md')) == index['export']['sha256']
    assert sha(check.read('H5/' + Path(delivery['file']).name)) == delivery['sha256']
    entries = len(check.namelist())
record = {**baseline, 'file': str(target), 'bytes': target.stat().st_size, 'entries': entries, 'sha256': sha(target.read_bytes()), 'crc': 'PASS', 'modelWeightsOrDevRuntimeIncluded': False}
record_path.parent.mkdir(parents=True, exist_ok=True)
record_path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: record[key] for key in ['file', 'bytes', 'entries', 'sha256', 'crc', 'documentCommit']}, ensure_ascii=False))
