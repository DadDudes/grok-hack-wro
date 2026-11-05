import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import board_kit as bk
import marks as m

HERE = Path(__file__).parent
BB = HERE.parent
OUT = sys.argv[1] if len(sys.argv) > 1 else str(BB / 'directions-round1-directions.html')
BRAND = bk.load_brand(BB)
WM = 'EduBot<i>Games</i>'
FOOT = bk.footer_text(BRAND, 'round 1', 'logo, mascot, colour, type')

COMPETITORS = json.loads((BB / 'research' / 'competitors.json').read_text())
PALETTES = json.loads((BB / 'research' / 'palettes-r1.json').read_text())
PAL_BY_GROUND = {bk.palette_colors(p)['G']: p for p in PALETTES}
LEAD = PALETTES[1]

BRAND_TILE = dict(bk.MONO, G='#52707F', L=bk.PAPER, D='#52707F')

DIRECTIONS = [
    dict(
        code='A', name='Robo face', fn=m.mark_robo, pill='Collision risk <b>High</b>',
        idea='The logo is Robo. One face from the app icon to the hint bubble to the last frame of the video.',
        blocks=[
            ('Why it can work', 'Your spec wants Robo on every screen so the video reads as one story. Logo and '
                                'mascot merge, nothing extra to learn.'),
            ('Watch out', 'Robot heads are stock icons (Material smart_toy, many AI assistants). It stays ours only '
                          'through the ear bolts, the screen face and the colour.'),
            ('In the product', 'The screen face swaps expressions: thinking dots while agents build, happy eyes on a '
                               'correct answer. The icon itself can animate.'),
        ],
    ),
    dict(
        code='B', name='Pad bot', fn=m.mark_pad, pill='Collision risk <b>Med</b>',
        idea='A game controller with a face. Game and bot in one shape; the antenna turns a controller into a teammate.',
        blocks=[
            ('Why it can work', 'Games are the hook for kids 6-12. A controller reads at 32 px and is not an owl, '
                                'a book or a lightbulb like most edu marks.'),
            ('Watch out', 'Controller icons are everywhere in gaming. Some parents may read it as gaming first, '
                          'learning second.'),
            ('In the product', 'Eyes are the thumbsticks. On the game screen the two eyes become the two players and '
                               'the antenna ball is Robo.'),
        ],
    ),
    dict(
        code='C', name='Say and play', fn=m.mark_say, pill='Collision risk <b>Med</b>',
        idea='A speech bubble with an antenna and a play button. The product in one sign: you say it, a bot builds '
             'it, you play it.',
        blocks=[
            ('Why it can work', 'Voice is the step nobody else has: the kid designs the game by talking. The play '
                                'triangle works even for kids who cannot read yet.'),
            ('Watch out', 'Bubble plus play also reads as video chat or podcasts. No face, so Robo has to carry the '
                          'warmth on his own.'),
            ('In the product', 'The bubble is the mic button on screen 2. The triangle turns into a mic while the kid '
                               'speaks and back into play when the game is ready.'),
        ],
    ),
    dict(
        code='D', name='Pixel bot', fn=m.mark_pixel, pill='Collision risk <b>Med</b>',
        idea='Robo drawn as an 8-bit sprite. It says "this is a game" with no extra symbol and stays sharp at 16 px.',
        blocks=[
            ('Why it can work', 'Pixels are the language of the games kids already build (Minecraft, Roblox). Frame '
                                'animation in Phaser is cheap.'),
            ('Watch out', 'Retro pixel art is popular with indie games. Feels nostalgic to parents more than fresh '
                          'to kids.'),
            ('In the product', 'The same pixel grid makes loading bars, the team score, sprites in the templates and '
                               'transitions in the video.'),
        ],
    ),
    dict(
        code='E', name='Cartridge bot', fn=m.mark_cart, pill='Collision risk <b>Low</b>',
        idea='A game cartridge with Robo on the label. Every kid\'s idea becomes their own cartridge.',
        blocks=[
            ('Why it can work', 'The cartridge is the product: a game made just for you. No edu competitor owns this '
                                'shape.'),
            ('Watch out', 'Most detailed of the five: the ridges vanish at 16 px. Kids know Switch cards more than '
                          'big cartridges.'),
            ('In the product', 'The game library is a shelf of cartridges with the kid\'s titles ("Dinos in Space"). '
                               'Strong for the share card.'),
        ],
    ),
]

