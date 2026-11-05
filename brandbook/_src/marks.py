import board_kit as bk

ROBO_MONO = dict(O=bk.INK, B=bk.PAPER, S=bk.INK, E=bk.PAPER, A=bk.ACCENT, P=bk.SAND, M=bk.PAPER)
ROBO_MONO_DARK = dict(O=bk.PAPER, B='#3A454E', S=bk.PAPER, E=bk.INK, A=bk.ACCENT, P='#56626C', M=bk.INK)


def robo_colors(p):
    return dict(O=p['ink'], B='#FFFFFF', S=p['ink'], E=p['mint'], A=p['accent'], P=p['brand'], M=p['mint'])


def mark_robo(c):
    L, A, G, D = c['L'], c['A'], c['G'], c['D']
    return (
        f'<line x1="60" y1="32" x2="60" y2="16" stroke="{L}" stroke-width="6" stroke-linecap="round"/>'
        f'<rect x="5" y="58" width="12" height="24" rx="5" fill="{L}"/>'
        f'<rect x="103" y="58" width="12" height="24" rx="5" fill="{L}"/>'
        f'<rect x="15" y="32" width="90" height="78" rx="32" fill="{G}" stroke="{L}" stroke-width="6"/>'
        f'<rect x="28" y="46" width="64" height="50" rx="18" fill="{L}"/>'
        f'<ellipse cx="47" cy="67" rx="7" ry="10" fill="{G}"/>'
        f'<ellipse cx="73" cy="67" rx="7" ry="10" fill="{G}"/>'
        f'<path d="M52 84 Q60 90 68 84" fill="none" stroke="{G}" stroke-width="4.5" stroke-linecap="round"/>'
        f'<circle cx="60" cy="12" r="8" fill="{A}" stroke="{D}" stroke-width="5"/>'
    )


PAD_PATH = (
    'M30 42 H90 C104 42 111 52 112 66 L114 88 C115 100 103 106 95 98 L86 89 H34 L25 98 '
    'C17 106 5 100 6 88 L8 66 C9 52 16 42 30 42 Z'
)


def mark_pad(c):
    L, A, G, D = c['L'], c['A'], c['G'], c['D']
    return (
        f'<line x1="60" y1="42" x2="60" y2="22" stroke="{L}" stroke-width="6" stroke-linecap="round"/>'
        f'<path d="{PAD_PATH}" fill="{G}" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>'
        f'<circle cx="37" cy="64" r="11" fill="{L}"/>'
        f'<circle cx="83" cy="64" r="11" fill="{L}"/>'
        f'<circle cx="40.5" cy="60.5" r="3.6" fill="{G}"/>'
        f'<circle cx="86.5" cy="60.5" r="3.6" fill="{G}"/>'
        f'<path d="M51 75 Q60 82 69 75" fill="none" stroke="{L}" stroke-width="4.5" stroke-linecap="round"/>'
        f'<circle cx="60" cy="17" r="8" fill="{A}" stroke="{D}" stroke-width="5"/>'
    )


BUBBLE_PATH = (
    'M36 28 H84 C97.3 28 108 38.7 108 52 V72 C108 85.3 97.3 96 84 96 H52 L28 112 L32 95.4 '
    'C20.6 93.6 12 83.8 12 72 V52 C12 38.7 22.7 28 36 28 Z'
)


def mark_say(c):
    L, A, G, D = c['L'], c['A'], c['G'], c['D']
    return (
        f'<line x1="60" y1="28" x2="60" y2="16" stroke="{L}" stroke-width="6" stroke-linecap="round"/>'
        f'<path d="{BUBBLE_PATH}" fill="{G}" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>'
        f'<path d="M50 47 L76 62 L50 77 Z" fill="{L}" stroke="{L}" stroke-width="7" stroke-linejoin="round"/>'
        f'<circle cx="60" cy="12" r="8" fill="{A}" stroke="{D}" stroke-width="5"/>'
    )


