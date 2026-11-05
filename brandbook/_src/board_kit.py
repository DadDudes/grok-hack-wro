import json
import math
import re
from pathlib import Path

KIT_DIR = Path(__file__).parent

PAPER = '#FAF7F2'
PAGE = '#F1ECE3'
SAND = '#ECE3D4'
LINE = '#E0D6C6'
MUTED = '#5A6570'
INK = '#1F2429'
ACCENT = '#B8862B'

MONO = dict(G=PAPER, L=INK, K=INK, A=ACCENT, T=SAND, D=PAPER)
MONO_DARK = dict(G=INK, L=PAPER, K=PAPER, A=ACCENT, T='#3A454E', D=INK)

FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;'
    '1,7..72,400&family=Figtree:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Baloo+2:wght@500;600;700;800&family=Fredoka:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">'
)

DEFS = '''<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<filter id="lift" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="1.8" stdDeviation="1.5" flood-color="#2B1E10" flood-opacity=".26"/></filter>
<filter id="lift2" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="2.6" stdDeviation="1.4" flood-color="#2B1E10" flood-opacity=".34"/></filter>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>
<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".95" numOctaves="2" seed="4"/><feColorMatrix type="saturate" values="0"/></filter>
<filter id="print" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="7" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/><feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="1" seed="2" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.1 0 0 0 1.42" result="a"/><feComposite in="d" in2="a" operator="in"/></filter>
</defs></svg>'''

SOLO_JS = '''<script>
const q = new URLSearchParams(location.search);
const p = q.get('p');
if (p) {
  document.body.classList.add('solo');
  document.querySelectorAll('section.page').forEach((s, i) => { if (i + 1 !== +p) s.style.display = 'none'; });
}
if (q.get('check')) {
  document.fonts.ready.then(() => setTimeout(() => {
    const out = [];
    document.querySelectorAll('section.page').forEach((pg, i) => {
      const pr = pg.getBoundingClientRect();
      if (Math.round(pr.width) !== 1600 || Math.round(pr.height) !== 900) out.push({page: i + 1, issue: 'page size ' + Math.round(pr.width) + 'x' + Math.round(pr.height)});
      const leaves = [];
      pg.querySelectorAll('*').forEach(el => {
        if (el.closest('svg') || el.closest('[data-allow-overlap]')) return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        if (r.right > pr.right + 1 || r.bottom > pr.bottom + 1 || r.left < pr.left - 1 || r.top < pr.top - 1) {
          if (!el.closest('.pdf')) out.push({page: i + 1, issue: 'outside page', el: el.className || el.tagName, text: (el.textContent || '').trim().slice(0, 40)});
        }
        const cs = getComputedStyle(el);
        if ((cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) && !el.classList.contains('page')) {
          out.push({page: i + 1, issue: 'clipped content', el: el.className || el.tagName, text: (el.textContent || '').trim().slice(0, 40)});
        }
        const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (own) leaves.push({el, r});
      });
      for (let a = 0; a < leaves.length; a++) for (let b = a + 1; b < leaves.length; b++) {
        const A = leaves[a], B = leaves[b];
        if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
        const ox = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left);
        const oy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
        if (ox > 3 && oy > 3) out.push({page: i + 1, issue: 'text overlap', text: (A.el.textContent || '').trim().slice(0, 30) + ' | ' + (B.el.textContent || '').trim().slice(0, 30)});
      }
    });
    const t = document.body.innerText;
    if (/[\\u2013\\u2014]/.test(t)) out.push({page: 0, issue: 'en or em dash in text'});
    document.body.setAttribute('data-check', JSON.stringify(out));
  }, 600));
}
</script>'''


def load_brand(brandbook_dir):
    f = Path(brandbook_dir) / 'brand.json'
    if not f.exists():
        return {'product': '', 'name': {'status': 'provisional', 'current': None, 'placeholder': 'Product*'}}
    return json.loads(f.read_text())


def name_chosen(brand):
    return brand['name']['status'] == 'chosen' and bool(brand['name'].get('current'))


def display_name(brand):
    return brand['name']['current'] if name_chosen(brand) else (brand['name'].get('placeholder') or 'Product*')


def wordmark(brand, candidate=None):
    if name_chosen(brand):
        return brand['name']['current']
    return candidate or display_name(brand).rstrip('*')


def footer_text(brand, round_label, topic):
    if name_chosen(brand):
        return f'{display_name(brand)} · {round_label} · {topic} · not brandbook'
    return f'{display_name(brand)} · {round_label} · {topic} · provisional name · not brandbook'


def css():
    return (KIT_DIR / 'board.css').read_text()


def rgb(h):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def hexc(r):
    return '#%02X%02X%02X' % tuple(max(0, min(255, round(v))) for v in r)


