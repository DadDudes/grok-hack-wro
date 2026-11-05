import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import board_kit as bk
import agents as ag

HERE = Path(__file__).parent
BB = HERE.parent
OUT = sys.argv[1] if len(sys.argv) > 1 else str(BB / 'directions-round4-agents.html')
BRAND = bk.load_brand(BB)
FOOT = bk.footer_text(BRAND, 'round 4', 'agents and motion')
P = {p['id']: p for p in json.loads((BB / 'research' / 'palettes-r3.json').read_text())}['C4']
BY_KEY = {a['key']: a for a in ag.AGENTS}
HUES = ag.agent_hues(P)
STATES = ('idle', 'working', 'handoff', 'done')
SLOT = 2.0
WORK = 1.5


def colors(key):
    return ag.agent_colors(P, key)


def fig(key, state, size):
    a = BY_KEY[key]
    return bk.svg(ag.sticker_figure(colors(key), a['acc'], state), size)


def lead_card(a):
    hue = HUES[a['key']]
    bubble = bk.tint(hue, .7)
    return (
        f'<div class="lead"><div class="tp6" style="background:{P["ground"]}">'
        f'<span class="sd">Main character · Kid</span>{fig(a["key"], "idle", 330)}</div>'
        f'<div class="bd6"><div class="nm6">{a["name"]}</div><div class="rl5">{a["role"]} agent · leads the crew</div>'
        f'<div class="tx5"><i>Does</i>{a["does"]}</div><div class="tx5"><i>Look</i>{a["prop"]}</div>'
        f'<div class="say5" style="background:{bubble};color:{P["ink"]}">{a["line"]}</div></div></div>'
    )


def crew_card(a):
    hue = HUES[a['key']]
    bubble = bk.tint(hue, .7)
    return (
        f'<div class="crew"><div class="tp7" style="background:{P["ground"]}">'
        f'<span class="sd">{a["side"]}</span>{fig(a["key"], "idle", 170)}</div>'
        f'<div class="bd7"><div class="nm5">{a["name"]}</div><div class="rl5">{a["role"]} agent</div>'
        f'<div class="tx5">{a["does"]}</div><div class="tx5"><i>Prop</i>{a["prop"]}</div>'
        f'<div class="say5" style="background:{bubble};color:{P["ink"]}">{a["line"]}</div></div></div>'
    )


def lineup_page():
    crew = ''.join(crew_card(a) for a in ag.AGENTS if a['key'] != 'robo')
    body = (
        '<div class="kick">Agents · Robo is the logo and the main character · the crew wears props · palette C4</div>'
        '<h2 class="t">Robo and <span>his crew</span></h2>'
        f'<div class="lineup">{lead_card(BY_KEY["robo"])}<div class="crew4">{crew}</div></div>'
    )
    return bk.section('kp', body, FOOT)


def states_page():
    rows = []
    ordered = [BY_KEY['robo']] + [a for a in ag.AGENTS if a['key'] != 'robo']
    for a in ordered:
        c = colors(a['key'])
        cells = [ag.sticker_figure(c, a['acc'], s) for s in STATES]
        rows.append(((a['name'], a['role'], a['side'] + ' side'), cells))
    return bk.grid_page(
        'Animation states · each agent has the same four', 'Idle, working, <span>handoff</span>, done',
        [('Idle', 'Waiting, slow bob'), ('Working', 'Glow ring, prop animates, thought dots'),
         ('Handoff', 'Passes the task card'), ('Done', 'Pop and a mint check')],
        rows, FOOT, label_w=170, cell_h=124, cell_size=116,
    )


def window_keyframes(name, a, b, total, on='opacity:1', off='opacity:0'):
    pa = a / total * 100
    pb = b / total * 100
    frames = []
    if pa <= 0:
        frames.append(f'0%,{max(pb - .01, 0):.2f}%{{{on}}}')
    else:
        frames.append(f'0%,{pa - .01:.2f}%{{{off}}}')
        frames.append(f'{pa:.2f}%,{pb - .01:.2f}%{{{on}}}')
    if pb < 100:
        frames.append(f'{pb:.2f}%,100%{{{off}}}')
    return f'@keyframes {name}{{{"".join(frames)}}}'