PIXEL_ROWS = (
    '....aa....',
    '....11....',
    '.11111111.',
    '1gggggggg1',
    '1g111111g1',
    '1g1e11e1g1',
    '1g1e11e1g1',
    '1g111111g1',
    '1g11ee11g1',
    '1g111111g1',
    '1gggggggg1',
    '.11111111.',
)
PIXEL = 9.5
PIXEL_X = 12.5
PIXEL_Y = 3


def pixel_grid(rows, colors, cell, x0, y0):
    out = ''
    for r, row in enumerate(rows):
        for col, ch in enumerate(row):
            if ch == '.':
                continue
            x = x0 + col * cell
            y = y0 + r * cell
            out += f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" fill="{colors[ch]}"/>'
    return out


def mark_pixel(c):
    colors = {'1': c['L'], 'a': c['A'], 'e': c['G'], 'g': c['G']}
    return pixel_grid(PIXEL_ROWS, colors, PIXEL, PIXEL_X, PIXEL_Y)


CART_PATH = 'M30 24 H84 L98 38 V104 Q98 112 90 112 H30 Q22 112 22 104 V32 Q22 24 30 24 Z'


def mark_cart(c):
    L, A, G, D = c['L'], c['A'], c['G'], c['D']
    ridges = ''.join(
        f'<line x1="{x}" y1="92" x2="{x}" y2="102" stroke="{L}" stroke-width="5" stroke-linecap="round"/>'
        for x in (40, 53, 66, 79)
    )
    return (
        f'<line x1="44" y1="24" x2="44" y2="15" stroke="{L}" stroke-width="6" stroke-linecap="round"/>'
        f'<path d="{CART_PATH}" fill="{G}" stroke="{L}" stroke-width="6" stroke-linejoin="round"/>'
        f'<rect x="32" y="38" width="54" height="44" rx="11" fill="{L}"/>'
        f'<ellipse cx="50" cy="56" rx="5.5" ry="8" fill="{G}"/>'
        f'<ellipse cx="68" cy="56" rx="5.5" ry="8" fill="{G}"/>'
        f'<path d="M53 69 Q59 74 65 69" fill="none" stroke="{G}" stroke-width="4" stroke-linecap="round"/>'
        + ridges
        + f'<circle cx="44" cy="10" r="7" fill="{A}" stroke="{D}" stroke-width="5"/>'
    )


def robo_eyes(r, pose):
    S, E = r['S'], r['E']
    if pose == 'cheer':
        return (
            f'<path d="M45 47 Q50 40 55 47" fill="none" stroke="{E}" stroke-width="3.6" stroke-linecap="round"/>'
            f'<path d="M65 47 Q70 40 75 47" fill="none" stroke="{E}" stroke-width="3.6" stroke-linecap="round"/>'
            f'<path d="M53 52 Q60 60 67 52 Z" fill="{E}" stroke="{E}" stroke-width="2" stroke-linejoin="round"/>'
        )
    dx, dy = 0, 0
    if pose == 'think':
        dx, dy = 2.5, -3
    if pose == 'hint':
        dx, dy = 3, 0
    mouth = f'<path d="M55 54 Q60 58 65 54" fill="none" stroke="{E}" stroke-width="3" stroke-linecap="round"/>'
    if pose == 'think':
        mouth = f'<path d="M56 55 H64" fill="none" stroke="{E}" stroke-width="3" stroke-linecap="round"/>'
    return (
        f'<ellipse cx="{50 + dx}" cy="{45 + dy}" rx="4.6" ry="6.4" fill="{E}"/>'
        f'<ellipse cx="{70 + dx}" cy="{45 + dy}" rx="4.6" ry="6.4" fill="{E}"/>'
        + mouth
    )


