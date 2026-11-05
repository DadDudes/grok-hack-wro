import re
import sys
from pathlib import Path

BB = Path(__file__).parent.parent
IMG = BB.parent / 'design' / 'web-book' / 'img'
REL = '../design/web-book/img/'
START = '<!--FLOW-START-->'
END = '<!--FLOW-END-->'

FLOW = [
    ('Parent', [('a02', 'Sign in'), ('p02', 'Set the goal'), ('p03', 'Prof plans 10 tasks')]),
    ('Kid', [('k01', 'What do you want to play?'), ('k03', 'Spark offers 3 games'), ('k04', 'The crew builds it'),
             ('k05', 'Play with Robo'), ('k06', 'Win')]),
    ('Parent', [('p04', 'Lens reports progress')]),
]
MASHUP = [
    ('k05', 'left: 0; top: 40px; width: 47%; transform: rotate(-3deg); z-index: 2'),
    ('k03', 'left: 30%; top: 0; width: 42%; transform: rotate(2deg); z-index: 3'),
    ('p04', 'right: 0; top: 30px; width: 40%; transform: rotate(3deg); z-index: 2'),
    ('k04', 'left: 6%; bottom: 0; width: 38%; transform: rotate(2deg); z-index: 4'),
    ('p02', 'left: 40%; bottom: 10px; width: 34%; transform: rotate(-2deg); z-index: 5'),
    ('k01', 'right: 2%; bottom: 0; width: 30%; transform: rotate(-4deg); z-index: 4'),
]
KEY = [
    ('k03', 'Spark offers three games', 'The kid picks one. The topic stays the parent\'s goal.'),
    ('k04', 'The crew builds the game', 'Each agent lights up in turn, Robo leads.'),
    ('k05', 'Play with Robo', 'The engine draws the game. Robo hints, never answers.'),
    ('p04', 'Lens reports progress', 'Before and after, weak skills, one next step.'),
]


def shot(screen_id):
    found = sorted(IMG.glob(f'{screen_id}*.png')) + sorted(IMG.glob(f'{screen_id.upper()}*.png'))
    if not found:
        return None
    return REL + found[0].name


def header(num, title, desc):
    return (f'  <header class="ph"><span class="lbl"><span>{num}</span>{title}</span>'
            f'<p class="dsc">{desc}</p></header>\n')


def mashup_page():
    tiles = ''
    for sid, style in MASHUP:
        src = shot(sid)
        if src:
            tiles += f'    <img class="mash" src="{src}" alt="Web screen {sid.upper()}" style="{style}">\n'
    return (
        '<section class="page">\n'
        + header('6.2', 'The web app', 'Kids build and play in the browser. Parents plan and read progress.')
        + f'  <div class="fr mashup" data-allow-overlap>\n{tiles}  </div>\n</section>\n'
    )


def flow_page():
    rows = ''
    step = 1
    for side, screens in FLOW:
        cells = ''
        for sid, label in screens:
            src = shot(sid)
            img = f'<img src="{src}" alt="{label}">' if src else '<div class="ph-box">Screen</div>'
            cells += f'<figure><span class="stp">{step}</span>{img}<figcaption>{label}</figcaption></figure>'
            step += 1
        rows += f'    <div class="frow"><span class="side">{side}</span><div class="fcells">{cells}</div></div>\n'
    return (
        '<section class="page">\n'
        + header('6.3', 'Flow', 'Parent sets the topic, the kid designs and plays, the parent sees the result.')
        + f'  <div class="fr plain flowmap">\n{rows}  </div>\n</section>\n'
    )


def key_pages():
    out = ''
    for i, (sid, title, desc) in enumerate(KEY):
        src = shot(sid)
        if not src:
            continue
        out += (
            '<section class="page">\n'
            + header(f'6.{4 + i}', title, desc)
            + f'  <div class="fr frame"><img src="{src}" alt="{title}"></div>\n</section>\n'
        )
    return out


def main():
    if not IMG.exists() or not list(IMG.glob('*.png')):
        sys.exit(f'no web shots yet in {IMG}')
    idx = BB / 'index.html'
    text = idx.read_text()
    block = START + '\n' + mashup_page() + flow_page() + key_pages() + END
    if START in text:
        text = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda m: block, text, flags=re.S)
    else:
        text = text.replace('<section class="page back nofoot"', block + '\n\n<section class="page back nofoot"', 1)
    text = text.replace('      <p class="body-l" style="color: var(--muted)">Still open: the app screens. They join the '
                        'book in 0.2 once they are approved.</p>\n', '')
    idx.write_text(text)
    print('flow pages written:', text.count('<section class="page'), 'pages in the book')


if __name__ == '__main__':
    main()
