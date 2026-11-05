import re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root = Path(sys.argv[1])
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome')
    for f in sorted(root.rglob('*.svg')):
        t = f.read_text()
        w, h = (int(x) for x in re.search(r'width="(\d+)" height="(\d+)"', t).groups())
        pg = b.new_page(viewport={'width': w, 'height': h})
        pg.goto(f.as_uri())
        pg.wait_for_load_state('networkidle')
        pg.evaluate('document.fonts.ready')
        pg.wait_for_timeout(300)
        pg.screenshot(path=str(f.with_suffix('.png')), omit_background=True)
        pg.close()
        print(f.with_suffix('.png').name)
    b.close()
