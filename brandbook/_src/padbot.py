import marks as m
import marks2 as m2

PAD_DY = 8


def eyes(c, pose):
    K, W = c['K'], c['W']
    if pose == 'cheer':
        arc = f'fill="none" stroke="{K}" stroke-width="6" stroke-linecap="round"'
        return (
            f'<path d="M28 68 Q37 56 46 68" {arc}/><path d="M74 68 Q83 56 92 68" {arc}/>'
            f'<path d="M50 76 Q60 90 70 76 Z" fill="{K}" stroke="{K}" stroke-width="3" stroke-linejoin="round"/>'
        )
    hx, hy = 3.5, -3.5
    mouth = f'<path d="M51 77 Q60 84 69 77" fill="none" stroke="{K}" stroke-width="4.5" stroke-linecap="round"/>'
    if pose == 'think':
        hx, hy = 2, -6
        mouth = f'<path d="M54 79 H66" fill="none" stroke="{K}" stroke-width="4.5" stroke-linecap="round"/>'
    if pose == 'hint':
        hx, hy = 6, -1
    return (
        f'<circle cx="37" cy="66" r="10.5" fill="{K}"/><circle cx="83" cy="66" r="10.5" fill="{K}"/>'
        f'<circle cx="{37 + hx}" cy="{66 + hy}" r="3.6" fill="{W}"/>'
        f'<circle cx="{83 + hx}" cy="{66 + hy}" r="3.6" fill="{W}"/>'
        + mouth
    )


def padbot(c, pose='idle'):
    K, F1, F5 = c['K'], c['F1'], c['F5']
    body = (
        f'<g transform="translate(0 {PAD_DY})">'
        f'<path d="{m.PAD_PATH}" fill="{F1}" stroke="{K}" stroke-width="6" stroke-linejoin="round"/>'
        f'<ellipse cx="24" cy="82" rx="5" ry="3" fill="{F5}"/><ellipse cx="96" cy="82" rx="5" ry="3" fill="{F5}"/>'
        + eyes(c, pose)
        + '</g>'
    )
    return body + m2.cap(c, 60, 18, 40, 14, 102, 52)


HANDS = {
    'idle': ((11, 86), (108, 86)),
    'think': ((11, 86), (80, 106)),
    'hint': ((11, 86), (110, 68)),
    'cheer': ((10, 46), (110, 46)),
}


def mascot_extra(c, pose):
    K, A = c['K'], c['F4']
    if pose == 'think':
        return (
            f'<circle cx="104" cy="22" r="3" fill="{K}"/><circle cx="110" cy="13" r="4" fill="{K}"/>'
            f'<circle cx="115" cy="4.5" r="4" fill="{K}"/>'
        )
    if pose == 'hint':
        return (
            f'<path d="M113 56 L116 51 M107 57 L106 52 M118 62 L119 58" fill="none" stroke="{K}" '
            f'stroke-width="2.6" stroke-linecap="round"/>'
        )
    if pose == 'cheer':
        return (
            f'<path d="M24 8 L26 13 L31 15 L26 17 L24 22 L22 17 L17 15 L22 13 Z" fill="{A}" stroke="{K}" '
            f'stroke-width="1.5"/>'
            f'<path d="M96 6 L98 11 L103 13 L98 15 L96 20 L94 15 L89 13 L94 11 Z" fill="{A}" stroke="{K}" '
            f'stroke-width="1.5"/>'
        )
    return ''


def mitt(x, y, side, fill, ink):
    tx = x + side * 5.5
    ty = y - 4.5
    angle = side * 28
    return (
        f'<ellipse cx="{tx}" cy="{ty}" rx="3.4" ry="4.8" transform="rotate({angle} {tx} {ty})" fill="{fill}" '
        f'stroke="{ink}" stroke-width="3.2"/>'
        f'<circle cx="{x}" cy="{y}" r="6.8" fill="{fill}" stroke="{ink}" stroke-width="3.8"/>'
    )


def mascot(c, pose='idle'):
    K, F1 = c['K'], c['F1']
    hands = ''
    for i, (x, y) in enumerate(HANDS[pose]):
        hands += mitt(x, y, 1 if i == 0 else -1, F1, K)
    return (
        f'<ellipse cx="60" cy="116" rx="28" ry="3.5" fill="{K}" opacity=".14"/>'
        f'<g transform="translate(60 56) scale(.86) translate(-60 -62)">{padbot(c, pose)}</g>'
        + hands
        + mascot_extra(c, pose)
    )
