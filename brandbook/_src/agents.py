import board_kit as bk
import marks as m
import marks2 as m2
import padbot as pb

STATE_POSE = {'idle': 'idle', 'working': 'think', 'handoff': 'hint', 'done': 'cheer'}
METAL = '#C9CED6'
WOOD = '#FFE2B8'
LENS = '#E6F7FF'

AGENTS = [
    dict(key='prof', name='Prof', role='Pedagogue', side='Parent', acc='pencil',
         does='Turns the parent\'s goal into 10 tasks, easy to hard.',
         prop='Pencil behind the ear and reading glasses: plans and writes.',
         line='Multiplication to 50 for age 8. I made 10 tasks, easy to hard.'),
    dict(key='spark', name='Spark', role='Game Designer', side='Kid', acc='bulb',
         does='Hears the kid\'s idea and offers 2-3 game types in that theme.',
         prop='Lightbulb antenna: the idea lights up when it has one.',
         line='Dinosaurs in space! Catch star eggs, dodge comets or beat the space boss?'),
    dict(key='doodle', name='Doodle', role='Artist', side='Kid', acc='brush',
         does='Paints the hero, the world and 4 items with Grok Imagine.',
         prop='Paintbrush and a beret: makes the pictures.',
         line='Painting Rex, his rocket and four shiny space rocks...'),
    dict(key='robo', name='Robo', role='Teammate', side='Kid', acc='cap',
         does='Plays with the kids, gives hints, never the answer.',
         prop='The main character and the logo. Leads the crew, plays on your team.',
         line='Close! Try counting by 7s. Maja, your turn!'),
    dict(key='lens', name='Lens', role='Analyst', side='Parent', acc='lens',
         does='Compares sessions and tells the parent what to practise.',
         prop='Magnifier with a chart inside: looks at progress.',
         line='Maja went from 40% to 75%. Practise 7x and 8x next.'),
]

WHEEL = ['#FFC233', '#4CC9F0', '#FF6FA5', '#2ED3A0', '#FF8A3D', '#B39CFF']


def agent_hues(p):
    robo = p['pad']
    free = [h for h in WHEEL if bk.de76(h, robo) > 25 and bk.de76(h, p['ground']) > 20]
    order = ['prof', 'spark', 'doodle', 'lens']
    hues = dict(zip(order, free))
    hues['robo'] = robo
    return hues


def agent_colors(p, key):
    hue = agent_hues(p)[key]
    if key == 'robo':
        return dict(K=p['ink'], F1=p['pad'], F2=p['cap'], F3=p['body'], F4=p['accent'], F5=p['cheek'], W='#FFFFFF')
    return dict(K=p['ink'], F1=hue, F2=p['cap'], F3=bk.tint(hue, .55), F4=p['accent'], F5=p['cheek'], W='#FFFFFF')


def glasses(c):
    K = c['K']
    ring = f'fill="none" stroke="{K}" stroke-width="4"'
    return (
        f'<circle cx="37" cy="66" r="15" {ring}/><circle cx="83" cy="66" r="15" {ring}/>'
        f'<path d="M52 64 Q60 58 68 64" {ring}/>'
    )


def pad_body(c, pose, face_extra=''):
    K, F1, F5 = c['K'], c['F1'], c['F5']
    return (
        f'<g transform="translate(0 {pb.PAD_DY})">'
        f'<path d="{m.PAD_PATH}" fill="{F1}" stroke="{K}" stroke-width="6" stroke-linejoin="round"/>'
        f'<ellipse cx="24" cy="82" rx="5" ry="3" fill="{F5}"/><ellipse cx="96" cy="82" rx="5" ry="3" fill="{F5}"/>'
        + pb.eyes(c, pose)
        + face_extra
        + '</g>'
    )


PENCIL = '#FFC233'
ERASER = '#FF8FB1'


