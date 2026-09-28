#!/usr/bin/env python3
"""Erzeugt die Beispielbilder fuer die Dokumentation.

Zeichnet denselben Aufbau wie die Karte (Ring, Knoten, Speichen, Punkt mit
Schweif) als statisches SVG und rendert es nach PNG.
"""
import math, os, sys
import cairosvg
import cairocffi as cairo

_measure_surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, 10, 10)
_measure_ctx = cairo.Context(_measure_surface)

def text_advance(text, font_size, bold=False):
    """Exakte Zeichenbreite über die Rendering-Bibliothek selbst — keine
    geschätzten Pro-Zeichen-Konstanten, die je nach verfügbarer Schriftart
    daneben liegen können."""
    _measure_ctx.select_font_face(
        "Roboto,Helvetica,Arial,sans-serif",
        cairo.FONT_SLANT_NORMAL,
        cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL,
    )
    _measure_ctx.set_font_size(font_size)
    return _measure_ctx.text_extents(text)[4]  # x_advance

BASE_VB = 1000
HUB_R, GAP = 44, 14                  # entspricht den Standardwerten der Karte ab 4.4.0
BASE_NODE_R, OVERLAP_GAP = 92, 0.9   # reine Geometrie statt Schätzfaktor: Radius darf
                                      # höchstens so groß werden, wie es der Abstand
                                      # zum Nachbarknoten erlaubt

# Optional nur einzelne Bilder erzeugen: python3 tools/render_examples.py example-soc-ring.png
ONLY = set(sys.argv[1:])

def clamp(v, lo, hi):
    return max(lo, min(hi, v))

DARK = dict(bg="#12161d", card="#1b2029", text="#e6eaf0", dim="#8b95a3",
            line="rgba(127,140,158,.30)", line_on="rgba(160,175,195,.55)",
            hub="#232936", hub_border="rgba(127,140,158,.42)", hub_glyph="#8b95a3")
LIGHT = dict(bg="#eef0f3", card="#ffffff", text="#1c1e21", dim="#6a7280",
             line="rgba(70,82,100,.22)", line_on="rgba(70,82,100,.45)",
             hub="#f4f5f7", hub_border="rgba(70,82,100,.28)", hub_glyph="#6a7280")

def U(a):
    r = math.radians(a)
    return math.cos(r), math.sin(r)

def icon(kind, soc=1.0):
    if kind == "solar":
        rays = "".join(
            f'<line x1="{U(i*45)[0]*12:.1f}" y1="{U(i*45)[1]*12:.1f}" '
            f'x2="{U(i*45)[0]*16.5:.1f}" y2="{U(i*45)[1]*16.5:.1f}"/>' for i in range(8))
        return '<circle cx="0" cy="0" r="8"/>' + rays
    if kind == "home":
        return '<path d="M-12,-1 L0,-11.5 L12,-1"/><path d="M-9.5,-1 V11 H9.5 V-1"/>'
    if kind == "grid":
        return ('<path d="M-8.5,13 L-3.5,-8.5 M8.5,13 L3.5,-8.5"/><path d="M-10.5,-8.5 H10.5"/>'
                '<path d="M-6,1.5 H6 M-4.5,7 H4.5"/><path d="M-3.5,-8.5 L0,-12.5 L3.5,-8.5"/>')
    if kind == "battery":
        bars = max(1, min(4, round(soc * 4)))
        inner = "".join(
            f'<rect x="{-7.4+2.4+i*3.55:.2f}" y="-2.7" width="2.6" height="5.4" rx="0.6" '
            f'fill="currentColor" stroke="none"/>' for i in range(bars))
        return ('<rect x="-9.4" y="-5.1" width="17" height="10.2" rx="2.2"/>'
                '<rect x="8.3" y="-1.8" width="1.5" height="3.6" rx="0.6" fill="currentColor" stroke="none"/>'
                + inner)
    if kind == "ev":
        return ('<path d="M-13,4 h26 v4.5 h-26 z"/><path d="M-10.5,4 L-7.5,-5.5 h15 L10.5,4"/>'
                '<circle cx="-7.5" cy="10" r="2.3"/><circle cx="7.5" cy="10" r="2.3"/>')
    if kind == "car":
        return ('<g transform="translate(0,-5)">'
                '<path d="M-9.5,1 L-7,-6.5 h14 L9.5,1"/><rect x="-11.5" y="1" width="23" height="7" rx="2"/>'
                '<circle cx="-6.5" cy="4.5" r="1.3" fill="currentColor" stroke="none"/>'
                '<circle cx="6.5" cy="4.5" r="1.3" fill="currentColor" stroke="none"/>'
                '<path d="M-8,8v2.5M8,8v2.5"/><path d="M1.5,10.5 L-1.5,13.5 h3 L-1.5,16.5"/></g>')
    if kind == "heatpump":
        return ('<rect x="-9.5" y="-6" width="19" height="12" rx="2.2"/><circle cx="-3" cy="0" r="3.6"/>'
                '<path d="M-3 0V-3.6M-3 0l3.1 1.8M-3 0l-3.1 1.8"/>'
                '<path d="M3.8,-2.4h3.6M3.8,0h3.6M3.8,2.4h3.6"/>')
    if kind == "wash":
        return ('<rect x="-10" y="-12" width="20" height="24" rx="3"/><circle cx="0" cy="2" r="6.5"/>'
                '<circle cx="-6" cy="-8" r="1.3" fill="currentColor" stroke="none"/>')
    if kind == "pool":
        return ('<path d="M-12,-2 q4,-4 8,0 t8,0"/><path d="M-12,5 q4,-4 8,0 t8,0"/>'
                '<path d="M-12,12 q4,-4 8,0 t8,0"/><path d="M-6,-6 V-12 M6,-6 V-12"/>')
    return '<circle cx="0" cy="0" r="8"/>'