def robo_arms(r, pose):
    O, B = r['O'], r['B']
    arm = f'fill="none" stroke="{O}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'
    hand = f'fill="{B}" stroke="{O}" stroke-width="4"'
    if pose == 'think':
        return (
            f'<path d="M41 78 Q30 86 34 98" {arm}/><circle cx="34" cy="99" r="4.5" {hand}/>'
            f'<path d="M79 78 Q92 80 84 70" {arm}/><circle cx="83" cy="69" r="4.5" {hand}/>'
        )
    if pose == 'hint':
        return (
            f'<path d="M41 78 Q30 86 34 98" {arm}/><circle cx="34" cy="99" r="4.5" {hand}/>'
            f'<path d="M79 78 L98 64" {arm}/><circle cx="100" cy="62" r="4.5" {hand}/>'
            f'<path d="M103 59 L110 53" {arm}/>'
        )
    if pose == 'cheer':
        return (
            f'<path d="M41 78 L24 62" {arm}/><circle cx="22" cy="60" r="4.5" {hand}/>'
            f'<path d="M79 78 L96 62" {arm}/><circle cx="98" cy="60" r="4.5" {hand}/>'
        )
    return (
        f'<path d="M41 78 Q30 86 34 98" {arm}/><circle cx="34" cy="99" r="4.5" {hand}/>'
        f'<path d="M79 78 Q90 86 86 98" {arm}/><circle cx="86" cy="99" r="4.5" {hand}/>'
    )


def robo_extra(r, pose):
    O, A = r['O'], r['A']
    if pose == 'think':
        return (
            f'<circle cx="96" cy="30" r="3" fill="{O}"/>'
            f'<circle cx="104" cy="22" r="4" fill="{O}"/>'
            f'<circle cx="112" cy="12" r="5" fill="{O}"/>'
        )
    if pose == 'hint':
        return (
            f'<circle cx="108" cy="36" r="7" fill="{A}" stroke="{O}" stroke-width="3.5"/>'
            f'<path d="M105 45 H111" stroke="{O}" stroke-width="3.5" stroke-linecap="round"/>'
        )
    if pose == 'cheer':
        return (
            f'<path d="M14 40 L17 47 L24 50 L17 53 L14 60 L11 53 L4 50 L11 47 Z" fill="{A}"/>'
            f'<path d="M106 34 L108.5 39.5 L114 42 L108.5 44.5 L106 50 L103.5 44.5 L98 42 L103.5 39.5 Z" fill="{A}"/>'
        )
    return ''


def robo_screen(r, pose='idle'):
    O, B, S, A, P = r['O'], r['B'], r['S'], r['A'], r['P']
    return (
        f'<ellipse cx="60" cy="114" rx="26" ry="3.5" fill="{O}" opacity=".14"/>'
        f'<rect x="47" y="98" width="10" height="13" rx="4" fill="{O}"/>'
        f'<rect x="63" y="98" width="10" height="13" rx="4" fill="{O}"/>'
        + robo_arms(r, pose)
        + f'<rect x="40" y="66" width="40" height="36" rx="13" fill="{P}" stroke="{O}" stroke-width="5"/>'
        f'<circle cx="60" cy="84" r="5" fill="{A}" stroke="{O}" stroke-width="3"/>'
        f'<line x1="60" y1="22" x2="60" y2="11" stroke="{O}" stroke-width="5" stroke-linecap="round"/>'
        f'<rect x="28" y="22" width="64" height="48" rx="22" fill="{B}" stroke="{O}" stroke-width="5"/>'
        f'<rect x="37" y="31" width="46" height="30" rx="12" fill="{S}"/>'
        + robo_eyes(r, pose)
        + f'<circle cx="60" cy="8" r="6" fill="{A}" stroke="{O}" stroke-width="3.5"/>'
        + robo_extra(r, pose)
    )