def acc_pencil(c):
    K = c['K']
    stripe = bk.shade(PENCIL, .18)
    back = (
        f'<g transform="rotate(32 76 54)"><g class="acc acc-pencil">'
        f'<rect x="69" y="50" width="14" height="10" rx="3" fill="{ERASER}" stroke="{K}" stroke-width="3.5"/>'
        f'<rect x="69" y="16" width="14" height="36" rx="2" fill="{PENCIL}" stroke="{K}" stroke-width="3.5"/>'
        f'<line x1="73.7" y1="19" x2="73.7" y2="49" stroke="{stripe}" stroke-width="2"/>'
        f'<line x1="78.3" y1="19" x2="78.3" y2="49" stroke="{stripe}" stroke-width="2"/>'
        f'<rect x="69" y="44" width="14" height="7" fill="{METAL}" stroke="{K}" stroke-width="3"/>'
        f'<polygon points="69,16 83,16 76,1" fill="{WOOD}" stroke="{K}" stroke-width="3.5" stroke-linejoin="round"/>'
        f'<polygon points="73.2,7 78.8,7 76,1" fill="{K}"/>'
        f'</g></g>'
    )
    return back, ''


def acc_bulb(c, lit=True):
    K = c['K']
    glow = c['F4'] if lit else '#FFF6D6'
    if lit:
        glow = '#FFE15A'
    rays = ''
    if lit:
        rays = ''.join(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{K}" stroke-width="3.5" stroke-linecap="round"/>'
            for x1, y1, x2, y2 in ((60, 8, 60, 3), (46.5, 13.5, 43, 10), (73.5, 13.5, 77, 10),
                                   (41, 26, 36, 26), (79, 26, 84, 26))
        )
    back = (
        f'<line x1="60" y1="54" x2="60" y2="40" stroke="{K}" stroke-width="5" stroke-linecap="round"/>'
    )
    front = (
        f'<g class="acc acc-bulb">'
        f'<rect x="53.5" y="36" width="13" height="9" rx="2.5" fill="{METAL}" stroke="{K}" stroke-width="3"/>'
        f'<line x1="54" y1="40.5" x2="66" y2="40.5" stroke="{K}" stroke-width="1.8"/>'
        f'<circle cx="60" cy="26" r="13" fill="{glow}" stroke="{K}" stroke-width="4"/>'
        f'<path d="M55 33 V28 L58 24 L60 28 L62 24 L65 28 V33" fill="none" stroke="{K}" stroke-width="2" '
        f'stroke-linejoin="round" stroke-linecap="round"/>'
        f'<path d="M52.5 22 Q53.5 16.5 59 15.5" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
        + rays
        + '</g>'
    )
    return back, front


def acc_brush(c):
    K = c['K']
    paint = c['F5']
    back = (
        f'<g transform="rotate(30 78 56)"><g class="acc acc-brush">'
        f'<rect x="73" y="22" width="10" height="36" rx="5" fill="{c["F4"]}" stroke="{K}" stroke-width="3.5"/>'
        f'<rect x="72" y="18" width="12" height="9" rx="2" fill="{METAL}" stroke="{K}" stroke-width="3"/>'
        f'<path d="M72 19 C71 10 74 4 78 1 C82 4 85 10 84 19 Z" fill="{paint}" stroke="{K}" stroke-width="3.5" '
        f'stroke-linejoin="round"/>'
        f'</g></g>'
    )
    front = (
        f'<g transform="rotate(-12 42 50)">'
        f'<ellipse cx="42" cy="50" rx="23" ry="8.5" fill="{c["F2"]}" stroke="{K}" stroke-width="4"/>'
        f'<path d="M24 49 Q42 40 60 49" fill="none" stroke="{bk.tint(c["F2"], .35)}" stroke-width="3" '
        f'stroke-linecap="round"/>'
        f'<circle cx="40" cy="40" r="3.8" fill="{c["F2"]}" stroke="{K}" stroke-width="3"/>'
        f'</g>'
    )
    return back, front