def esc(text):
    return (str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))

def fmt(w):
    if abs(w) >= 1000:
        return f"{w/1000:.2f}".replace(".", ","), "kW"
    return f"{w:.0f}", "W"

def render(nodes, out, title=None, title_color=None, center=None, theme=DARK,
           show_names=True, ring_radius=320, node_size=1.0, width=560):
    if ONLY and os.path.basename(out) not in ONLY:
        return
    BG, CARD_BG = theme["bg"], theme["card"]
    TEXT, DIM = theme["text"], theme["dim"]
    LINE, LINE_ON = theme["line"], theme["line_on"]
    title_color = title_color or TEXT
    n = len(nodes)
    step = 360 / n

    # Direkte Übernahme der Werte, keine verdeckte Rückrechnung: die einzige
    # Grenze für die Knotengröße ist die reine Geometrie (Nachbarknoten dürfen
    # sich nicht berühren). Das Beschriftungsfeld ist an der Kartenbreite
    # orientiert, nicht an der Koordinatenfläche — sein Platzbedarf wächst
    # also mit VB mit. Deshalb wird die nötige Fläche aus dem tatsächlich
    # längsten Text dieses Bildes gelöst, statt mit einem festen Wert zu
    # schätzen (der bei langen Namen oder größerem VB Text abschneiden kann).
    ring_r = clamp(ring_radius, 140, 400)
    desired_r = BASE_NODE_R * clamp(node_size, 0.5, 1.8)
    no_overlap_r = ring_r * math.sin(math.pi / n) * OVERLAP_GAP
    node_r = min(desired_r, no_overlap_r)

    def text_width(nd):
        val, unit = fmt(nd["value"])
        w = text_advance(val, 44, bold=True) + 8 + text_advance(unit, 29)
        if show_names:
            w = max(w, text_advance(nd["name"], 26))
        return w

    max_text_w = max((text_width(nd) for nd in nodes), default=0)
    text_frac = min(max_text_w / BASE_VB, 0.45)   # Deckel gegen Division ins Negative bei sehr langen Namen
    node_extra = 1.12   # 12 % zusätzlicher Abstand Knotenrand -> Textanfang
    half = max(BASE_VB / 2, (ring_r + node_extra * node_r) / (1 - 2 * text_frac))
    VB = half * 2
    CX = CY = half

    stroke = max(5, node_r * 0.08)
    arc_r = node_r - stroke / 2
    circ = 2 * math.pi * arc_r

    parts = [f'<rect width="{VB}" height="{VB}" rx="34" fill="{CARD_BG}"/>']
    # Textgrößen sind wie bei der Karte an der physischen Kartenbreite orientiert,
    # nicht an der (variablen) Koordinatenfläche — deshalb mit VB mitskalieren.
    fs = VB / BASE_VB
    if title:
        parts.append(f'<text x="{42*fs:.1f}" y="{70*fs:.1f}" font-size="{40*fs:.1f}" font-weight="500" '
                     f'fill="{title_color}" font-family="Roboto,Helvetica,Arial,sans-serif">{esc(title)}</text>')

    lines, rings, labels, dots = [], [], [], []
    for i, nd in enumerate(nodes):
        a = -90 + i * step
        ux, uy = U(a)
        x1, y1 = CX + (HUB_R + GAP) * ux, CY + (HUB_R + GAP) * uy
        x2, y2 = CX + (ring_r - node_r - GAP) * ux, CY + (ring_r - node_r - GAP) * uy
        on = nd["value"] > 5
        lines.append(f'<path d="M{x1:.1f},{y1:.1f} L{x2:.1f},{y2:.1f}" fill="none" '
                     f'stroke="{LINE_ON if on else LINE}" stroke-width="4"/>')

        px, py = CX + ring_r * ux, CY + ring_r * uy
        pct = nd.get("pct", 1.0)
        rings.append(
            f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{arc_r:.1f}" fill="none" stroke="{nd["color"]}" '
            f'stroke-width="{stroke:.1f}" stroke-opacity="0.22"/>'
            f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{arc_r:.1f}" fill="none" stroke="{nd["color"]}" '
            f'stroke-width="{stroke:.1f}" stroke-linecap="round" '
            f'stroke-opacity="{0 if pct < 0.004 else 1}" '
            f'stroke-dasharray="{circ*pct:.1f} {circ:.1f}" transform="rotate(-90 {px:.1f} {py:.1f})"/>')

        # Ladestand eines Verbrauchers: Variante "ring" (innerer Ring) oder "battery"
        ev_soc, soc_mode = nd.get("ev_soc"), nd.get("soc_mode", "battery")
        soc_col = nd.get("soc_color", GREEN)
        if ev_soc is not None and soc_mode == "ring":
            s_stroke = stroke * 0.8
            s_r = arc_r - stroke / 2 - stroke * 0.6 - s_stroke / 2
            s_circ = 2 * math.pi * s_r
            rings.append(
                f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{s_r:.1f}" fill="none" stroke="{soc_col}" '
                f'stroke-width="{s_stroke:.1f}" stroke-opacity="0.22"/>'
                f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{s_r:.1f}" fill="none" stroke="{soc_col}" '
                f'stroke-width="{s_stroke:.1f}" stroke-linecap="round" '
                f'stroke-dasharray="{s_circ*ev_soc:.1f} {s_circ:.1f}" transform="rotate(-90 {px:.1f} {py:.1f})"/>')

        badge = ev_soc is not None and soc_mode in ("battery", "ring")
        scale = node_r * (0.78 if badge else 0.96) / 24
        iy = py - node_r * 0.16 if badge else py
        rings.append(
            f'<g transform="translate({px:.1f},{iy:.1f}) scale({scale:.3f})" fill="none" '
            f'stroke="{nd["color"]}" color="{nd["color"]}" stroke-width="1.6" '
            f'stroke-linecap="round" stroke-linejoin="round">{icon(nd["icon"], nd.get("soc",1))}</g>')
        if badge:
            txt = f"{round(ev_soc*100)} %"
            fsz = node_r * 0.28
            glyph = soc_mode == "battery"          # Ring-Variante: nur die Zahl
            bw, bh = (node_r * 0.44, node_r * 0.22) if glyph else (0, 0)
            gap = node_r * 0.06 if glyph else 0
            tw = text_advance(txt, fsz, bold=True)
            x0 = px - (bw + gap + tw) / 2
            by = py + node_r * 0.42
            k = bw / 24
            if glyph:
              rings.append(
                f'<g transform="translate({x0:.1f},{by - bh/2:.1f}) scale({k:.3f})" fill="none" '
                f'stroke="{soc_col}" stroke-width="1.4" stroke-linejoin="round">'
                f'<rect x="0.7" y="0.7" width="20.2" height="10.6" rx="2.2"/>'
                f'<rect x="21.4" y="3.8" width="1.9" height="4.4" rx="0.7" fill="{soc_col}" stroke="none"/>'
                f'<rect x="2.4" y="2.4" width="{17.2*ev_soc:.2f}" height="7.2" rx="0.9" fill="{soc_col}" stroke="none"/></g>')
            rings.append(
                f'<text x="{x0 + bw + gap:.1f}" y="{by + fsz*0.36:.1f}" font-size="{fsz:.1f}" font-weight="600" '
                f'fill="{soc_col}" font-family="Roboto,Helvetica,Arial,sans-serif">{txt}</text>')
        if nd.get("soc_text"):
            rings.append(f'<text x="{px:.1f}" y="{py+node_r*0.55:.1f}" text-anchor="middle" '
                         f'font-size="{node_r*0.3:.0f}" font-weight="600" fill="{nd["color"]}" '
                         f'font-family="Roboto,Helvetica,Arial,sans-serif">{nd["soc_text"]}</text>')

        if on:
            t = nd.get("phase", 0.55)
            if nd.get("inward"):
                t = 1 - t
            for k in range(6):
                tk = t - (k * 0.016 if not nd.get("inward") else -k * 0.016)
                if not 0 <= tk <= 1:
                    continue
                dx = x1 + (x2 - x1) * tk
                dy = y1 + (y2 - y1) * tk
                dots.append(f'<circle cx="{dx:.1f}" cy="{dy:.1f}" r="{8*(1-0.62*k/6):.1f}" '
                            f'fill="{nd["color"]}" opacity="{1-0.9*k/6:.2f}"/>')

        vertical = abs(ux) < 0.25
        anchor = "middle" if vertical else ("start" if ux > 0 else "end")
        if vertical:
            lx = px
            ly = py + node_r + 52 * fs if uy > 0 else py - node_r - (72 if show_names else 34) * fs
        else:
            # Derselbe Abstand, der auch in die Flächengleichung oben eingeht —
            # sonst passt die Reservierung nicht zur tatsächlichen Position.
            lx = px + (node_r * node_extra) * (1 if ux > 0 else -1)
            ly = py - 2 * fs if show_names else py + 14 * fs
        val, unit = fmt(nd["value"])
        vw, uw = text_advance(val, 44 * fs, bold=True), text_advance(unit, 29 * fs)
        if anchor == "start":
            vx, uxp, va, ua = lx, lx + vw + 8 * fs, "start", "start"
        elif anchor == "end":
            vx, uxp, va, ua = lx - uw - 8 * fs, lx, "end", "end"
        else:
            total = vw + 8 * fs + uw
            vx, uxp, va, ua = lx - total / 2, lx - total / 2 + vw + 8 * fs, "start", "start"
        labels.append(
            f'<text x="{vx:.1f}" y="{ly:.1f}" text-anchor="{va}" font-size="{44*fs:.1f}" font-weight="600" '
            f'fill="{TEXT}" font-family="Roboto,Helvetica,Arial,sans-serif">{val}</text>'
            f'<text x="{uxp:.1f}" y="{ly:.1f}" text-anchor="{ua}" font-size="{29*fs:.1f}" fill="{DIM}" '
            f'font-family="Roboto,Helvetica,Arial,sans-serif">{unit}</text>')
        if show_names:
            labels.append(f'<text x="{lx:.1f}" y="{ly+34*fs:.1f}" text-anchor="{anchor}" font-size="{26*fs:.1f}" '
                          f'fill="{DIM}" font-family="Roboto,Helvetica,Arial,sans-serif">{esc(nd["name"])}</text>')

    bolt = (f'<path d="M{CX+11},{CY-17} L{CX-13},{CY+2} H{CX-2} L{CX-9},{CY+18} L{CX+15},{CY-1} H{CX+3} Z" '
            f'fill="none" stroke="{"#fff" if center else theme["hub_glyph"]}" stroke-width="3.4" '
            f'stroke-linejoin="round"/>')
    hub = (f'<circle cx="{CX}" cy="{CY}" r="{HUB_R}" fill="{center or theme["hub"]}" '
           f'stroke="{"none" if center else theme["hub_border"]}" stroke-width="2"/>' + bolt)

    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VB} {VB}" width="{VB}" height="{VB}">'
           + "".join(parts) + "".join(lines) + "".join(rings) + hub + "".join(dots) + "".join(labels) + "</svg>")
    cairosvg.svg2png(bytestring=svg.encode(), write_to=out, output_width=width, output_height=width,
                     background_color=BG)
    print("->", out)

