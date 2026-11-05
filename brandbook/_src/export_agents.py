import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import agents as ag
import export as ex

BB = Path(__file__).parent.parent
OUT = BB / 'assets' / 'agents'
PALETTE_ID = 'C4'
STATES = ('idle', 'working', 'handoff', 'done')

palettes = {p['id']: p for p in json.loads((BB / 'research' / 'palettes-r3.json').read_text())}
p = palettes[PALETTE_ID]
OUT.mkdir(parents=True, exist_ok=True)
hues = ag.agent_hues(p)
for a in ag.AGENTS:
    c = ag.agent_colors(p, a['key'])
    for state in STATES:
        doc = ex.svg_doc(ag.sticker_figure(c, a['acc'], state), 512, 512, '0 0 120 120')
        (OUT / f'{a["key"]}-{state}.svg').write_text(doc)
    head = ex.svg_doc(ag.sticker_head(c, a['acc'], 'idle'), 256, 256, '0 0 120 120')
    (OUT / f'{a["key"]}-head.svg').write_text(head)
meta = [dict(key=a['key'], name=a['name'], role=a['role'], side=a['side'], color=hues[a['key']], line=a['line'])
        for a in ag.AGENTS]
(OUT / 'agents.json').write_text(json.dumps(meta, indent=2) + '\n')
print(json.dumps(meta, indent=1))