def strip(sid, title, keys, ground):
    n = len(keys)
    total = n * SLOT
    css = []
    stations = ''
    for i, key in enumerate(keys):
        s = i * SLOT
        windows = {'idle': (0, s), 'working': (s, s + WORK), 'handoff': (s + WORK, s + SLOT), 'done': (s + SLOT, total)}
        layers = ''
        for state in STATES:
            a, b = windows[state]
            if b <= a:
                continue
            name = f'{sid}{i}{state}'
            css.append(window_keyframes(name, a, b, total))
            size = 190 if key == 'robo' else 150
            layers += (f'<g style="animation:{name} {total}s linear infinite">'
                       f'{fig(key, state, size)}</g>')
        glow_name = f'{sid}{i}glow'
        css.append(window_keyframes(glow_name, s, s + SLOT, total, 'opacity:.9;transform:scale(1)',
                                    'opacity:0;transform:scale(.7)'))
        chip_name = f'{sid}{i}chip'
        hue = HUES[key]
        css.append(window_keyframes(chip_name, s, s + SLOT, total, f'background:{hue}', 'background:#FFFFFF'))
        a = BY_KEY[key]
        stations += (
            f'<div class="st"><div class="figs bob{" big" if key == "robo" else ""}"><div class="glow" '
            f'style="background:{hue};animation:{glow_name} {total}s linear infinite"></div>{layers}</div>'
            f'<span class="chp" style="animation:{chip_name} {total}s linear infinite">{a["name"]} · {a["role"]}</span>'
            f'</div>'
        )
    width = 1488 - 40
    step = width / n
    xs = [20 + step * (i + .5) - 15 for i in range(n)]
    frames = [f'0%{{left:{xs[0]:.0f}px;opacity:0}}']
    for i in range(n - 1):
        start = (i * SLOT + WORK) / total * 100
        end = (i * SLOT + SLOT) / total * 100
        frames.append(f'{start - .01:.2f}%{{left:{xs[i]:.0f}px;opacity:0}}')
        frames.append(f'{start:.2f}%{{left:{xs[i] + 40:.0f}px;opacity:1}}')
        frames.append(f'{end - .01:.2f}%{{left:{xs[i + 1] - 40:.0f}px;opacity:1}}')
        frames.append(f'{end:.2f}%{{left:{xs[i + 1]:.0f}px;opacity:0}}')
    frames.append(f'100%{{left:{xs[-1]:.0f}px;opacity:0}}')
    css.append(f'@keyframes {sid}pk{{{"".join(frames)}}}')
    body = (
        f'<div class="strip" style="background:{ground}"><div class="lab" style="color:{P["ink"]}">{title}</div>'
        f'<div class="row"><div class="track"></div>{stations}'
        f'<div class="pk" data-allow-overlap style="animation:{sid}pk {total}s linear infinite"></div></div></div>'
    )
    return body, ''.join(css)


def motion_page():
    kid, kid_css = strip('k', 'Kid screen S2 · building the game', ['prof', 'spark', 'doodle', 'robo'], P['cream'])
    par, par_css = strip('p', 'After the game · parent report', ['robo', 'lens', 'prof'], bk.tint(P['ground'], .85))
    spec = (
        '<div class="mspec">'
        '<div><b>Idle</b>Bob 4 px, 2.4 s ease-in-out, loops. Agent is greyed in the timeline chip.</div>'
        '<div><b>Working</b>Glow ring in the agent colour, prop loops: bulb flickers, pencil writes, brush paints, '
        'lens sweeps.</div>'
        '<div><b>Handoff</b>Task card flies to the next agent in 500 ms, ease-out. Next chip lights up.</div>'
        '<div><b>Done</b>Pop 1 to 1.12 to 1 in 300 ms, mint check badge, cheer pose.</div>'
        '<div><b>Reduced motion</b>Colour, chip and badge change only. No bob, no flying card.</div>'
        '</div>'
    )
    body = (
        '<div class="kick">Motion · live in the browser · each step is a pipeline event from the agents spec</div>'
        '<h2 class="t">Agents <span>at work</span></h2>'
        f'<style>{kid_css}{par_css}</style><div class="live">{kid}{par}{spec}</div>'
    )
    return bk.section('kp', body, FOOT)


pages = [lineup_page(), states_page(), motion_page()]
Path(OUT).write_text(bk.document('EduBotGames Agents', pages))
print('wrote', OUT)