AMBER, BLUE, GREEN, GREY = "#f0b429", "#4cb5e0", "#5cc47a", "#8e98a4"
PURPLE, ORANGE, TEAL, DBLUE, PINK = "#a97bd6", "#e8833a", "#5fb0a8", "#4c8ad9", "#d1637f"
LIME, RED = "#7f9f3a", "#c76a4e"

here = os.path.dirname(os.path.abspath(__file__))
outdir = os.path.join(here, "..", "docs", "images")
os.makedirs(outdir, exist_ok=True)
p = lambda f: os.path.join(outdir, f)

N = lambda name, icon, color, value, **kw: dict(name=name, icon=icon, color=color, value=value, **kw)

# 1 Minimal: PV, Haus, Netz
render([
    N("PV", "solar", AMBER, 3820, pct=0.42, inward=True, phase=0.6),
    N("Haus", "home", BLUE, 1240, phase=0.45),
    N("Netz", "grid", GREY, 2580, phase=0.35),
], p("example-minimal.png"), title="Energie")

# 2 Standard: sechs Knoten
render([
    N("PV", "solar", AMBER, 7560, pct=0.76, inward=True, phase=0.72),
    N("Haus", "home", BLUE, 1870, phase=0.5),
    N("Wallbox", "ev", PURPLE, 0, pct=0.0),
    N("Wärmepumpe", "heatpump", ORANGE, 1450, phase=0.4),
    N("Speicher", "battery", GREEN, 2400, pct=0.72, soc=0.72, soc_text="72 %", phase=0.55),
    N("Netz", "grid", GREY, 1840, phase=0.6),
], p("example-standard.png"), title="Energiefluss")