MASCOTS = [
    dict(code='R1', name='Screen Robo', fn=m.robo_screen, short='Round head, screen face, one antenna.',
         takes='Straight from your design brief. Pairs with A, works with every direction.',
         read='Most expressive: the screen shows any face, loading dots or a star. Easy to pose.'),
    dict(code='R2', name='Pad Robo', fn=m.robo_pad, short='The head is a game controller.',
         takes='The body of direction B. Says "game" before anything else.',
         read='Fewer expressions: the eyes are fixed buttons, so poses rely on arms.'),
    dict(code='R3', name='Pixel Robo', fn=m.robo_pixel, short='An 8-bit sprite.',
         takes='The grid of direction D. Native inside Phaser.',
         read='Cheap to animate frame by frame. Less cuddly for a 6 year old.'),
    dict(code='R4', name='Bubble Robo', fn=m.robo_bubble, short='A floating speech bubble with a face.',
         takes='The bubble of direction C. Floats next to hints.',
         read='No legs, so he hovers. Feels like a voice more than a toy.'),
]

POSES = [
    ('idle', 'Idle', 'Default on every screen. Calm eyes, arms down.', 'Hi! I am Robo, your teammate.'),
    ('think', 'Thinking', 'While the agents build. Eyes up, hand on chin, thought dots.', 'Hmm... building your game!'),
    ('hint', 'Hint', 'Points at the next step, bulb on. Never the answer.', 'Try counting by 7s!'),
    ('cheer', 'Cheering', 'Correct answer. Happy eyes, arms up, sparkles.', 'Roar-some! Dino power!'),
]

TYPES = [
    dict(code='T1', name='Baloo 2 + Inter', cls='f-baloo', ui='f-inter', fonts='Display Baloo 2 800 · UI Inter',
         read='Your brief. Round and friendly, but Baloo is everywhere in kids apps. Inter is the safe parent voice.'),
    dict(code='T2', name='Fredoka + Figtree', cls='f-fredoka', ui='f-figtree', fonts='Display Fredoka 600 · UI Figtree',
         read='Softer and more geometric, very easy for early readers. Also common in kids products.'),
    dict(code='T3', name='Bricolage + Figtree', cls='f-brico', ui='f-figtree',
         fonts='Display Bricolage Grotesque 800 · UI Figtree',
         read='Most distinctive: a quirky grotesque that looks made, not templated. Less babyish, good for 10-12 and '
              'parents.'),
]


def robo_for_ground(fn):
    def render(c):
        p = PAL_BY_GROUND.get(c['G'])
        if p is None:
            return fn(m.ROBO_MONO)
        return fn(m.robo_colors(p))
    return render


def phone(mark_fn):
    mic = bk.svg(m.mic_glyph(bk.PAPER), 64)
    robo = bk.svg(m.robo_screen(m.ROBO_MONO, 'think'), 72)
    chips = (
        '<span class="ok">Pedagogue</span><span class="on">Designer</span>'
        '<span>Artist</span><span>Ready</span>'
    )
    return (
        f'<div class="phx"><div class="phx-bar">{bk.svg(mark_fn(bk.MONO), 26)}<span class="pwm">{WM}</span></div>'
        f'<div class="phx-q">What do you<br>want to play?</div><div class="phx-mic">{mic}</div>'
        f'<div class="phx-in">or type: dinosaurs in space</div><div class="phx-tl">{chips}</div>'
        f'<div class="phx-robo">{robo}<span class="bub">10 tasks ready. Designer is building your world!</span></div>'
        f'</div>'
    )


def direction(d):
    fn = d['fn']
    return bk.direction_page(
        f'Direction {d["code"]} · logo system · one colour', d['code'], d['name'], d['pill'], fn(bk.MONO),
        bk.icon_row(fn, [bk.MONO, BRAND_TILE, bk.MONO_DARK]),
        d['idea'], d['blocks'],
        [bk.lockup(fn(bk.MONO), WM), bk.lockup(fn(bk.MONO_DARK), WM, dark=True)],
        phone(fn), 'S2 Kid prompt · 390 x 844', FOOT,
    )


def mascot_card(r):
    big = bk.svg(r['fn'](m.ROBO_MONO), 250)
    dark = bk.tile(r['fn'](m.ROBO_MONO_DARK), 64, bk.INK)
    small = bk.svg(r['fn'](m.ROBO_MONO), 64) + bk.svg(r['fn'](m.ROBO_MONO), 40)
    return (
        f'<div class="rc"><div class="hd"><b>{r["code"]}</b><span>{r["name"]}</span></div>'
        f'<div class="sh">{r["short"]}</div><div class="mk">{big}</div>'
        f'<div class="ln"><i>Where it comes from</i>{r["takes"]}</div>'
        f'<div class="ln"><i>Read</i>{r["read"]}</div><div class="ic">{small}{dark}</div></div>'
    )


def mascot_page():
    cards = ''.join(mascot_card(r) for r in MASCOTS)
    body = (
        '<div class="kick">Mascot · Robo, the AI teammate · one colour</div>'
        '<h2 class="t">Four Robos, <span>one teammate</span></h2>'
        f'<div class="rgrid">{cards}</div>'
    )
    return bk.section('kp', body, FOOT)


