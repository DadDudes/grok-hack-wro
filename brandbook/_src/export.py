import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import agents as ag
import marks2 as m2
import padbot as pb

BB = Path(__file__).parent.parent
OUT = BB / 'assets'
PALETTE_FILE = BB / 'research' / 'palettes-r3.json'
PALETTE_ID = 'C4'
PALETTE_LIST = json.loads(PALETTE_FILE.read_text())
PALETTES = {p['id']: p for p in PALETTE_LIST}
P = PALETTES[PALETTE_ID]

WHITE = '#FFFFFF'
ROBO_KEY = 'robo'
C = ag.agent_colors(P, ROBO_KEY)
MONO = dict(C, F1=WHITE, F2=P['ink'], F4=P['ink'], F5=WHITE)
ON_TEAL = {'ink': P['wm'], 'games': P['games']}
ON_CREAM = {'ink': P['ink'], 'games': P['ground']}

POSES = ('idle', 'think', 'hint', 'cheer')
ART_VIEW = '0 0 120 120'
LOCKUP_W = 990
LOCKUP_H = 240
FONT = (
    "<style>@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@600&amp;"
    "display=swap');text{font-family:'Fredoka',sans-serif;font-weight:600}</style>"
)
SYMBOLS = ('+', '×', '÷', '=')
CONFETTI_COLORS = (P['pad'], P['accent'], P['body'], P['cheek'])
SLOGAN_LINES = ('Parents pick the topic.', 'Kids pick the game.')
HOOK_LINES = ('Screen time is huge.', "Learning time isn't.")
HOOK_CHAR_WIDTH = 0.48
HOOK_PAD = 0.62
HOOK_HEIGHT = 1.5


def svg_doc(inner, w, h, view=None):
    vb = view or f'0 0 {w} {h}'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{vb}">'
        f'{FONT}{inner}</svg>\n'
    )


def place(inner, x, y, size):
    return (
        f'<svg x="{x}" y="{y}" width="{size}" height="{size}" viewBox="{ART_VIEW}">'
        f'{inner}</svg>'
    )


def mark(c=C):
    return m2.sticker(pb.padbot, c)


def figure(pose):
    return m2.sticker(lambda rc: pb.mascot(rc, pose), C, 1.4, 1.8)


def ground(w, h, fill):
    return f'<rect width="{w}" height="{h}" fill="{fill}"/>'


def wordmark(x, y, size, on, anchor='start'):
    return (
        f'<text x="{x}" y="{y}" font-size="{size}" fill="{on["ink"]}" text-anchor="{anchor}">'
        f'EduBot<tspan fill="{on["games"]}">Games</tspan></text>'
    )


def slogan(x, y, size, gap, fill, anchor='start'):
    out = ''
    for i, line in enumerate(SLOGAN_LINES):
        line_y = y + i * gap
        out += (
            f'<text x="{x}" y="{line_y}" font-size="{size}" fill="{fill}" '
            f'text-anchor="{anchor}">{line}</text>'
        )
    return out


def sticker_box(x, y, w, h, rx, fill, text, size):
    ink = P['ink']
    text_y = y + h / 2 + size * 0.35
    return (
        f'<rect x="{x + 6}" y="{y + 7}" width="{w}" height="{h}" rx="{rx}" fill="{ink}"/>'
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" '
        f'stroke="{ink}" stroke-width="5"/>'
        f'<text x="{x + w / 2}" y="{text_y}" font-size="{size}" fill="{ink}" '
        f'text-anchor="middle">{text}</text>'
    )


def hook(x, y, size, anchor='start'):
    first, second = HOOK_LINES
    height = size * HOOK_HEIGHT
    pad = size * HOOK_PAD
    first_w = len(first) * size * HOOK_CHAR_WIDTH + 2 * pad
    second_w = len(second) * size * HOOK_CHAR_WIDTH + 2 * pad
    first_x = x
    second_x = x + size * 0.8
    if anchor == 'middle':
        first_x = x - first_w / 2
        second_x = x - second_w / 2 + size * 0.4
    second_y = y + height + size * 0.55
    return (
        sticker_box(first_x, y, first_w, height, height * 0.2, WHITE, first, size)
        + sticker_box(second_x, second_y, second_w, height, height / 2, P['pad'], second, size)
    )


def confetti(spots):
    out = ''
    for i, (x, y, s) in enumerate(spots):
        sym = SYMBOLS[i % len(SYMBOLS)]
        col = CONFETTI_COLORS[i % len(CONFETTI_COLORS)]
        out += f'<text x="{x}" y="{y}" font-size="{s}" fill="{col}" opacity=".9">{sym}</text>'
    return out


def cover():
    spots = (
        (1060, 200, 110),
        (1780, 300, 90),
        (980, 980, 100),
        (1820, 960, 120),
        (140, 1000, 80),
        (820, 140, 70),
    )
    inner = (
        ground(1920, 1080, P['ground'])
        + confetti(spots)
        + place(mark(), 120, 130, 230)
        + wordmark(120, 530, 150, ON_TEAL)
        + hook(120, 600, 62)
        + place(figure('cheer'), 1130, 170, 740)
    )
    return svg_doc(inner, 1920, 1080)


