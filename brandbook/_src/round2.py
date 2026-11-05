import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import board_kit as bk
import marks as m
import marks2 as m2

HERE = Path(__file__).parent
BB = HERE.parent
OUT = sys.argv[1] if len(sys.argv) > 1 else str(BB / 'directions-round2-fresh.html')
BRAND = bk.load_brand(BB)
FOOT = bk.footer_text(BRAND, 'round 2', 'fresh, colour, references')

COMPETITORS = json.loads((BB / 'research' / 'competitors.json').read_text())
PALETTES = json.loads((BB / 'research' / 'palettes-r2.json').read_text())
BY_GROUND = {q['neutral']: q for q in PALETTES}
LEAD = PALETTES[0]

DIRECTIONS = [
    dict(
        code='F', name='Grad pad', fn=m2.mark_gradpad, pill='Collision risk <b>High</b> as a motif, <b>Med</b> with the face',
        idea='Your reference, made ours: the controller has a face and the tassel of the cap is Robo\'s antenna.',
        blocks=[
            ('Why it can work', 'Game plus school in one look, readable for a 6 year old and a parent in one second. '
                                'Colour fills and a thick ink line feel fresh in a feed.'),
            ('Watch out', 'Pad plus mortarboard is a stock logo (dozens on Shutterstock, Iconfinder). The face, the '
                          'cheeks and the tassel-antenna are what make it ours, so they must stay.'),
            ('In the product', 'The cap flips off when a game starts and lands back when the parent panel opens. '
                               'Eyes become player 1 and player 2.'),
        ],
    ),
    dict(
        code='G', name='Smart Robo', fn=m2.mark_smartrobo, pill='Collision risk <b>Med</b>',
        idea='Robo from round 1 graduates: the mortarboard replaces the antenna, the tassel swings like a signal.',
        blocks=[
            ('Why it can work', 'One character everywhere, as your spec asks. The cap says learning without a book, '
                                'an owl or a lightbulb.'),
            ('Watch out', 'Without the cap it is a stock robot head. The coloured ear bolts and the mint screen face '
                          'carry recognition at 16 px.'),
            ('In the product', 'Same Robo as the mascot, so logo and teammate are one. The screen shows thinking '
                               'dots while the agents build.'),
        ],
    ),
    dict(
        code='H', name='Math pad', fn=m2.mark_mathpad, pill='Collision risk <b>Low</b>',
        idea='A controller whose buttons are the maths: plus on the D-pad, times, divide, minus and equals on the right.',
        blocks=[
            ('Why it can work', 'The learning is inside the game, which is exactly the product. Nobody in the scan '
                                'uses operator buttons.'),
            ('Watch out', 'Says maths, while goals can be spelling or English too. The symbols vanish below 32 px; '
                          'the pad and antenna still read.'),
            ('In the product', 'Buttons light up for the current task type. In the video each press pops a symbol.'),
        ],
    ),
    dict(
        code='K', name='Level badge', fn=m2.mark_badge, pill='Collision risk <b>Med</b>',
        idea='The gradient hexagon from your first reference becomes an achievement badge: every game is a level up.',
        blocks=[
            ('Why it can work', 'Kids know badges from games; parents read it as progress. The frame holds any '
                                'inner mark and works as a sticker and a video end card.'),
            ('Watch out', 'Gradient hexagons were a 2016 logo trend and the inner mark gets small. Use it as a '
                          'badge system next to a simpler logo, not as the only logo.'),
            ('In the product', 'Badges per skill on the parent panel ("Times tables, level 3"). Shareable card after '
                               'every game.'),
        ],
    ),
]

POSES = [
    ('idle', 'Idle', 'Default on every screen.', 'Hi! I am Robo, your teammate.'),
    ('think', 'Thinking', 'While the agents build the game.', 'Hmm... building your game!'),
    ('hint', 'Hint', 'Points at the next step. Never the answer.', 'Try counting by 7s!'),
    ('cheer', 'Cheering', 'Correct answer, sparkles.', 'Roar-some! Dino power!'),
]


def wordmark(brand_color, size_cls='f-brico'):
    return f'<span class="wm {size_cls}">EduBot<i style="color:{brand_color}">Games</i></span>'


def lockup(mark_inner, q, dark=False):
    cls = 'lkr dark' if dark else 'lkr'
    games = q['accent'] if dark else q['brand']
    return f'<div class="{cls}">{bk.svg(mark_inner, 48)}{wordmark(games)}</div>'


