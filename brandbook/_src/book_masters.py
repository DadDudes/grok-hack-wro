import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import agents as ag
import marks2 as m2
import padbot as pb

BB = Path(__file__).parent.parent
LOGO = BB / 'img' / 'logo'
P = {p['id']: p for p in json.loads((BB / 'research' / 'palettes-r3.json').read_text())}['C4']
C = ag.agent_colors(P, 'robo')
TEAL = P['ground']
SUN = P['pad']
INK = P['ink']
WHITE = '#FFFFFF'
BLACK = '#000000'
SPLIT = 6
MARK_GAP = 134
WM_HEIGHT = 60

src = (LOGO / 'wordmark.svg').read_text() if (LOGO / 'wordmark.svg').exists() else ''
VIEW = re.search(r'viewBox="([^"]+)"', src).group(1)
VX, VY, VW, VH = (float(v) for v in VIEW.split())
PATHS = re.findall(r'<path [^>]*d="([^"]+)"', src)


def wordmark_paths(main, accent):
    out = ''
    for i, d in enumerate(PATHS):
        fill = main if i < SPLIT else accent
        out += f'<path d="{d}" fill="{fill}"/>'
    return out


def svg(view, inner, w, h):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" width="{w}" height="{h}">{inner}</svg>\n'


def mark_color():
    return m2.sticker(pb.padbot, C)


def mask_colors():
    return dict(K=WHITE, F1=BLACK, F2=BLACK, F3=BLACK, F4=BLACK, F5=BLACK, W=BLACK)


def mark_one(color, mid):
    mask = f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">' \
           f'<rect width="120" height="120" fill="{BLACK}"/>{pb.padbot(mask_colors())}</mask>'
    return f'<defs>{mask}</defs><rect width="120" height="120" fill="{color}" mask="url(#{mid})"/>'


def tile(inner, ground, rx):
    return (
        f'<rect width="120" height="120" rx="{rx}" fill="{ground}"/>'
        f'<g transform="translate(60 61) scale(.8) translate(-61 -62)">{inner}</g>'
    )


def lockup(mark_inner, main, accent):
    s = WM_HEIGHT / VH
    width = MARK_GAP + VW * s + 6
    words = (f'<g transform="translate({MARK_GAP} {62 - WM_HEIGHT / 2:.1f}) scale({s:.5f}) '
             f'translate({-VX} {-VY})">{wordmark_paths(main, accent)}</g>')
    return f'0 0 {width:.1f} 124', mark_inner + words, round(width * 2), 248


def write(name, text):
    (LOGO / f'{name}.svg').write_text(text)


def main():
    wm_view = VIEW
    write('wordmark', svg(wm_view, wordmark_paths(INK, TEAL), round(VW), round(VH)))
    write('wordmark-on-dark', svg(wm_view, wordmark_paths(WHITE, SUN), round(VW), round(VH)))
    write('wordmark-ink', svg(wm_view, wordmark_paths(INK, INK), round(VW), round(VH)))
    write('wordmark-white', svg(wm_view, wordmark_paths(WHITE, WHITE), round(VW), round(VH)))
    write('symbol', svg('0 0 120 120', tile(mark_color(), TEAL, 27), 512, 512))
    write('symbol-square', svg('0 0 120 120', tile(mark_color(), TEAL, 0), 1024, 1024))
    write('symbol-mark', svg('0 0 120 120', mark_color(), 512, 512))
    write('symbol-black', svg('0 0 120 120', mark_one(INK, 'mk'), 512, 512))
    write('symbol-white', svg('0 0 120 120', mark_one(WHITE, 'mw'), 512, 512))
    for name, mark_inner, main_c, accent_c in (
        ('logo', mark_color(), INK, TEAL),
        ('logo-on-dark', mark_color(), WHITE, SUN),
        ('logo-black', mark_one(INK, 'lb'), INK, INK),
        ('logo-white', mark_one(WHITE, 'lw'), WHITE, WHITE),
    ):
        view, inner, w, h = lockup(mark_inner, main_c, accent_c)
        write(name, svg(view, inner, w, h))
    wm_main = ''.join(f'<path d="{d}"/>' for d in PATHS[:SPLIT])
    wm_acc = ''.join(f'<path d="{d}" style="fill: var(--wm-accent, var(--brand))"/>' for d in PATHS[SPLIT:])
    wm_one = ''.join(f'<path d="{d}"/>' for d in PATHS)
    symbols = (
        f'<symbol id="mark" viewBox="0 0 120 120">{tile(mark_color(), TEAL, 27)}</symbol>\n'
        f'    <symbol id="padbot" viewBox="0 0 120 120">{mark_color()}</symbol>\n'
        f'    <symbol id="wm" viewBox="{wm_view}"><g style="fill: currentColor">{wm_main}</g>{wm_acc}</symbol>\n'
        f'    <symbol id="wm1" viewBox="{wm_view}"><g style="fill: currentColor">{wm_one}</g></symbol>'
    )
    (BB / '_src' / 'book_symbols.html').write_text(symbols + '\n')
    print('masters written, aspect of wordmark', round(VW / VH, 3))


if __name__ == '__main__':
    main()
