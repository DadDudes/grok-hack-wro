import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import board_kit as bk
import marks2 as m2
import padbot as pb

HERE = Path(__file__).parent
BB = HERE.parent
OUT = sys.argv[1] if len(sys.argv) > 1 else str(BB / 'directions-round3-colour.html')
BRAND = bk.load_brand(BB)
FOOT = bk.footer_text(BRAND, 'round 3', 'colour for PadBot')
COMPETITORS = json.loads((BB / 'research' / 'competitors.json').read_text())
ALL = {p['id']: p for p in json.loads((BB / 'research' / 'palettes-r3.json').read_text())}
SHOWN = ('C1', 'C4', 'C5')
CURRENT_VIOLET = '#7B3FF2'


def colors(p):
    return dict(K=p['ink'], F1=p['pad'], F2=p['cap'], F3=p['body'], F4=p['accent'], F5=p['cheek'], W='#FFFFFF')


def mark_svg(p, size):
    return bk.svg(m2.sticker(pb.padbot, colors(p)), size)


def mascot_svg(p, pose, size):
    art = m2.sticker(lambda rc: pb.mascot(rc, pose), colors(p), 1.4, 1.8)
    return bk.svg(art, size)


def wordmark(p, cls='wm3'):
    return f'<span class="{cls}" style="color:{p["wm"]}">EduBot<i style="color:{p["games"]}">Games</i></span>'


def swatches(p):
    roles = (('ground', 'Ground'), ('pad', 'Pad'), ('body', 'Body'), ('accent', 'Accent'),
             ('cap', 'Cap'), ('cheek', 'Cheek'), ('ink', 'Ink'), ('cream', 'Cream'))
    items = ''.join(
        f'<span><i style="background:{p[k]}"></i>{label} {p[k]}</span>' for k, label in roles
    )
    return f'<div class="sws">{items}</div>'


def stats(p):
    text_on_ground = bk.contrast(p['wm'], p['ground'])
    ink_on_pad = bk.contrast(p['ink'], p['pad'])
    nk, nd = bk.nearest(p['ground'], COMPETITORS)
    away = bk.de76(p['ground'], CURRENT_VIOLET)
    return (
        f'<code>wordmark on ground {text_on_ground:.2f}<br>ink on pad {ink_on_pad:.2f}<br>'
        f'nearest: {nk} dE {nd:.0f}<br>vs violet Q1 dE {away:.0f}</code>'
    )


def icons(p):
    tiles = (
        bk.tile(m2.sticker(pb.padbot, colors(p)), 56, p['ground'])
        + bk.tile(m2.sticker(pb.padbot, colors(p)), 32, p['ground'])
        + bk.tile(m2.sticker(pb.padbot, colors(p)), 56, p['cream'])
    )
    return f'<div class="ics">{tiles}</div>'


def splash(p):
    btn_text = bk.readable_on(p['accent'])
    return (
        f'<div class="ph3" style="background:{p["ground"]}">{mascot_svg(p, "idle", 128)}'
        f'{wordmark(p)}<span class="tg3" style="color:{p["wm"]}">Say a game.<br>Play it with Robo.</span>'
        f'<span class="bt3" style="background:{p["accent"]};color:{btn_text}">Let\'s play!</span></div>'
    )


def card(p):
    chip_bg = p['cream']
    hero = (
        f'<div class="gr" style="background:{p["ground"]}">'
        f'<span class="id3" style="background:{chip_bg};color:{p["ink"]}">{p["id"]}</span>'
        f'{mark_svg(p, 170)}{mascot_svg(p, "cheer", 200)}{wordmark(p)}</div>'
    )
    right = (
        f'<div class="rt"><b>{p["name"]}</b><div class="md">{p["mood"]}</div>{icons(p)}{swatches(p)}'
        f'{stats(p)}</div>'
    )
    return f'<div class="r3c">{hero}<div class="lo">{splash(p)}{right}</div></div>'


cards = ''.join(card(ALL[k]) for k in SHOWN)
body = (
    '<div class="kick">Round 3 · same PadBot, sticker style, Fredoka · only colour changes</div>'
    '<h2 class="t">Three colour <span>directions</span></h2>'
    f'<div class="r3">{cards}</div>'
)
pages = [bk.section('kp', body, FOOT)]
Path(OUT).write_text(bk.document('EduBotGames Round 3 Colour', pages))
print('wrote', OUT)