def robo_pad(r):
    O, B, A, P = r['O'], r['B'], r['A'], r['P']
    head = (
        f'<g transform="translate(60 44) scale(.62) translate(-60 -70)">'
        f'<path d="{PAD_PATH}" fill="{B}" stroke="{O}" stroke-width="8" stroke-linejoin="round"/>'
        f'<circle cx="37" cy="64" r="11" fill="{O}"/><circle cx="83" cy="64" r="11" fill="{O}"/>'
        f'<circle cx="40.5" cy="60.5" r="3.6" fill="{B}"/><circle cx="86.5" cy="60.5" r="3.6" fill="{B}"/>'
        f'<path d="M51 75 Q60 82 69 75" fill="none" stroke="{O}" stroke-width="6" stroke-linecap="round"/>'
        f'</g>'
    )
    return (
        f'<ellipse cx="60" cy="114" rx="24" ry="3.5" fill="{O}" opacity=".14"/>'
        f'<rect x="48" y="96" width="9" height="15" rx="4" fill="{O}"/>'
        f'<rect x="63" y="96" width="9" height="15" rx="4" fill="{O}"/>'
        f'<path d="M44 74 Q34 84 38 96" fill="none" stroke="{O}" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="M76 74 Q86 84 82 96" fill="none" stroke="{O}" stroke-width="5" stroke-linecap="round"/>'
        f'<rect x="43" y="64" width="34" height="36" rx="12" fill="{P}" stroke="{O}" stroke-width="5"/>'
        f'<line x1="60" y1="30" x2="60" y2="16" stroke="{O}" stroke-width="5" stroke-linecap="round"/>'
        + head
        + f'<circle cx="60" cy="12" r="6" fill="{A}" stroke="{O}" stroke-width="3.5"/>'
    )


PIXEL_BODY = (
    '....aa....',
    '....11....',
    '.11111111.',
    '1bbbbbbbb1',
    '1b1e11e1b1',
    '1b1e11e1b1',
    '1b11ee11b1',
    '1bbbbbbbb1',
    '.11111111.',
    '1.1pppp1.1',
    '111paap111',
    '..1pppp1..',
    '..11..11..',
)


def robo_pixel(r):
    colors = {'1': r['O'], 'a': r['A'], 'e': r['E'], 'b': r['B'], 'p': r['P']}
    shadow = f'<ellipse cx="60" cy="114" rx="26" ry="3.5" fill="{r["O"]}" opacity=".14"/>'
    return shadow + pixel_grid(PIXEL_BODY, colors, 8.4, 18, 0)


def robo_bubble(r):
    O, B, S, E, A, P = r['O'], r['B'], r['S'], r['E'], r['A'], r['P']
    body = (
        'M44 20 H76 C90.4 20 102 31.6 102 46 V66 C102 80.4 90.4 92 76 92 H50 L32 104 L35 90 '
        'C24.6 86.6 18 77 18 66 V46 C18 31.6 29.6 20 44 20 Z'
    )
    return (
        f'<ellipse cx="62" cy="115" rx="20" ry="3" fill="{O}" opacity=".14"/>'
        f'<circle cx="11" cy="64" r="6" fill="{P}" stroke="{O}" stroke-width="4"/>'
        f'<circle cx="109" cy="58" r="6" fill="{P}" stroke="{O}" stroke-width="4"/>'
        f'<line x1="60" y1="20" x2="60" y2="10" stroke="{O}" stroke-width="5" stroke-linecap="round"/>'
        f'<path d="{body}" fill="{B}" stroke="{O}" stroke-width="5" stroke-linejoin="round"/>'
        f'<rect x="31" y="33" width="58" height="42" rx="15" fill="{S}"/>'
        f'<ellipse cx="49" cy="51" rx="5.5" ry="8" fill="{E}"/>'
        f'<ellipse cx="71" cy="51" rx="5.5" ry="8" fill="{E}"/>'
        f'<path d="M54 64 Q60 69 66 64" fill="none" stroke="{E}" stroke-width="3.5" stroke-linecap="round"/>'
        f'<circle cx="60" cy="7" r="6" fill="{A}" stroke="{O}" stroke-width="3.5"/>'
    )


def mic_glyph(color):
    return (
        f'<rect x="46" y="22" width="28" height="48" rx="14" fill="{color}"/>'
        f'<path d="M33 58 Q33 86 60 86 Q87 86 87 58" fill="none" stroke="{color}" stroke-width="7" stroke-linecap="round"/>'
        f'<line x1="60" y1="86" x2="60" y2="100" stroke="{color}" stroke-width="7" stroke-linecap="round"/>'
        f'<line x1="46" y1="100" x2="74" y2="100" stroke="{color}" stroke-width="7" stroke-linecap="round"/>'
    )