def pose_page():
    r = m.robo_colors(LEAD)
    ground = LEAD['neutral']
    bubble = bk.tint(LEAD['brand'], .82)
    cells = ''
    for i, (pose, name, line, say) in enumerate(POSES):
        cells += (
            f'<div class="pose" style="background:{ground}"><div class="hd"><b>0{i + 1}</b><span>{name}</span></div>'
            f'<div class="mk">{bk.svg(m.robo_screen(r, pose), 290)}</div><p>{line}</p>'
            f'<div class="say" style="background:{bubble};color:{LEAD["ink"]}">{say}</div></div>'
        )
    body = (
        f'<div class="kick">Robo R1 · four poses from the brief · in palette {LEAD["id"]} {LEAD["name"]}</div>'
        '<h2 class="t">Robo in <span>four poses</span></h2>'
        f'<div class="poses">{cells}</div>'
    )
    return bk.section('kp', body, FOOT)


def type_card(t):
    return (
        f'<div class="tp"><div class="hd"><b>{t["code"]}</b><span>{t["name"]}</span></div>'
        f'<div class="fn">{t["fonts"]}</div>'
        f'<div class="wmk {t["cls"]}">EduBotGames</div>'
        f'<div class="hq {t["cls"]}">What do you want to play?</div>'
        f'<div class="btn {t["cls"]}">Create game</div>'
        f'<div class="stat {t["ui"]}">40% → 75%</div>'
        f'<div class="body {t["ui"]}">Maja got 6 of 10 right last week and 9 of 10 today. Practise 7x and 8x '
        f'next.</div>'
        f'<div class="rd">{t["read"]}</div></div>'
    )


def type_page():
    cards = ''.join(type_card(t) for t in TYPES)
    body = (
        '<div class="kick">Typography · display for kids, UI for parents</div>'
        '<h2 class="t">Three <span>type pairs</span></h2>'
        f'<div class="tgrid">{cards}</div>'
    )
    return bk.section('kp', body, FOOT)


def palette_demo(c):
    p = PAL_BY_GROUND[c['G']]
    robo = bk.svg(m.robo_screen(m.robo_colors(p), 'cheer'), 104)
    return f'<div style="display:flex;gap:8px">{bk.svg(m.mark_robo(c), 92)}{robo}</div>'


def cover():
    cards = [bk.card(d['code'], 'logo', d['fn'](bk.MONO), d['name'], d['idea'].split('.')[0] + '.')
             for d in DIRECTIONS]
    cards.append(bk.card('R1', 'mascot', m.robo_screen(m.ROBO_MONO, 'cheer'), 'Robo', 'Four styles, four poses.'))
    for p in (PALETTES[1], PALETTES[2]):
        c = bk.palette_colors(p)
        cards.append(bk.card(p['id'], 'palette', m.robo_screen(m.robo_colors(p), 'idle'), p['name'],
                             p['note'], bg=c['G'], fg=p['ink']))
    notes = [
        ('From your spec', [
            'Kids 6-12 design a learning game by voice, agents build it, Robo plays along. Parents see progress.',
            'Playful and bright for kids, clean enough that parents trust it. No ads look.',
            'Every screen reads in 2 seconds in a 30-45 s vertical video. Robo on every screen.',
        ]),
        ('Research in short', [
            'Violet and blue are the category default: Kahoot, Quizlet, SplashLearn, Scratch, Lingokids.',
            'Brief purple #6C4DF6 is dE 9 from Quizlet blue. Teal and berry are open (dE 50+).',
            'Robot heads are stock icons, so the mark needs a game or voice twist.',
        ]),
        ('Pick one of each', ['Logo A-E, Robo R1-R4, palette P1-P4, type T1-T3. Hybrids welcome ("A with R3").']),
    ]
    return bk.cover_page(
        'EduBotGames · brand exploration · round 1',
        'Robo, games<br>and a <em>voice</em>',
        'Five logo systems, four Robos, five palettes, three type pairs. The pick becomes repo assets, the README '
        'style section, the portal tokens and the promo video kit.',
        notes, cards, FOOT,
    )


pages = [cover()]
pages += [direction(d) for d in DIRECTIONS]
pages.append(mascot_page())
pages.append(pose_page())
pages.append(bk.palette_page(
    'Colour · brief first, then open territory', 'Brief palette and <span>four answers</span>',
    PALETTES, palette_demo, COMPETITORS, FOOT,
))
pages.append(type_page())
matrix_marks = [(d['code'], d['name'], d['fn']) for d in DIRECTIONS]
matrix_marks.append(('R1', 'Robo', robo_for_ground(m.robo_screen)))
pages.append(bk.matrix_page(
    'Every mark · every palette', 'Five marks and Robo, <span>five palettes</span>',
    matrix_marks, PALETTES, FOOT, cell_h=96, size=78,
))

Path(OUT).write_text(bk.document('EduBotGames Round 1', pages))
print('wrote', OUT)