def acc_lens(c):
    K, F1 = c['K'], c['F1']
    bars = ''.join(
        f'<rect x="{x}" y="{y}" width="4.5" height="{h}" rx="1" fill="{F1}" stroke="{K}" stroke-width="1.6"/>'
        for x, y, h in ((68, 23, 7), (74, 18, 12), (80, 13, 17))
    )
    back = (
        f'<g transform="rotate(24 64 56)">'
        f'<rect x="60" y="34" width="9" height="24" rx="4.5" fill="{c["F2"]}" stroke="{K}" stroke-width="3.5"/>'
        f'</g>'
    )
    front = (
        f'<g class="acc acc-lens">'
        f'<circle cx="76" cy="22" r="15" fill="{LENS}" stroke="{K}" stroke-width="5.5"/>'
        + bars
        + f'<path d="M67 16 Q69 11 74 10" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>'
        '</g>'
    )
    return back, front


def accessory(c, acc, state):
    if acc == 'pencil':
        return acc_pencil(c)
    if acc == 'bulb':
        return acc_bulb(c, lit=state != 'idle')
    if acc == 'brush':
        return acc_brush(c)
    if acc == 'lens':
        return acc_lens(c)
    return '', f'<g class="acc acc-cap">{m2.cap(c, 60, 18, 40, 14, 102, 52)}</g>'


def head(c, acc, state='idle'):
    pose = STATE_POSE[state]
    extra = glasses(c) if acc == 'pencil' else ''
    back, front = accessory(c, acc, state)
    return back + pad_body(c, pose, extra) + front


def state_extra(c, state):
    K = c['K']
    if state == 'working':
        return (
            f'<circle cx="96" cy="30" r="3" fill="{K}"/><circle cx="104" cy="22" r="4" fill="{K}"/>'
            f'<circle cx="112" cy="13" r="5" fill="{K}"/>'
        )
    if state == 'handoff':
        return (
            f'<g transform="rotate(-10 108 50)"><rect x="100" y="40" width="16" height="20" rx="3" fill="#FFFFFF" '
            f'stroke="{K}" stroke-width="3"/><line x1="104" y1="47" x2="112" y2="47" stroke="{K}" stroke-width="2.5" '
            f'stroke-linecap="round"/><line x1="104" y1="53" x2="110" y2="53" stroke="{K}" stroke-width="2.5" '
            f'stroke-linecap="round"/></g>'
        )
    if state == 'done':
        return (
            f'<circle cx="101" cy="22" r="10" fill="#2ED3A0" stroke="{K}" stroke-width="3.5"/>'
            f'<path d="M96 22 L100 26 L107 18" fill="none" stroke="#FFFFFF" stroke-width="3.5" '
            f'stroke-linecap="round" stroke-linejoin="round"/>'
        )
    return ''


def figure(c, acc, state='idle'):
    if acc == 'cap':
        card = state_extra(c, 'handoff') if state == 'handoff' else ''
        return pb.mascot(c, STATE_POSE[state]) + card
    K, F3, F4 = c['K'], c['F3'], c['F4']
    pose = STATE_POSE[state]
    r = dict(O=K, B=c['F1'], A=F4)
    top = f'<g transform="translate(60 40) scale(.6) translate(-60 -62)">{head(c, acc, state)}</g>'
    return (
        f'<ellipse cx="60" cy="114" rx="26" ry="3.5" fill="{K}" opacity=".14"/>'
        f'<rect x="47" y="98" width="10" height="13" rx="4" fill="{K}"/>'
        f'<rect x="63" y="98" width="10" height="13" rx="4" fill="{K}"/>'
        + m.robo_arms(r, pose)
        + f'<rect x="40" y="66" width="40" height="36" rx="13" fill="{F3}" stroke="{K}" stroke-width="5"/>'
        f'<circle cx="60" cy="84" r="5" fill="{F4}" stroke="{K}" stroke-width="3"/>'
        + top
        + state_extra(c, state)
    )


def sticker_figure(c, acc, state='idle'):
    return m2.sticker(lambda rc: figure(rc, acc, state), c, 1.4, 1.8)


def sticker_head(c, acc, state='idle'):
    return m2.sticker(lambda rc: head(rc, acc, state), c)
