from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
target = root / 'release' / 'kurio-frontend-challenge.zip'
target.parent.mkdir(exist_ok=True)
excluded = {'node_modules', '.git', '.agents', '.codex', '.aws', 'dist', 'dist-ssr', 'release', 'test-results', 'playwright-report', '.lighthouseci', '.DS_Store'}
with ZipFile(target, 'w', ZIP_DEFLATED) as package:
    for file in sorted(root.rglob('*')):
        relative = file.relative_to(root)
        if not file.is_file() or any(part in excluded for part in relative.parts):
            continue
        if file.name.startswith('.env') and file.name != '.env.example':
            continue
        if relative.parts[0] == 'lighthouse' and len(relative.parts) > 2 and relative.parts[1] == 'reports' and relative.parts[2] not in {'mobile', 'desktop', 'summary.json'}:
            continue
        package.write(file, relative)
print(target)
print(f'{target.stat().st_size / 1024 / 1024:.1f} MiB')