# 3 Viele Verbraucher
render([
    N("PV", "solar", AMBER, 9240, pct=0.92, inward=True, phase=0.8),
    N("Haus", "home", BLUE, 640, phase=0.5),
    N("Wallbox", "ev", PURPLE, 7200, phase=0.62),
    N("Wärmepumpe", "heatpump", ORANGE, 980, phase=0.45),
    N("Waschküche", "wash", TEAL, 620, phase=0.4),
    N("Pool", "pool", DBLUE, 310, phase=0.3),
    N("Büro", "home", PINK, 0, pct=0.0),
    N("Speicher", "battery", GREEN, 1100, pct=0.38, soc=0.38, soc_text="38 %", phase=0.5),
    N("Netz", "grid", GREY, 1430, inward=True, phase=0.55),
], p("example-large.png"), title="Hausübersicht")

# 4 Kompakt: ohne Namen, ohne Titel
render([
    N("PV", "solar", AMBER, 4480, pct=0.45, inward=True, phase=0.6),
    N("Haus", "home", BLUE, 1320, phase=0.5),
    N("Speicher", "battery", GREEN, 2100, pct=0.64, soc=0.64, soc_text="64 %", phase=0.45),
    N("Netz", "grid", GREY, 1060, phase=0.4),
], p("example-compact.png"), show_names=False, node_size=1.1)