def icons(fn, q):
    c = m2.colors(q)
    tiles = ''
    for size in (64, 32, 16):
        tiles += bk.tile(fn(c), size, q['neutral'])
    tiles += '<span class="sep"></span>'
    for size in (64, 32, 16):
        tiles += bk.tile(fn(c), size, q['brand'])
    tiles += '<span class="sep"></span>'
    tiles += bk.tile(fn(m2.MONO2), 64, bk.PAPER)
    return f'<div class="iconcap">App icon · 64 / 32 / 16 · on cream, on brand · mono</div><div class="icons">{tiles}</div>'


def banners(fn, q):
    c = m2.colors(q)
    on_brand = bk.readable_on(q['brand'])
    robo = bk.svg(m2.sticker(lambda rc: m2.robo_cap(rc, 'cheer'), m2.robo2_colors(q)), 150)
    mark = bk.svg(m2.sticker(fn, c), 46)
    b169 = (
        f'<div class="bn b169" style="background:{q["brand"]};color:{on_brand}"><div class="bl">'
        f'<div class="bw">{mark}<span>EduBot<i style="color:{q["accent"]}">Games</i></span></div>'
        f'<div class="bt">Say a game.<br>Play it with Robo.</div>'
        f'<span class="chip" style="background:{q["accent"]};color:{q["ink"]}">Grok Bot Hackathon 2026</span>'
        f'</div>{robo}</div>'
    )
    b21 = (
        f'<div class="bn b21" style="background:{q["neutral"]};color:{q["ink"]}">'
        f'<div class="bw">{bk.svg(m2.sticker(fn, c), 58)}<span>EduBot<i style="color:{q["brand"]}">Games</i></span></div>'
        f'<div class="bt">AI that teaches, not cheats.</div></div>'
    )
    return f'<div class="bans">{b169}{b21}</div>'


def direction(d, q):
    fn = d['fn']
    c = m2.colors(q)
    hero = m2.shrink(m2.sticker(fn, c), .92)
    return bk.direction_page(
        f'Direction {d["code"]} · colour system · palette {q["id"]} {q["name"]}', d['code'], d['name'], d['pill'],
        hero, icons(fn, q), d['idea'], d['blocks'],
        [lockup(m2.sticker(fn, c), q), lockup(fn(c), q, dark=True)],
        banners(fn, q), 'Cover 1920 x 1080 · README 1280 x 640', FOOT, hero_caption='Mark · sticker',
    )


def style_page():
    q = LEAD
    c = m2.colors(q)
    rows = []
    for d in DIRECTIONS[:2]:
        fn = d['fn']
        rows.append((
            (d['code'], d['name'], 'four treatments'),
            [m2.shrink(fn(c), .9), m2.shrink(m2.sticker(fn, c), .9), m2.mark_badge(c, fn), m2.shrink(fn(m2.MONO2), .9)],
        ))
    return bk.grid_page(
        f'Style · palette {q["id"]} {q["name"]} · judge the treatment', 'Flat, sticker, <span>badge</span>, mono',
        [('Flat', 'Fill + 6 px ink line'), ('Sticker', 'Hard offset shadow'), ('Badge', 'Your reference frame'),
         ('Mono', 'Print, favicon, emboss')],
        rows, FOOT, label_w=150, cell_h=300, cell_size=228,
    )


def pose_page():
    q = LEAD
    r = m2.robo2_colors(q)
    bubble = bk.tint(q['brand'], .82)
    cells = ''
    for i, (pose, name, line, say) in enumerate(POSES):
        art = m2.sticker(lambda rc, p=pose: m2.robo_cap(rc, p), r, 2.5, 3.2)
        cells += (
            f'<div class="pose" style="background:{q["neutral"]}"><div class="hd"><b>0{i + 1}</b><span>{name}</span>'
            f'</div><div class="mk">{bk.svg(art, 290)}</div><p>{line}</p>'
            f'<div class="say" style="background:{bubble};color:{q["ink"]}">{say}</div></div>'
        )
    body = (
        f'<div class="kick">Robo with the cap · sticker style · palette {q["id"]} {q["name"]}</div>'
        '<h2 class="t">Robo <span>graduates</span></h2>'
        f'<div class="poses">{cells}</div>'
    )
    return bk.section('kp', body, FOOT)


