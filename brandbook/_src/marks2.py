import board_kit as bk
import marks as m

INK = '#1E1B3A'
WHITE = '#FFFFFF'

MONO2 = dict(K=bk.INK, F1=bk.PAPER, F2=bk.INK, F3=bk.PAPER, F4=bk.ACCENT, F5=bk.SAND, W=bk.PAPER, G=bk.PAPER,
             E=bk.INK)


def colors(q):
    return dict(K=q['ink'], F1=q['pad'], F2=q['cap'], F3=q['pop'], F4=q['accent'], F5=q['extra'], W=WHITE,
                G=q['neutral'], E=q['eyes'])


def shadow_of(c):
    return {k: c['K'] for k in c}


def sticker(fn, c, dx=3.5, dy=4.5):
    flat = shadow_of(c)
    return f'<g transform="translate({dx} {dy})">{fn(flat)}</g>{fn(c)}'


def shrink(inner, s=.9):
    return f'<g transform="translate(60 60) scale({s}) translate(-62 -62)">{inner}</g>'


def cap(c, cx, top, half, depth, tassel_x, tassel_y):
    K, F2, F4 = c['K'], c['F2'], c['F4']
    mid = top + depth
    bottom = top + depth * 2
    base_l = cx - half * .55
    base_r = cx + half * .55
    return (
        f'<path d="M{base_l} {mid - 2} V{mid + 9} Q{cx} {mid + 18} {base_r} {mid + 9} V{mid - 2} Z" '
        f'fill="{bk.shade(F2, .25)}" stroke="{K}" stroke-width="5" stroke-linejoin="round"/>'
        f'<polygon points="{cx},{top} {cx + half},{mid} {cx},{bottom} {cx - half},{mid}" fill="{F2}" '
        f'stroke="{K}" stroke-width="5" stroke-linejoin="round"/>'
        f'<path d="M{cx} {mid} L{tassel_x} {mid + 5} V{tassel_y}" fill="none" stroke="{K}" stroke-width="4" '
        f'stroke-linecap="round" stroke-linejoin="round"/>'
        f'<circle cx="{cx}" cy="{mid}" r="3.5" fill="{K}"/>'
        f'<circle cx="{tassel_x}" cy="{tassel_y + 4}" r="6" fill="{F4}" stroke="{K}" stroke-width="3.5"/>'
    )


def pad_face(c, dy):
    K, W = c['K'], c['W']
    return (
        f'<g transform="translate(0 {dy})">'
        f'<path d="{m.PAD_PATH}" fill="{c["F1"]}" stroke="{K}" stroke-width="6" stroke-linejoin="round"/>'
        f'<circle cx="37" cy="66" r="10.5" fill="{K}"/><circle cx="83" cy="66" r="10.5" fill="{K}"/>'
        f'<circle cx="40.5" cy="62.5" r="3.6" fill="{W}"/><circle cx="86.5" cy="62.5" r="3.6" fill="{W}"/>'
        f'<path d="M51 77 Q60 84 69 77" fill="none" stroke="{K}" stroke-width="4.5" stroke-linecap="round"/>'
        f'<ellipse cx="26" cy="80" rx="5" ry="3" fill="{c["F5"]}" opacity=".9"/>'
        f'<ellipse cx="94" cy="80" rx="5" ry="3" fill="{c["F5"]}" opacity=".9"/>'
        f'</g>'
    )


def mark_gradpad(c):
    return pad_face(c, 8) + cap(c, 60, 10, 42, 15, 96, 50)


def mark_smartrobo(c):
    K, F1, E, F4 = c['K'], c['F1'], c['E'], c['F4']
    return (
        f'<rect x="5" y="60" width="12" height="24" rx="5" fill="{F4}" stroke="{K}" stroke-width="4"/>'
        f'<rect x="103" y="60" width="12" height="24" rx="5" fill="{F4}" stroke="{K}" stroke-width="4"/>'
        f'<rect x="15" y="34" width="90" height="78" rx="32" fill="{F1}" stroke="{K}" stroke-width="6"/>'
        f'<rect x="28" y="48" width="64" height="50" rx="18" fill="{K}"/>'
        f'<ellipse cx="47" cy="69" rx="7" ry="10" fill="{E}"/>'
        f'<ellipse cx="73" cy="69" rx="7" ry="10" fill="{E}"/>'
        f'<path d="M52 86 Q60 92 68 86" fill="none" stroke="{E}" stroke-width="4.5" stroke-linecap="round"/>'
        + cap(c, 60, 6, 44, 14, 100, 48)
    )