# 5 Nacht: keine Erzeugung, Speicher versorgt das Haus
render([
    N("PV", "solar", AMBER, 0, pct=0.0),
    N("Haus", "home", BLUE, 940, phase=0.5),
    N("Wärmepumpe", "heatpump", ORANGE, 1180, phase=0.42),
    N("Speicher", "battery", GREEN, 2120, pct=0.31, soc=0.31, soc_text="31 %",
      inward=True, phase=0.6),
    N("Netz", "grid", GREY, 0, pct=0.0),
], p("example-night.png"), title="Nachts")

# 6 Laden: Überschuss geht in Speicher und Wallbox
render([
    N("PV", "solar", AMBER, 8900, pct=0.89, inward=True, phase=0.75),
    N("Haus", "home", BLUE, 520, phase=0.5),
    N("Wallbox", "ev", PURPLE, 4200, phase=0.55),
    N("Speicher", "battery", GREEN, 3600, pct=0.54, soc=0.54, soc_text="54 %", phase=0.5),
    N("Netz", "grid", GREY, 580, phase=0.35),
], p("example-charging.png"), title="Überschuss")

# 7 Heizung: mehrere Kreise mit eigenem Icon-Satz
render([
    N("PV", "solar", AMBER, 2140, pct=0.21, inward=True, phase=0.55),
    N("Haus", "home", BLUE, 430, phase=0.5),
    N("Wärmepumpe", "heatpump", ORANGE, 2450, phase=0.6),
    N("Heizstab", "heatpump", RED, 0, pct=0.0),
    N("Fußboden", "pool", LIME, 180, phase=0.3),
    N("Netz", "grid", GREY, 2920, inward=True, phase=0.65),
], p("example-heating.png"), title="Heizung")