def palette_card(q):
    c = m2.colors(q)
    hero = bk.svg(m2.sticker(m2.mark_gradpad, c), 104) + bk.svg(m2.sticker(m2.mark_smartrobo, c), 104)
    roles = [('Brand', q['brand']), ('Pad', q['pad']), ('Pop', q['pop']), ('Accent', q['accent']),
             ('Ink', q['ink']), ('Cream', q['neutral'])]
    sws = ''.join(
        f'<div class="sw" style="background:{h};color:{bk.readable_on(h)}"><span>{r}</span><span>{h}</span></div>'
        for r, h in roles
    )
    nk, nd = bk.nearest(q['brand'], COMPETITORS)
    stats = (
        f'brand on cream {bk.contrast(q["brand"], q["neutral"]):.2f}<br>'
        f'white on brand {bk.contrast("#FFFFFF", q["brand"]):.2f}<br>'
        f'ink on pad {bk.contrast(q["ink"], q["pad"]):.2f}<br>'
        f'nearest: {nk} dE {nd:.0f}'
    )
    return (
        f'<div class="wc"><div class="hero" style="background:{q["neutral"]}"><div style="display:flex;gap:10px">'
        f'{hero}</div><div class="city f-brico" style="color:{q["brand"]}">Let\'s play!</div></div>{sws}'
        f'<div class="meta"><b>{q["id"]} {q["name"]}</b><span>{q["note"]}</span><code>{stats}</code></div></div>'
    )


def palette_page():
    cols = ''.join(palette_card(q) for q in PALETTES)
    body = (
        '<div class="kick">Colour · full colour systems for filled, outlined marks</div>'
        '<h2 class="t">Four <span>fresh</span> palettes</h2>'
        f'<div class="wgrid" style="grid-template-columns:repeat({len(PALETTES)},1fr)">{cols}</div>'
    )
    return bk.section('pp', body, FOOT)


def matrix_render(fn, c):
    q = BY_GROUND[c['G']]
    return bk.svg(m2.sticker(fn, m2.colors(q)), 76)


def robo_mark(c):
    return m2.robo_cap(m2.robo2_colors(BY_GROUND[c['G']['__q']]) if False else c)


def cover():
    c = m2.colors(LEAD)
    cards = [bk.card(d['code'], 'logo', m2.shrink(m2.sticker(d['fn'], c), .9), d['name'],
                     d['idea'].split(':')[0].split('.')[0] + '.') for d in DIRECTIONS]
    robo = m2.sticker(lambda rc: m2.robo_cap(rc, 'cheer'), m2.robo2_colors(LEAD), 2.5, 3.2)
    cards.append(bk.card('R5', 'mascot', robo, 'Robo with cap', 'Round 1 Robo, graduated.'))
    for q in PALETTES[1:]:
        qc = m2.colors(q)
        cards.append(bk.card(q['id'], 'palette', m2.shrink(m2.sticker(m2.mark_gradpad, qc), .9), q['name'],
                             q['note'].split('.')[0] + '.', bg=q['neutral'], fg=q['ink']))
    notes = [
        ('From your references', [
            'Game plus learning in one sign: controller and mortarboard.',
            'Many colours, a thick dark outline, flat fills. Fresh, not corporate.',
            'You asked for freshness and style, so this round is in colour from the start.',
        ]),
        ('What I changed', [
            'Pad plus cap is a stock logo, so each mark adds something ours: a face, the tassel as antenna, maths '
            'buttons, a level badge.',
            'Sticker style (hard offset shadow) reads in a vertical video and on a README.',
            'Lockups in Bricolage Grotesque (T3) to test a fresher voice than Baloo.',
        ]),
        ('Pick', ['One logo F-H (K is a badge system), one palette Q1-Q4, sticker or flat. Round 1 marks still count.']),
    ]
    return bk.cover_page(
        'EduBotGames · brand exploration · round 2',
        'Play hard,<br>learn <em>smart</em>',
        'Four colour logo systems from your references, Robo with a cap in four poses, four fresh palettes and '
        'first banners for the cover and the README.',
        notes, cards, FOOT,
    )


def robo_matrix(c):
    return c


pages = [cover()]
pages += [direction(d, LEAD if i != 3 else PALETTES[3]) for i, d in enumerate(DIRECTIONS)]
pages.append(style_page())
pages.append(pose_page())
pages.append(palette_page())
matrix_marks = [(d['code'], d['name'], d['fn']) for d in DIRECTIONS]
matrix_marks.append(('R5', 'Robo', lambda rc: m2.robo_cap(rc, 'idle')))


def render_cell(fn, c):
    q = BY_GROUND[c['G']]
    if fn is matrix_marks[-1][2]:
        return bk.svg(m2.sticker(fn, m2.robo2_colors(q), 2.5, 3.2), 80)
    return bk.svg(m2.shrink(m2.sticker(fn, m2.colors(q)), .9), 80)


pages.append(bk.matrix_page(
    'Every mark · every palette · sticker', 'Four marks and Robo, <span>four palettes</span>',
    matrix_marks, PALETTES, FOOT, render=render_cell, cell_h=110,
))

Path(OUT).write_text(bk.document('EduBotGames Round 2', pages))
print('wrote', OUT)