def math_buttons(c):
    K, W = c['K'], c['W']
    fills = (c['F4'], c['F3'], c['F5'], c['F2'])
    centers = ((85, 49), (98, 62), (85, 75), (72, 62))
    glyphs = (
        'M-3 -3 L3 3 M3 -3 L-3 3',
        'M-3.6 0 H3.6 M0 -3.4 V-3.3 M0 3.3 V3.4',
        'M-3.6 0 H3.6',
        'M-3.4 -1.8 H3.4 M-3.4 1.8 H3.4',
    )
    out = ''
    for (x, y), f, g in zip(centers, fills, glyphs):
        out += (
            f'<circle cx="{x}" cy="{y}" r="7.4" fill="{f}" stroke="{K}" stroke-width="3.5"/>'
            f'<path d="{g}" transform="translate({x} {y})" fill="none" stroke="{W}" stroke-width="2.4" '
            f'stroke-linecap="round"/>'
        )
    return out


def mark_mathpad(c):
    K, F1, F4 = c['K'], c['F1'], c['F4']
    return (
        f'<line x1="60" y1="36" x2="60" y2="20" stroke="{K}" stroke-width="6" stroke-linecap="round"/>'
        f'<g transform="translate(0 -6)">'
        f'<path d="{m.PAD_PATH}" fill="{F1}" stroke="{K}" stroke-width="6" stroke-linejoin="round"/></g>'
        f'<path d="M30 52 h10 v10 h10 v10 h-10 v10 h-10 v-10 h-10 v-10 h10 Z" transform="translate(0 -10)" '
        f'fill="{K}" stroke="{K}" stroke-width="2" stroke-linejoin="round"/>'
        + math_buttons(c)
        + f'<path d="M52 78 Q60 84 68 78" fill="none" stroke="{K}" stroke-width="4.5" stroke-linecap="round"/>'
        f'<circle cx="60" cy="15" r="8" fill="{F4}" stroke="{K}" stroke-width="4.5"/>'
    )


HEX = '60,7 106,33.5 106,86.5 60,113 14,86.5 14,33.5'


def badge_defs(c, gid):
    return (
        f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{c["F2"]}"/><stop offset=".5" stop-color="{c["F5"]}"/>'
        f'<stop offset="1" stop-color="{c["F4"]}"/></linearGradient></defs>'
    )


def mark_badge(c, inner_fn=None):
    K = c['K']
    gid = 'bg' + ''.join(ch for ch in c['F2'] + c['F4'] if ch.isalnum())
    fill = f'url(#{gid})' if c['F2'] != c['K'] else c['F1']
    inner_fn = inner_fn or mark_gradpad
    inner = f'<g transform="translate(60 64) scale(.6) translate(-60 -62)">{inner_fn(c)}</g>'
    return (
        badge_defs(c, gid)
        + f'<polygon points="{HEX}" fill="{fill}" stroke="{K}" stroke-width="6" stroke-linejoin="round"/>'
        + f'<polygon points="{HEX}" fill="none" stroke="{c["W"]}" stroke-width="2.5" stroke-linejoin="round" '
          f'transform="translate(60 60) scale(.86) translate(-60 -60)" opacity=".8"/>'
        + inner
    )


def robo_cap(r, pose='idle'):
    O, B, S, A, P = r['O'], r['B'], r['S'], r['A'], r['P']
    capc = dict(K=O, F2=r.get('C', S), F4=A)
    return (
        f'<ellipse cx="60" cy="114" rx="26" ry="3.5" fill="{O}" opacity=".14"/>'
        f'<rect x="47" y="98" width="10" height="13" rx="4" fill="{O}"/>'
        f'<rect x="63" y="98" width="10" height="13" rx="4" fill="{O}"/>'
        + m.robo_arms(r, pose)
        + f'<rect x="40" y="66" width="40" height="36" rx="13" fill="{P}" stroke="{O}" stroke-width="5"/>'
        f'<circle cx="60" cy="84" r="5" fill="{A}" stroke="{O}" stroke-width="3"/>'
        f'<rect x="28" y="24" width="64" height="46" rx="21" fill="{B}" stroke="{O}" stroke-width="5"/>'
        f'<rect x="37" y="32" width="46" height="29" rx="12" fill="{S}"/>'
        + m.robo_eyes(r, pose)
        + cap(capc, 60, 3, 32, 10, 88, 30)
        + m.robo_extra(r, pose)
    )


def robo2_colors(q):
    return dict(O=q['ink'], B=q['pad'], S=q['ink'], E=q['eyes'], A=q['accent'], P=q['cap'], M=q['eyes'],
                C=q['cap'])


ROBO2_MONO = dict(m.ROBO_MONO, C=bk.INK)