# 8 Helles Thema
render([
    N("PV", "solar", "#e0a020", 5120, pct=0.51, inward=True, phase=0.65),
    N("Haus", "home", "#2f95c4", 980, phase=0.5),
    N("Wallbox", "ev", "#8c5cc0", 1600, phase=0.45),
    N("Speicher", "battery", "#3f9e5c", 3200, pct=0.88, soc=0.88, soc_text="88 %", phase=0.5),
    N("Netz", "grid", "#6f7883", 940, phase=0.4),
], p("example-light.png"), title="Helles Thema", theme=LIGHT)

# 9 Zwei Knoten: der engste sinnvolle Fall
render([
    N("PV", "solar", AMBER, 2860, pct=0.29, inward=True, phase=0.6),
    N("Haus", "home", BLUE, 2860, phase=0.5),
], p("example-two-nodes.png"), title="Minimalfall")

# 10 Zwölf Knoten: die praktische Obergrenze
render([
    N("PV", "solar", AMBER, 6200, pct=0.62, inward=True, phase=0.7),
    N("Haus", "home", BLUE, 480, phase=0.5),
    N("Wallbox", "ev", PURPLE, 3600, phase=0.55),
    N("Wärmepumpe", "heatpump", ORANGE, 890, phase=0.4),
    N("Waschküche", "wash", TEAL, 410, phase=0.35),
    N("Trockner", "wash", "#7aa8d1", 0, pct=0.0),
    N("Pool", "pool", DBLUE, 260, phase=0.3),
    N("Büro", "home", PINK, 190, phase=0.28),
    N("Sauna", "heatpump", RED, 0, pct=0.0),
    N("Werkstatt", "home", LIME, 340, phase=0.32),
    N("Speicher", "battery", GREEN, 1450, pct=0.42, soc=0.42, soc_text="42 %", phase=0.45),
    N("Netz", "grid", GREY, 780, phase=0.38),
], p("example-twelve-nodes.png"), title="Zwölf Knoten", node_size=0.85)

# 11 Wallbox mit Ladestand des Autos, Variante 1: Batteriesymbol im Knoten
render([
    N("PV", "solar", AMBER, 6200, pct=0.62, inward=True, phase=0.7),
    N("Haus", "home", BLUE, 1480, phase=0.5),
    N("Wallbox", "car", PURPLE, 3700, pct=0.34, ev_soc=0.64, soc_mode="battery", phase=0.55),
    N("Speicher", "battery", GREEN, 1200, pct=0.72, soc=0.72, soc_text="72 %", phase=0.45),
    N("Netz", "grid", GREY, 180, phase=0.35),
], p("example-soc-battery.png"), title="Wallbox")

# 12 Dasselbe, Variante 2: innerer Ring (voll = 100 %), eigene Farbe
render([
    N("PV", "solar", AMBER, 6200, pct=0.62, inward=True, phase=0.7),
    N("Haus", "home", BLUE, 1480, phase=0.5),
    N("Wallbox", "car", PURPLE, 3700, pct=0.34, ev_soc=0.64, soc_mode="ring",
      soc_color=BLUE, phase=0.55),
    N("Speicher", "battery", GREEN, 1200, pct=0.72, soc=0.72, soc_text="72 %", phase=0.45),
    N("Netz", "grid", GREY, 180, phase=0.35),
], p("example-soc-ring.png"), title="Wallbox")

# Titelbild
render([
    N("PV", "solar", AMBER, 5120, pct=0.51, inward=True, phase=0.65),
    N("Haus", "home", BLUE, 980, phase=0.5),
    N("Speicher", "battery", GREEN, 3200, pct=0.88, soc=0.88, soc_text="88 %", phase=0.5),
    N("Netz", "grid", GREY, 940, phase=0.45),
], p("hero.png"), show_names=False, node_size=1.1, width=640)