def vertical():
    spots = (
        (90, 760, 110),
        (900, 820, 100),
        (100, 1400, 90),
        (930, 1360, 120),
        (500, 1880, 70),
        (860, 120, 80),
    )
    inner = (
        ground(1080, 1920, P['ground'])
        + confetti(spots)
        + place(mark(), 430, 130, 220)
        + wordmark(540, 500, 140, ON_TEAL, 'middle')
        + place(figure('cheer'), 150, 560, 780)
        + hook(540, 1440, 66, 'middle')
    )
    return svg_doc(inner, 1080, 1920)


def readme():
    spots = (
        (700, 120, 70),
        (1200, 90, 60),
        (690, 590, 60),
        (1210, 600, 70),
    )
    inner = (
        ground(1280, 640, P['cream'])
        + confetti(spots)
        + place(mark(), 80, 60, 170)
        + wordmark(80, 360, 112, ON_CREAM)
        + hook(80, 400, 38)
        + place(figure('idle'), 790, 80, 480)
    )
    return svg_doc(inner, 1280, 640)


def splash():
    spots = (
        (40, 160, 44),
        (320, 220, 40),
        (50, 700, 40),
        (320, 760, 46),
    )
    inner = (
        ground(390, 844, P['ground'])
        + confetti(spots)
        + place(figure('idle'), 45, 190, 300)
        + wordmark(195, 570, 52, ON_TEAL, 'middle')
        + slogan(195, 614, 22, 30, WHITE, 'middle')
    )
    return svg_doc(inner, 390, 844)


def lockup(dark):
    bg = P['cream']
    on = ON_CREAM
    if dark:
        bg = P['ground']
        on = ON_TEAL
    inner = (
        f'<rect width="{LOCKUP_W}" height="{LOCKUP_H}" rx="36" fill="{bg}"/>'
        + place(mark(), 40, 30, 180)
        + wordmark(240, 160, 110, on)
    )
    return svg_doc(inner, LOCKUP_W, LOCKUP_H)


def tokens():
    ink = P['ink']
    return {
        'color': {
            'teal': P['ground'],
            'sun': P['pad'],
            'tangerine': P['body'],
            'pink': P['accent'],
            'cap-blue': P['cap'],
            'cheek': P['cheek'],
            'ink': ink,
            'cream': P['cream'],
            'white': WHITE,
        },
        'font': {'display': 'Fredoka, sans-serif', 'display-weight': 600, 'ui': 'Figtree, sans-serif'},
        'type-scale-px': {'hero': 44, 'h1': 32, 'h2': 24, 'h3': 20, 'body': 17, 'small': 15, 'kid-min': 18},
        'radius-px': {'sm': 12, 'md': 20, 'lg': 28, 'pill': 999},
        'space-px': [4, 8, 12, 16, 24, 32, 48, 64],
        'shadow': {'sticker': f'5px 6px 0 {ink}', 'sticker-sm': f'3px 4px 0 {ink}'},
        'border': {'ink-line': f'3px solid {ink}'},
        'button': {'min-height-px': 56, 'radius-px': 22},
    }


def tokens_css(t):
    lines = [':root {']
    for k, v in t['color'].items():
        lines.append(f'  --color-{k}: {v};')
    lines.append(f"  --font-display: {t['font']['display']};")
    lines.append(f"  --font-display-weight: {t['font']['display-weight']};")
    lines.append(f"  --font-ui: {t['font']['ui']};")
    for k, v in t['type-scale-px'].items():
        lines.append(f'  --text-{k}: {v}px;')
    for k, v in t['radius-px'].items():
        lines.append(f'  --radius-{k}: {v}px;')
    for i, v in enumerate(t['space-px']):
        lines.append(f'  --space-{i + 1}: {v}px;')
    for k, v in t['shadow'].items():
        lines.append(f'  --shadow-{k}: {v};')
    lines.append(f"  --border-ink: {t['border']['ink-line']};")
    lines.append(f"  --button-min-height: {t['button']['min-height-px']}px;")
    lines.append(f"  --button-radius: {t['button']['radius-px']}px;")
    lines.append('}')
    return '\n'.join(lines) + '\n'


def write(rel, text):
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    return path


def main():
    files = [
        write('logo/padbot-mark.svg', svg_doc(mark(), 512, 512, ART_VIEW)),
        write('logo/padbot-mark-flat.svg', svg_doc(pb.padbot(C), 512, 512, ART_VIEW)),
        write('logo/padbot-mark-mono.svg', svg_doc(pb.padbot(MONO), 512, 512, ART_VIEW)),
        write('logo/lockup-light.svg', lockup(False)),
        write('logo/lockup-dark.svg', lockup(True)),
        write('banners/cover-1920x1080.svg', cover()),
        write('banners/vertical-1080x1920.svg', vertical()),
        write('banners/readme-1280x640.svg', readme()),
        write('banners/splash-390x844.svg', splash()),
    ]
    for pose in POSES:
        doc = svg_doc(figure(pose), 1024, 1024, ART_VIEW)
        files.append(write(f'mascot/padbot-{pose}.svg', doc))

    t = tokens()
    tokens_json = json.dumps(t, indent=2, ensure_ascii=False) + '\n'
    write('tokens/tokens.json', tokens_json)
    write('tokens/tokens.css', tokens_css(t))

    for f in files:
        print(f.relative_to(BB))


if __name__ == '__main__':
    main()