def mix(a, b, t):
    return hexc([x + (y - x) * t for x, y in zip(rgb(a), rgb(b))])


def shade(h, t):
    return mix(h, '#000000', t)


def tint(h, t):
    return mix(h, '#FFFFFF', t)


def _lin(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(h):
    r, g, b = (_lin(c) for c in rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    x, y = sorted((luminance(a), luminance(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)


def lab(h):
    r, g, b = (_lin(c) for c in rgb(h))
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))


def de76(a, b):
    return sum((p - q) ** 2 for p, q in zip(lab(a), lab(b))) ** 0.5


def nearest(h, competitors):
    d, k = min((de76(h, v), k) for k, v in competitors.items())
    return k, d


def readable_on(bg):
    return INK if contrast(INK, bg) >= contrast('#FFFFFF', bg) else '#FFFFFF'


def palette_colors(p):
    mode = p.get('mode', 'line')
    if mode == 'ground':
        c = dict(G=p['brand'], L=p['ink'], K=p['ink'], A=p['accent'], T=tint(p['brand'], .45))
    elif mode == 'dark':
        c = dict(G=p['brand'], L=p['neutral'], K=p['ink'], A=p['accent'], T=tint(p['brand'], .3))
    else:
        c = dict(G=p['neutral'], L=p['brand'], K=p['ink'], A=p['accent'], T=tint(p['brand'], .78))
    c['D'] = c['K'] if contrast(c['A'], c['G']) < 1.9 else c['G']
    return c


def svg(inner, size, cls=''):
    c = f' class="{cls}"' if cls else ''
    return f'<svg{c} width="{size}" height="{size}" viewBox="0 0 120 120" aria-hidden="true">{inner}</svg>'


def tile(inner, size, ground):
    return (
        f'<span class="tile" style="width:{size}px;height:{size}px;background:{ground};border-radius:{size * .23:.1f}px">'
        f'{svg(inner, size * .74)}</span>'
    )


def icon_row(mark, colors_list):
    out = ''
    for i, c in enumerate(colors_list):
        if i:
            out += '<span class="sep"></span>'
        sizes = (64, 32, 16) if i < len(colors_list) - 1 else (64,)
        out += ''.join(tile(mark(c), s, c['G']) for s in sizes)
    return f'<div class="iconcap">App icon · 64 / 32 / 16</div><div class="icons">{out}</div>'


def lockup(mark_inner, name, dark=False, note=''):
    cls = 'lkr dark' if dark else 'lkr'
    n = f'<span class="id">{note}</span>' if note else ''
    return f'<div class="{cls}">{svg(mark_inner, 48)}<span class="wm">{name}</span>{n}</div>'


PAGENUM = '%%PAGENUM%%'


def foot(left):
    return f'<div class="foot"><span>{left}</span><span>{PAGENUM}</span></div>'


def section(cls, body, foot_left):
    return f'<section class="page {cls}">{body}{foot(foot_left)}</section>'


def notes_html(notes):
    out = ''
    for h, items in notes:
        lis = ''.join(f'<li>{x}</li>' for x in items)
        out += f'<div class="note"><h3>{h}</h3><ul>{lis}</ul></div>'
    return f'<div class="notes">{out}</div>'


def card(code, tag, mark_inner, name, short, bg=None, fg=None, mark_size=116):
    st = f' style="background:{bg};border-color:transparent"' if bg else ''
    fs = f' style="color:{fg}"' if fg else ''
    return (
        f'<div class="cc"{st}><div class="top"><span class="lt"{fs}>{code}</span><span class="tagx"{fs}>{tag}</span></div>'
        f'<div class="mk">{svg(mark_inner, mark_size)}</div><div class="nm"{fs}>{name}</div><div class="sh"{fs}>{short}</div></div>'
    )


def cover_page(kicker, h1, lede, notes, cards, foot_left):
    body = (
        f'<div class="kick">{kicker}</div><div class="cgrid"><div><h1>{h1}</h1><p class="lede">{lede}</p>'
        f'{notes_html(notes)}</div><div class="cards">{"".join(cards)}</div></div>'
    )
    return section('cover', body, foot_left)


def direction_page(kicker, code, name, pill, hero_inner, icons, idea, blocks, lockups, side, side_caption, foot_left,
                   hero_caption='Mark'):
    bl = ''.join(f'<div class="b2"><h4>{h}</h4><p>{p}</p></div>' for h, p in blocks)
    body = (
        f'<div class="dhead"><div><div class="kick">{kicker}</div><h2 class="t"><span>{code}</span> {name}</h2></div>'
        f'<span class="pill">{pill}</span></div>'
        f'<div class="dbody"><div><div class="hero">{svg(hero_inner, 290)}<span class="cap">{hero_caption}</span></div>{icons}</div>'
        f'<div class="txt"><p class="idea">{idea}</p>{bl}<div class="locks">{"".join(lockups)}</div></div>'
        f'<div class="pdfwrap">{side}<div class="pdfcap">{side_caption}</div></div></div>'
    )
    return section('dp', body, foot_left)


def grid_page(kicker, title, columns, rows, foot_left, label_w=170, cell_h=300, cell_size=228):
    cols = len(columns)
    head = '<div></div>' + ''.join(f'<div class="ch">{t}<small>{d}</small></div>' for t, d in columns)
    body_rows = ''
    for (code, name, sub), cells in rows:
        body_rows += f'<div class="rl"><b>{code}</b><span>{name}</span><i>{sub}</i></div>'
        body_rows += ''.join(f'<div class="dcell" style="height:{cell_h}px">{svg(c, cell_size)}</div>' for c in cells)
    body = (
        f'<div class="kick">{kicker}</div><h2 class="t">{title}</h2>'
        f'<div class="dgrid" style="grid-template-columns:{label_w}px repeat({cols},1fr)">{head}{body_rows}</div>'
    )
    return section('kp', body, foot_left)


def palette_page(kicker, title, palettes, demo, competitors, foot_left, own_avoid=None):
    cols = ''
    for p in palettes:
        c = palette_colors(p)
        roles = [('Brand', p['brand']), ('Ink', p['ink']), ('Neutral', p['neutral']), ('Accent', p['accent'])]
        sws = ''.join(
            f'<div class="sw" style="background:{h};color:{readable_on(h)}"><span>{r}</span><span>{h.upper()}</span></div>'
            for r, h in roles
        )
        nk, nd = nearest(p['brand'], competitors)
        mode = p.get('mode', 'line')
        if mode == 'ground':
            key = f'ink on brand {contrast(p["ink"], p["brand"]):.2f}'
        elif mode == 'dark':
            key = f'neutral on brand {contrast(p["neutral"], p["brand"]):.2f}'
        else:
            key = f'brand on neutral {contrast(p["brand"], p["neutral"]):.2f}'
        avoid = ''
        if own_avoid:
            avoid = f'<br>{own_avoid[0]} dE {de76(p["brand"], own_avoid[1]):.0f}'
        stats = f'{key}<br>accent on ground {contrast(c["A"], c["G"]):.2f}{avoid}<br>nearest: {nk} dE {nd:.0f}'
        cols += (
            f'<div class="wc"><div class="hero" style="background:{c["G"]}">{demo(c)}'
            f'<div class="city" style="color:{c["L"]}">{p.get("sample", "Lisbon")}</div></div>{sws}'
            f'<div class="meta"><b>{p["id"]} {p["name"]}</b><span>{p.get("note", "")}</span><code>{stats}</code></div></div>'
        )
    n = len(palettes)
    body = (
        f'<div class="kick">{kicker}</div><h2 class="t">{title}</h2>'
        f'<div class="wgrid" style="grid-template-columns:repeat({n},1fr)">{cols}</div>'
    )
    return section('pp', body, foot_left)


def matrix_page(kicker, title, marks, palettes, foot_left, render=None, label_w=200, cell_h=64, size=54):
    render = render or (lambda fn, c: svg(fn(c), size))
    head = '<div></div>' + ''.join(f'<div class="ch">{code} · {name}</div>' for code, name, _ in marks)
    rows = ''
    for p in palettes:
        c = palette_colors(p)
        sw = ''.join(f'<i style="background:{h}"></i>' for h in (p['brand'], p['ink'], p['neutral'], p['accent']))
        rows += f'<div class="rl"><b>{p["id"]} {p["name"]}</b><div class="msw">{sw}</div></div>'
        for _, _, fn in marks:
            rows += f'<div class="c7" style="background:{c["G"]};height:{cell_h}px">{render(fn, c)}</div>'
    body = (
        f'<div class="kick">{kicker}</div><h2 class="t">{title}</h2>'
        f'<div class="mt7" style="grid-template-columns:{label_w}px repeat({len(marks)},1fr)">{head}{rows}</div>'
    )
    return section('mx', body, foot_left)


def mini_pdf(mark_inner, name, title, meta, days, extra='', accent_color=None, line_color=None, ground=PAPER):
    lc = line_color or '#52707F'
    rows = ''
    for i, (d, t, s) in enumerate(days):
        rows += (
            f'<div class="dr"><span class="db" style="background:{lc}">{i + 1}</span><div>'
            f'<div class="dt"><b style="color:{lc}">{d}</b> {t}</div><div class="ds">{s}</div></div></div>'
        )
    return (
        f'<div class="pdf" style="background:{ground}"><div class="ph">{svg(mark_inner, 24)}<span class="pw">{name}</span>'
        f'<span class="pk">Plan</span></div><div class="pt">{title}</div><div class="pm">{meta}</div>'
        f'<div class="dl">{rows}</div>{extra}<div class="pf"><span>Page 1</span><span>Revision 1 of 3</span></div></div>'
    )


LIFT = ' filter="url(#lift)"'
LIFT2 = ' filter="url(#lift2)"'


def paper_stack(t):
    return (
        f'<rect x="12" y="22" width="88" height="94" rx="9" fill="{shade(t, .1)}" transform="rotate(-9 60 66)"{LIFT}/>'
        f'<rect x="22" y="14" width="88" height="94" rx="9" fill="{t}" transform="rotate(7 60 66)"{LIFT}/>'
    )


def shrink(inner, s=.88):
    return f'<g transform="translate(60 62) scale({s}) translate(-60 -62)">{inner}</g>'


def texture(inner, ground):
    return (
        f'<rect x="0" y="0" width="120" height="120" rx="10" fill="{ground}"/>'
        f'<rect x="0" y="0" width="120" height="120" rx="10" filter="url(#paper)" opacity=".2"/>'
        f'<g filter="url(#print)">{inner}</g>'
    )


def extrude(draw, c, n=7, dx=.55, dy=1.05):
    dark = shade(c['L'] if c['L'] != c['G'] else c['K'], .45)
    dc = dict(G=dark, L=dark, K=dark, A=dark, T=dark, D=dark, X=True)
    copies = ''.join(f'<g transform="translate({i * dx:.2f} {i * dy:.2f})">{draw(dc)}</g>' for i in range(n, 0, -1))
    return f'<g transform="translate(60 60) scale(.9) translate(-62 -64)"><g{LIFT2}>{copies}</g>{draw(c)}</g>'


C30 = math.cos(math.radians(30))


def iso(x, y, z):
    return ((x - y) * C30, (x + y) * 0.5 - z * 0.85)


class Scene:
    def __init__(self):
        self.items = []

    def poly(self, pts3, fill, stroke=None, sw=0, extra=''):
        self.items.append(('poly', [iso(*p) for p in pts3], fill, stroke, sw, extra))

    def line(self, pts3, stroke, sw, dash, extra=''):
        self.items.append(('line', [iso(*p) for p in pts3], stroke, sw, dash, extra))

    def circle(self, p3, r, fill, stroke=None, sw=0, extra=''):
        self.items.append(('circ', iso(*p3), r, fill, stroke, sw, extra))

    def box(self, x0, y0, x1, y1, z0, z1, top, left, right):
        self.poly([(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)], right)
        self.poly([(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], left)
        self.poly([(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], top)

    def render(self, size=120, pad=6):
        xs, ys = [], []
        for it in self.items:
            if it[0] in ('poly', 'line'):
                xs += [p[0] for p in it[1]]
                ys += [p[1] for p in it[1]]
            else:
                (x, y), r = it[1], it[2]
                xs += [x - r, x + r]
                ys += [y - r, y + r]
        w, h = max(xs) - min(xs), max(ys) - min(ys)
        s = (size - 2 * pad) / max(w, h)
        ox = pad + ((size - 2 * pad) - w * s) / 2 - min(xs) * s
        oy = pad + ((size - 2 * pad) - h * s) / 2 - min(ys) * s
        T = lambda p: (ox + p[0] * s, oy + p[1] * s)
        out = ''
        for it in self.items:
            if it[0] == 'poly':
                pts = ' '.join('%.2f,%.2f' % T(p) for p in it[1])
                st = f' stroke="{it[3]}" stroke-width="{it[4]}" stroke-linejoin="round"' if it[3] else ''
                out += f'<polygon points="{pts}" fill="{it[2]}"{st}{it[5]}/>'
            elif it[0] == 'line':
                pts = ' '.join('%.2f,%.2f' % T(p) for p in it[1])
                out += (f'<polyline points="{pts}" fill="none" stroke="{it[2]}" stroke-width="{it[3]}" '
                        f'stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="{it[4]}"{it[5]}/>')
            else:
                x, y = T(it[1])
                st = f' stroke="{it[4]}" stroke-width="{it[5]}"' if it[4] else ''
                out += f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{it[2] * s:.2f}" fill="{it[3]}"{st}{it[6]}/>'
        return out


def document(title, pages):
    total = len(pages)
    html = '\n'.join(pages)
    n = iter(range(1, total + 1))
    html = re.sub(re.escape(PAGENUM), lambda m: f'{next(n):02d} / {total:02d}', html)
    return (
        f'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        f'<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>{title}</title>\n{FONTS}\n'
        f'<style>{css()}</style>\n</head>\n<body>\n{DEFS}\n<div class="book">\n{html}\n</div>\n{SOLO_JS}\n</body>\n</html>\n'
    )
