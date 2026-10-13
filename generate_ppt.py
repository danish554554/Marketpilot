"""
MarketPilot AI – Professional Internship Presentation Generator
Color scheme extracted from MarketPilot brand tokens:
  - Forest Green  #165823  (primary brand)
  - Dark Green    #0d4820  (deep accent)
  - Light Green   #23834b  (highlight)
  - Navy          #101a2d  (dark bg / deep contrast)
  - Ink           #17233a  (body text)
  - Muted         #77849a  (secondary text)
  - Canvas        #f5f8f7  (light background)
  - Line          #e4eae8  (subtle dividers)
  - Pale Green    #eaf5ee  (soft fill)
  - Blue          #2867d7  (link / CTA accent)
"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
from pptx.oxml.ns import qn
import copy
from lxml import etree

# ── Brand Colors ──────────────────────────────────────────────────────────────
C_GREEN        = RGBColor(0x16, 0x58, 0x23)   # #165823
C_GREEN_DARK   = RGBColor(0x0D, 0x48, 0x20)   # #0d4820
C_GREEN_LIGHT  = RGBColor(0x23, 0x83, 0x4B)   # #23834b
C_NAVY         = RGBColor(0x10, 0x1A, 0x2D)   # #101a2d
C_INK          = RGBColor(0x17, 0x23, 0x3A)   # #17233a
C_MUTED        = RGBColor(0x77, 0x84, 0x9A)   # #77849a
C_CANVAS       = RGBColor(0xF5, 0xF8, 0xF7)   # #f5f8f7
C_LINE         = RGBColor(0xE4, 0xEA, 0xE8)   # #e4eae8
C_PALE         = RGBColor(0xEA, 0xF5, 0xEE)   # #eaf5ee
C_BLUE         = RGBColor(0x28, 0x67, 0xD7)   # #2867d7
C_WHITE        = RGBColor(0xFF, 0xFF, 0xFF)
C_AMBER        = RGBColor(0xF5, 0x9E, 0x0B)   # accent for highlights

# ── Slide dimensions (16:9 widescreen) ───────────────────────────────────────
W = Inches(13.33)
H = Inches(7.5)

prs = Presentation()
prs.slide_width  = W
prs.slide_height = H

blank_layout = prs.slide_layouts[6]   # completely blank


# ══════════════════════════════════════════════════════════════════════════════
# Helper functions
# ══════════════════════════════════════════════════════════════════════════════

def rgb_to_hex(rgb: RGBColor) -> str:
    return f"{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"


def add_rect(slide, left, top, width, height, fill_color=None, line_color=None, line_width=None):
    shape = slide.shapes.add_shape(
        1,  # MSO_SHAPE_TYPE.RECTANGLE
        left, top, width, height
    )
    shape.line.fill.background()  # no line by default
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if line_color:
        shape.line.color.rgb = line_color
        if line_width:
            shape.line.width = line_width
        else:
            shape.line.fill.background()
    return shape


def add_text_box(slide, text, left, top, width, height,
                 font_name="Calibri", font_size=18, bold=False,
                 color=C_INK, align=PP_ALIGN.LEFT, wrap=True):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.color.rgb = color
    return txBox


def add_bullet_box(slide, items, left, top, width, height,
                   font_name="Calibri", font_size=16,
                   color=C_INK, dot_color=C_GREEN, indent=0.18):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_before = Pt(4)
        p.space_after = Pt(2)
        # bullet dot
        run_dot = p.add_run()
        run_dot.text = "●  "
        run_dot.font.name = font_name
        run_dot.font.size = Pt(font_size - 2)
        run_dot.font.color.rgb = dot_color
        # bullet text
        run = p.add_run()
        run.text = item
        run.font.name = font_name
        run.font.size = Pt(font_size)
        run.font.color.rgb = color
    return txBox


def add_rounded_rect(slide, left, top, width, height,
                     fill_color=C_PALE, corner_size=Pt(8),
                     line_color=None, line_width=None):
    """Add a rounded rectangle shape."""
    shape = slide.shapes.add_shape(
        5,  # ROUNDED_RECTANGLE
        left, top, width, height
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.fill.background()
    if line_color:
        shape.line.color.rgb = line_color
    # adjust corner rounding via XML
    sp = shape.element
    spPr = sp.find(qn('p:spPr'))
    prstGeom = spPr.find(qn('a:prstGeom'))
    if prstGeom is not None:
        avLst = prstGeom.find(qn('a:avLst'))
        if avLst is not None:
            for gd in avLst.findall(qn('a:gd')):
                if gd.get('name') == 'adj':
                    gd.set('fmla', 'val 12000')  # tighter radius
    return shape


def hex_bar(slide, y_frac=0.0, height_inches=0.08, color=C_GREEN):
    """Add a full-width decorative top or bottom bar."""
    shape = slide.shapes.add_shape(1,
        Inches(0), Inches(y_frac),
        W, Inches(height_inches))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


def section_tag(slide, label, left, top, bg=C_GREEN, fg=C_WHITE,
                font_size=9, width=Inches(1.6), height=Inches(0.28)):
    """Small colored pill label."""
    pill = slide.shapes.add_shape(5, left, top, width, height)
    pill.fill.solid()
    pill.fill.fore_color.rgb = bg
    pill.line.fill.background()
    tf = pill.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = label.upper()
    run.font.name = "Calibri"
    run.font.size = Pt(font_size)
    run.font.bold = True
    run.font.color.rgb = fg
    # vertical centering
    tf.margin_top = Pt(2)
    tf.margin_bottom = Pt(2)
    return pill


def divider_line(slide, y, color=C_LINE, width_frac=1.0):
    """Thin horizontal rule."""
    shape = slide.shapes.add_shape(1,
        Inches(0.5), y,
        Inches(12.33 * width_frac), Inches(0.018))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


def add_icon_circle(slide, label, left, top, radius=Inches(0.45),
                    bg=C_GREEN, fg=C_WHITE, font_size=16):
    """Circular icon placeholder with a text label."""
    circle = slide.shapes.add_shape(
        9,  # OVAL
        left, top, radius * 2, radius * 2)
    circle.fill.solid()
    circle.fill.fore_color.rgb = bg
    circle.line.fill.background()
    tf = circle.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = label
    run.font.name = "Calibri"
    run.font.size = Pt(font_size)
    run.font.bold = True
    run.font.color.rgb = fg
    tf.margin_top = Pt(4)
    return circle


def add_numbered_step(slide, number, title, left, top, width=Inches(2.6)):
    """Vertical card: large number + title."""
    card = add_rounded_rect(slide, left, top, width, Inches(1.4), fill_color=C_PALE)
    # number
    n_box = slide.shapes.add_textbox(left + Inches(0.18), top + Inches(0.08),
                                      Inches(0.6), Inches(0.55))
    nf = n_box.text_frame
    np_ = nf.paragraphs[0]
    nr = np_.add_run()
    nr.text = str(number)
    nr.font.name = "Calibri"
    nr.font.size = Pt(32)
    nr.font.bold = True
    nr.font.color.rgb = C_GREEN
    # title
    t_box = slide.shapes.add_textbox(left + Inches(0.18), top + Inches(0.7),
                                      width - Inches(0.36), Inches(0.6))
    tf2 = t_box.text_frame
    tf2.word_wrap = True
    p2 = tf2.paragraphs[0]
    r2 = p2.add_run()
    r2.text = title
    r2.font.name = "Calibri"
    r2.font.size = Pt(12)
    r2.font.bold = True
    r2.font.color.rgb = C_INK


def column_card(slide, title, items, left, top, width=Inches(3.6), height=Inches(4.8),
                header_bg=C_GREEN, dot_color=C_GREEN_LIGHT):
    """Card with colored header strip and bullet list."""
    # card background
    card = add_rounded_rect(slide, left, top, width, height, fill_color=C_WHITE, line_color=C_LINE)
    # header bar
    hdr = slide.shapes.add_shape(5, left, top, width, Inches(0.5))
    hdr.fill.solid()
    hdr.fill.fore_color.rgb = header_bg
    hdr.line.fill.background()
    # fix top-left radius of card header (cosmetic)
    t_box = slide.shapes.add_textbox(left + Inches(0.18), top + Inches(0.08),
                                      width - Inches(0.36), Inches(0.38))
    tf = t_box.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = title
    run.font.name = "Calibri"
    run.font.size = Pt(13)
    run.font.bold = True
    run.font.color.rgb = C_WHITE
    # bullets
    add_bullet_box(slide, items,
                   left + Inches(0.15), top + Inches(0.56),
                   width - Inches(0.3), height - Inches(0.65),
                   font_size=12, color=C_INK, dot_color=dot_color)


def stat_box(slide, value, label, left, top, width=Inches(2.4), height=Inches(1.2),
             accent=C_GREEN):
    """Metric card: big number + caption."""
    card = add_rounded_rect(slide, left, top, width, height, fill_color=C_PALE, line_color=C_LINE)
    v_box = slide.shapes.add_textbox(left + Inches(0.12), top + Inches(0.08),
                                      width - Inches(0.24), Inches(0.65))
    tf = v_box.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = value
    run.font.name = "Calibri"
    run.font.size = Pt(34)
    run.font.bold = True
    run.font.color.rgb = accent
    l_box = slide.shapes.add_textbox(left + Inches(0.12), top + Inches(0.78),
                                      width - Inches(0.24), Inches(0.38))
    tf2 = l_box.text_frame
    p2 = tf2.paragraphs[0]
    p2.alignment = PP_ALIGN.CENTER
    run2 = p2.add_run()
    run2.text = label
    run2.font.name = "Calibri"
    run2.font.size = Pt(11)
    run2.font.color.rgb = C_MUTED


def flow_arrow(slide, x, y, length=Inches(0.4), color=C_MUTED):
    """Small right-pointing arrow."""
    shape = slide.shapes.add_shape(13,  # RIGHT_ARROW
        x, y, length, Inches(0.22))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 1 – COVER
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)

# Full dark background
bg = add_rect(slide, 0, 0, W, H, fill_color=C_NAVY)

# Decorative diagonal accent shapes (top-right)
accent1 = slide.shapes.add_shape(5,
    Inches(9.5), Inches(-1.0), Inches(5.0), Inches(4.5))
accent1.fill.solid()
accent1.fill.fore_color.rgb = C_GREEN_DARK
accent1.line.fill.background()

accent2 = slide.shapes.add_shape(5,
    Inches(10.8), Inches(-0.4), Inches(4.0), Inches(3.2))
accent2.fill.solid()
accent2.fill.fore_color.rgb = C_GREEN
accent2.line.fill.background()

# Subtle bottom-left accent
bl = add_rect(slide, 0, Inches(5.8), Inches(3.0), Inches(2.0), fill_color=C_GREEN_DARK)

# Green accent bar
hex_bar(slide, y_frac=6.8, height_inches=0.08, color=C_GREEN)

# Logo / Product name pill
section_tag(slide, "INTERNSHIP PROJECT", Inches(0.65), Inches(1.8),
            bg=C_GREEN, fg=C_WHITE, font_size=9, width=Inches(2.2), height=Inches(0.3))

# Main title
add_text_box(slide, "MarketPilot AI",
             Inches(0.65), Inches(2.2), Inches(8.5), Inches(1.3),
             font_name="Calibri", font_size=60, bold=True,
             color=C_WHITE, align=PP_ALIGN.LEFT)

# Sub-title
add_text_box(slide, "Autonomous E-Commerce Marketing Intelligence Platform",
             Inches(0.65), Inches(3.35), Inches(9.0), Inches(0.6),
             font_name="Calibri", font_size=20, bold=False,
             color=C_GREEN_LIGHT, align=PP_ALIGN.LEFT)

# Horizontal rule
divider_line(slide, Inches(4.1), color=C_GREEN_LIGHT, width_frac=0.65)

# Meta info row
add_text_box(slide, "Presented by: Danish Riaz  ·  Internship Final Presentation  ·  2026",
             Inches(0.65), Inches(4.25), Inches(9.0), Inches(0.4),
             font_name="Calibri", font_size=12, bold=False,
             color=C_MUTED, align=PP_ALIGN.LEFT)

# Stack: Frontend / Backend / AI
for i, tech in enumerate(["React 18 + TypeScript", "FastAPI + Pydantic v2", "Google Gemini Flash"]):
    x = Inches(0.65 + i * 3.6)
    pill = slide.shapes.add_shape(5, x, Inches(5.0), Inches(3.2), Inches(0.35))
    pill.fill.solid()
    pill.fill.fore_color.rgb = RGBColor(0x1E, 0x3A, 0x2A)
    pill.line.color.rgb = C_GREEN_LIGHT
    tf = pill.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = tech
    r.font.name = "Calibri"
    r.font.size = Pt(11)
    r.font.color.rgb = C_GREEN_LIGHT
    tf.margin_top = Pt(3)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 2 – PROJECT OVERVIEW
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_CANVAS)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN)

section_tag(slide, "Overview", Inches(0.65), Inches(0.2), width=Inches(1.2))
add_text_box(slide, "Project Overview", Inches(0.65), Inches(0.55),
             Inches(8), Inches(0.65), font_size=36, bold=True, color=C_INK)
divider_line(slide, Inches(1.3), color=C_GREEN, width_frac=0.9)

# Large left description
add_text_box(slide,
    "An AI-powered web platform that transforms e-commerce data into ready-to-use "
    "marketing strategies, content plans, and copywriting assets — with zero hallucinations.",
    Inches(0.65), Inches(1.45), Inches(5.8), Inches(1.1),
    font_size=15, color=C_MUTED)

# 4 key stat boxes
stats = [
    ("4", "Backend Modules"),
    ("109", "Pytest Tests"),
    ("5+", "Content Formats"),
    ("2", "Live Deployments"),
]
for i, (val, lbl) in enumerate(stats):
    stat_box(slide, val, lbl,
             Inches(0.65 + i * 3.12), Inches(2.7),
             width=Inches(2.8), height=Inches(1.3))

# What it does section
add_text_box(slide, "What MarketPilot AI Does",
             Inches(0.65), Inches(4.2), Inches(6), Inches(0.4),
             font_size=16, bold=True, color=C_INK)
bullets = [
    "Reads your brand, products & margins",
    "Pulls live viral trend signals",
    "Generates strategic 7/30-day content plans",
    "Writes captions, scripts, ad copy & newsletters",
    "Exports to CSV, Markdown, JSON",
]
add_bullet_box(slide, bullets,
               Inches(0.65), Inches(4.7), Inches(11.8), Inches(2.2),
               font_size=13, color=C_INK, dot_color=C_GREEN)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 3 – PROBLEM STATEMENT
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_NAVY)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN_DARK)

# Accent shapes
accent = slide.shapes.add_shape(9, Inches(10.5), Inches(1.0), Inches(3.5), Inches(3.5))
accent.fill.solid()
accent.fill.fore_color.rgb = RGBColor(0x14, 0x3D, 0x1C)
accent.line.fill.background()

section_tag(slide, "Problem", Inches(0.65), Inches(0.2), width=Inches(1.1))
add_text_box(slide, "The Problem", Inches(0.65), Inches(0.58),
             Inches(10), Inches(0.65), font_size=36, bold=True, color=C_WHITE)
divider_line(slide, Inches(1.32), color=C_GREEN_LIGHT, width_frac=0.6)

problems = [
    ("Manual & Time-Consuming", "Content planning takes hours without systematic tools"),
    ("No Profit Intelligence", "Platforms ignore margins — promoting wrong products"),
    ("Trend-Blind Strategies", "Static plans miss real-time viral opportunities"),
    ("AI Hallucinations", "Generic AI tools invent prices, specs & claims"),
    ("No Structured Workflow", "No approval, review or export pipeline"),
]

for i, (title, desc) in enumerate(problems):
    y = Inches(1.6 + i * 1.1)
    # number pill
    n_pill = slide.shapes.add_shape(9, Inches(0.65), y + Inches(0.05),
                                     Inches(0.42), Inches(0.42))
    n_pill.fill.solid()
    n_pill.fill.fore_color.rgb = C_GREEN
    n_pill.line.fill.background()
    nt = n_pill.text_frame
    np_ = nt.paragraphs[0]
    np_.alignment = PP_ALIGN.CENTER
    nr = np_.add_run()
    nr.text = str(i + 1)
    nr.font.name = "Calibri"
    nr.font.size = Pt(13)
    nr.font.bold = True
    nr.font.color.rgb = C_WHITE
    nt.margin_top = Pt(4)

    add_text_box(slide, title,
                 Inches(1.25), y, Inches(4.5), Inches(0.35),
                 font_size=14, bold=True, color=C_WHITE)
    add_text_box(slide, desc,
                 Inches(1.25), y + Inches(0.36), Inches(8.5), Inches(0.55),
                 font_size=12, color=C_MUTED)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 4 – TECH STACK
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_CANVAS)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN)

section_tag(slide, "Tech Stack", Inches(0.65), Inches(0.2), width=Inches(1.3))
add_text_box(slide, "Technology Stack", Inches(0.65), Inches(0.55),
             Inches(10), Inches(0.65), font_size=36, bold=True, color=C_INK)
divider_line(slide, Inches(1.32), color=C_GREEN, width_frac=0.9)

# 3-column layout: Frontend | Backend | Infrastructure
cols = [
    ("Frontend", C_GREEN, [
        "React 18 + Vite",
        "TypeScript",
        "Tailwind CSS",
        "Axios + Interceptors",
        "React Router v6",
        "Context API",
    ]),
    ("Backend", C_NAVY, [
        "FastAPI (Python 3.12)",
        "Pydantic v2",
        "Supabase (PostgreSQL)",
        "Row-Level Security (RLS)",
        "Google Gemini Flash",
        "SMTP Email (SSL)",
    ]),
    ("Infrastructure", C_BLUE, [
        "Vercel (Frontend)",
        "Render (API)",
        "Supabase Auth",
        "JWT Sessions",
        "CORS Middleware",
        "RSS Feed Aggregator",
    ]),
]

for i, (title, color, items) in enumerate(cols):
    column_card(slide, title, items,
                Inches(0.55 + i * 4.27), Inches(1.55),
                width=Inches(3.95), height=Inches(5.5),
                header_bg=color)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 5 – SYSTEM ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_CANVAS)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN)

section_tag(slide, "Architecture", Inches(0.65), Inches(0.2), width=Inches(1.5))
add_text_box(slide, "3-Tier System Architecture", Inches(0.65), Inches(0.55),
             Inches(10), Inches(0.65), font_size=36, bold=True, color=C_INK)
divider_line(slide, Inches(1.32), color=C_GREEN, width_frac=0.9)

# Horizontal 3-layer flow diagram
layers = [
    ("01", "Presentation Layer", C_BLUE, [
        "React 18 SPA",
        "TypeScript Components",
        "Tailwind CSS Design System",
        "Real-time Auth Sync",
    ]),
    ("02", "Orchestration Layer", C_GREEN, [
        "FastAPI REST API",
        "Pydantic v2 Validation",
        "JWT Bearer Auth",
        "Background Workers",
    ]),
    ("03", "Intelligence & Data Layer", C_NAVY, [
        "Google Gemini Flash LLM",
        "Supabase PostgreSQL",
        "Row-Level Security",
        "RSS Trend Feeds",
    ]),
]

for i, (num, title, color, bullets) in enumerate(layers):
    lx = Inches(0.5 + i * 4.27)
    ly = Inches(1.6)
    lw = Inches(3.95)
    lh = Inches(5.2)

    card = add_rounded_rect(slide, lx, ly, lw, lh, fill_color=C_WHITE, line_color=C_LINE)

    # colored left accent bar
    bar = slide.shapes.add_shape(1, lx, ly, Inches(0.12), lh)
    bar.fill.solid()
    bar.fill.fore_color.rgb = color
    bar.line.fill.background()

    # layer number
    add_text_box(slide, num, lx + Inches(0.22), ly + Inches(0.15),
                 Inches(0.7), Inches(0.55), font_size=28, bold=True, color=color)
    add_text_box(slide, title, lx + Inches(0.22), ly + Inches(0.7),
                 lw - Inches(0.4), Inches(0.5),
                 font_size=14, bold=True, color=C_INK)
    divider_line(slide, ly + Inches(1.28), color=C_LINE, width_frac=0.275)

    add_bullet_box(slide, bullets, lx + Inches(0.22), ly + Inches(1.4),
                   lw - Inches(0.4), lh - Inches(1.6),
                   font_size=13, color=C_INK, dot_color=color)

    # arrows between layers
    if i < 2:
        arr = slide.shapes.add_shape(13,  # RIGHT_ARROW
            lx + lw, ly + Inches(2.3), Inches(0.32), Inches(0.28))
        arr.fill.solid()
        arr.fill.fore_color.rgb = C_MUTED
        arr.line.fill.background()


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 6 – MODULE ARCHITECTURE (Build Sequence)
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_NAVY)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN_DARK)

section_tag(slide, "Modules", Inches(0.65), Inches(0.2), width=Inches(1.1))
add_text_box(slide, "Backend Module Architecture", Inches(0.65), Inches(0.55),
             Inches(10), Inches(0.65), font_size=36, bold=True, color=C_WHITE)
divider_line(slide, Inches(1.32), color=C_GREEN_LIGHT, width_frac=0.85)

modules = [
    ("M1", "Foundation & Auth", C_GREEN),
    ("M2", "Business Workspace", C_GREEN_LIGHT),
    ("M3", "Brand Kit", C_GREEN_LIGHT),
    ("M4", "Product Catalogue", C_BLUE),
    ("M5", "Trend Intelligence", C_BLUE),
    ("M6", "LLM Orchestration", C_AMBER),
    ("M7", "Content Planner", C_AMBER),
    ("M8", "Content Studio", C_AMBER),
    ("M9", "Review & Export", C_MUTED),
    ("M10", "Admin Dashboard", C_MUTED),
]

# Two rows of 5
for i, (code, name, color) in enumerate(modules):
    row = i // 5
    col = i % 5
    bx = Inches(0.55 + col * 2.55)
    by = Inches(1.65 + row * 2.5)

    card = add_rounded_rect(slide, bx, by, Inches(2.35), Inches(2.0),
                             fill_color=RGBColor(0x17, 0x28, 0x3E))
    # top accent strip
    strip = slide.shapes.add_shape(1, bx, by, Inches(2.35), Inches(0.08))
    strip.fill.solid()
    strip.fill.fore_color.rgb = color
    strip.line.fill.background()

    add_text_box(slide, code, bx + Inches(0.12), by + Inches(0.15),
                 Inches(0.9), Inches(0.48), font_size=22, bold=True, color=color)
    add_text_box(slide, name, bx + Inches(0.12), by + Inches(0.68),
                 Inches(2.1), Inches(0.65), font_size=11, bold=False, color=C_WHITE)

    # status badge
    if i <= 3:
        status_txt = "✓ Built"
        s_color = C_GREEN_LIGHT
    elif i == 4:
        status_txt = "✓ Built"
        s_color = C_BLUE
    elif i == 5:
        status_txt = "✓ Built"
        s_color = C_AMBER
    elif 6 <= i <= 7:
        status_txt = "✓ Built"
        s_color = C_AMBER
    elif i == 8:
        status_txt = "✓ Built"
        s_color = C_MUTED
    else:
        status_txt = "Partial"
        s_color = C_MUTED

    add_text_box(slide, status_txt, bx + Inches(0.12), by + Inches(1.4),
                 Inches(2.1), Inches(0.35), font_size=10, bold=True, color=s_color)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 7 – KEY FEATURES
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_CANVAS)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN)

section_tag(slide, "Features", Inches(0.65), Inches(0.2), width=Inches(1.1))
add_text_box(slide, "Key Features", Inches(0.65), Inches(0.55),
             Inches(10), Inches(0.65), font_size=36, bold=True, color=C_INK)
divider_line(slide, Inches(1.32), color=C_GREEN, width_frac=0.9)

features = [
    ("🧠", "Margin-Aware AI Strategy",
     ["Hero Awareness campaigns", "Direct Response Acquisition", "Trend Velocity plans", "VIP Retention flows"]),
    ("📈", "Real-Time Trend Intelligence",
     ["Live RSS feed aggregation", "Velocity confidence scores", "Catalog-trend matching", "Freshness labelling"]),
    ("✍️", "Multi-Format Content Studio",
     ["Social captions + hooks", "5-slide carousels", "Video scripts (timed)", "Email newsletters", "WhatsApp broadcasts"]),
    ("🛡️", "Brand Guardrails",
     ["Regex + LLM safety checks", "Prohibited word enforcement", "Grounded catalog ingestion", "No hallucinated specs"]),
    ("🔒", "Auth & Session Security",
     ["6-digit email OTP", "4-hr inactivity timeout", "Multi-tab sync logout", "Global 401 interceptor"]),
    ("📦", "Multi-Format Export",
     ["Markdown campaign briefs", "CSV copywriting sheets", "JSON data portability"]),
]

for i, (icon, title, pts) in enumerate(features):
    row = i // 3
    col = i % 3
    fx = Inches(0.5 + col * 4.28)
    fy = Inches(1.55 + row * 2.85)
    fw = Inches(3.9)
    fh = Inches(2.55)

    card = add_rounded_rect(slide, fx, fy, fw, fh, fill_color=C_WHITE, line_color=C_LINE)
    add_text_box(slide, icon + "  " + title,
                 fx + Inches(0.18), fy + Inches(0.15), fw - Inches(0.36), Inches(0.55),
                 font_size=14, bold=True, color=C_INK)
    divider_line(slide, fy + Inches(0.78), color=C_LINE, width_frac=0.27)
    add_bullet_box(slide, pts, fx + Inches(0.18), fy + Inches(0.9),
                   fw - Inches(0.36), fh - Inches(1.05),
                   font_size=11, color=C_MUTED, dot_color=C_GREEN)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 8 – AI STRATEGY & GUARDRAILS
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_NAVY)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN_DARK)

# Right panel green shape
panel = slide.shapes.add_shape(1, Inches(8.5), Inches(0.06), Inches(4.83), Inches(7.38))
panel.fill.solid()
panel.fill.fore_color.rgb = RGBColor(0x0F, 0x2E, 0x18)
panel.line.fill.background()

section_tag(slide, "AI Engine", Inches(0.65), Inches(0.2), width=Inches(1.2))
add_text_box(slide, "AI Strategy Engine", Inches(0.65), Inches(0.58),
             Inches(7.5), Inches(0.65), font_size=36, bold=True, color=C_WHITE)
divider_line(slide, Inches(1.32), color=C_GREEN_LIGHT, width_frac=0.55)

# Left: how it works
add_text_box(slide, "How It Works", Inches(0.65), Inches(1.5),
             Inches(7), Inches(0.4), font_size=16, bold=True, color=C_GREEN_LIGHT)

flow_steps = [
    "Brand Kit + Product Catalogue ingested",
    "Live trend signals fetched & scored",
    "Gemini Flash generates strategy",
    "Guardrails validate output",
    "Human review & approval",
    "Export to CSV / Markdown / JSON",
]
for j, step in enumerate(flow_steps):
    sy = Inches(2.0 + j * 0.82)
    # circle number
    c = slide.shapes.add_shape(9, Inches(0.65), sy, Inches(0.38), Inches(0.38))
    c.fill.solid()
    c.fill.fore_color.rgb = C_GREEN
    c.line.fill.background()
    ct = c.text_frame
    cp = ct.paragraphs[0]
    cp.alignment = PP_ALIGN.CENTER
    cr = cp.add_run()
    cr.text = str(j + 1)
    cr.font.name = "Calibri"
    cr.font.size = Pt(11)
    cr.font.bold = True
    cr.font.color.rgb = C_WHITE
    ct.margin_top = Pt(3)
    add_text_box(slide, step, Inches(1.18), sy, Inches(7.0), Inches(0.4),
                 font_size=13, color=C_WHITE)

# Right panel: guardrail rules
add_text_box(slide, "AI Guardrails", Inches(8.7), Inches(0.8),
             Inches(4.2), Inches(0.4), font_size=16, bold=True, color=C_GREEN_LIGHT)
guardrails = [
    "Never invent product specs or prices",
    "Respect prohibited brand words",
    "Respect stock availability",
    "Require human approval before export",
    "Explain every recommendation",
    "Cite confidence level per suggestion",
    "Ground all claims to catalogue data",
]
add_bullet_box(slide, guardrails, Inches(8.7), Inches(1.3),
               Inches(4.3), Inches(5.8),
               font_size=12, color=C_WHITE, dot_color=C_GREEN_LIGHT)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 9 – CONTENT PIPELINE
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_CANVAS)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN)

section_tag(slide, "Pipeline", Inches(0.65), Inches(0.2), width=Inches(1.1))
add_text_box(slide, "Content Generation Pipeline", Inches(0.65), Inches(0.55),
             Inches(10), Inches(0.65), font_size=36, bold=True, color=C_INK)
divider_line(slide, Inches(1.32), color=C_GREEN, width_frac=0.9)

# Horizontal pipeline flow
pipeline = [
    ("📊", "Business\nIntelligence", C_BLUE),
    ("🌐", "Trend\nSignals", C_GREEN_LIGHT),
    ("🤖", "AI Strategy\nEngine", C_GREEN),
    ("📝", "Content\nStudio", C_AMBER),
    ("✅", "Review &\nApproval", C_MUTED),
    ("📤", "Export &\nPublish", C_INK),
]

px_start = Inches(0.55)
pw = Inches(1.9)
ph = Inches(2.2)
py = Inches(1.7)
gap = Inches(0.25)

for i, (icon, label, color) in enumerate(pipeline):
    bx = px_start + i * (pw + gap)

    card = add_rounded_rect(slide, bx, py, pw, ph, fill_color=C_WHITE, line_color=color)
    # top strip
    s = slide.shapes.add_shape(1, bx, py, pw, Inches(0.07))
    s.fill.solid()
    s.fill.fore_color.rgb = color
    s.line.fill.background()

    add_text_box(slide, icon, bx + Inches(0.15), py + Inches(0.2),
                 pw - Inches(0.3), Inches(0.45), font_size=22,
                 color=color, align=PP_ALIGN.CENTER)
    add_text_box(slide, label, bx + Inches(0.05), py + Inches(0.75),
                 pw - Inches(0.1), Inches(1.0), font_size=12, bold=True,
                 color=C_INK, align=PP_ALIGN.CENTER)

    if i < len(pipeline) - 1:
        arr = slide.shapes.add_shape(13,
            bx + pw + Inches(0.02), py + Inches(0.9), Inches(0.22), Inches(0.18))
        arr.fill.solid()
        arr.fill.fore_color.rgb = C_MUTED
        arr.line.fill.background()

# Content format pills below
add_text_box(slide, "Generated Content Formats:", Inches(0.65), Inches(4.2),
             Inches(5), Inches(0.35), font_size=14, bold=True, color=C_INK)

formats = ["Social Captions", "Video Scripts", "5-Slide Carousels",
           "Email Newsletters", "WhatsApp Broadcasts", "Ad Copy & Headlines"]
for i, fmt in enumerate(formats):
    fx = Inches(0.65 + (i % 3) * 4.2)
    fy = Inches(4.7 + (i // 3) * 0.65)
    add_bullet_box(slide, [fmt], fx, fy, Inches(4.0), Inches(0.5),
                   font_size=13, color=C_INK, dot_color=C_GREEN)

# Export formats
add_text_box(slide, "Export Formats:  CSV  ·  Markdown  ·  JSON",
             Inches(0.65), Inches(6.5), Inches(10), Inches(0.4),
             font_size=13, bold=False, color=C_MUTED)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 10 – AUTHENTICATION & SECURITY
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_CANVAS)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN)

section_tag(slide, "Security", Inches(0.65), Inches(0.2), width=Inches(1.1))
add_text_box(slide, "Authentication & Security", Inches(0.65), Inches(0.55),
             Inches(10), Inches(0.65), font_size=36, bold=True, color=C_INK)
divider_line(slide, Inches(1.32), color=C_GREEN, width_frac=0.9)

# Two columns: Auth features | Security features
auth_items = [
    "Email + Password registration",
    "6-digit OTP email verification",
    "JWT Bearer tokens",
    "Password reset via email link",
    "Profile update & avatar",
    "Secure account deletion",
]
security_items = [
    "Supabase Row-Level Security (RLS)",
    "4-hour inactivity timeout",
    "24-hour hard session limit",
    "Multi-tab logout synchronization",
    "Global 401 token interceptor",
    "Service-role key never exposed",
]

column_card(slide, "🔑  Authentication Flow", auth_items,
            Inches(0.55), Inches(1.55), width=Inches(5.8), height=Inches(5.5))
column_card(slide, "🛡️  Security Architecture", security_items,
            Inches(6.85), Inches(1.55), width=Inches(5.8), height=Inches(5.5),
            header_bg=C_NAVY)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 11 – PRODUCT CATALOGUE & BRAND KIT
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_NAVY)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN_DARK)

section_tag(slide, "Data Layer", Inches(0.65), Inches(0.2), width=Inches(1.2))
add_text_box(slide, "Product Catalogue & Brand Kit", Inches(0.65), Inches(0.55),
             Inches(10), Inches(0.65), font_size=36, bold=True, color=C_WHITE)
divider_line(slide, Inches(1.32), color=C_GREEN_LIGHT, width_frac=0.85)

prod_items = [
    "Name, description, category, SKU",
    "Price, cost price, profit margin",
    "Stock tracking & availability",
    "Status: Draft / Active / Archived",
    "Priority: Low / Normal / High / Featured",
    "Up to 10 product images",
    "CSV bulk import (500 rows, 2 MB)",
    "Alias header mapping",
    "Row-by-row pre-validation",
    "Duplicate SKU handling",
]
brand_items = [
    "Brand voice & content style",
    "Primary & secondary colors",
    "Fonts, CTAs, prohibited words",
    "Approved caption examples",
    "Target audience definition",
    "7 marketing objectives",
    "Logo URL storage",
]

column_card(slide, "📦  Product Catalogue (M4)", prod_items,
            Inches(0.55), Inches(1.55), width=Inches(5.8), height=Inches(5.5),
            header_bg=C_BLUE)
column_card(slide, "🎨  Brand Kit (M3)", brand_items,
            Inches(6.85), Inches(1.55), width=Inches(5.8), height=Inches(5.5),
            header_bg=C_GREEN)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 12 – TREND INTELLIGENCE
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_CANVAS)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN)

section_tag(slide, "Trend Engine", Inches(0.65), Inches(0.2), width=Inches(1.5))
add_text_box(slide, "Trend Intelligence Engine", Inches(0.65), Inches(0.55),
             Inches(10), Inches(0.65), font_size=36, bold=True, color=C_INK)
divider_line(slide, Inches(1.32), color=C_GREEN, width_frac=0.9)

# How trends flow: 3 horizontal boxes + detail on right
trend_stages = [
    ("📡", "Collection", C_BLUE,
     ["RSS feed aggregation", "Source health monitoring", "Collection timestamp"]),
    ("🔬", "Scoring", C_GREEN,
     ["Velocity confidence score", "Relevance to catalogue", "Freshness labelling"]),
    ("🎯", "Application", C_AMBER,
     ["Matched to products", "Drives content angles", "Informs campaign mix"]),
]

for i, (icon, stage, color, details) in enumerate(trend_stages):
    tx = Inches(0.55 + i * 4.27)
    ty = Inches(1.6)
    tw = Inches(3.9)
    th = Inches(3.5)

    card = add_rounded_rect(slide, tx, ty, tw, th, fill_color=C_WHITE, line_color=color)
    strip = slide.shapes.add_shape(1, tx, ty, tw, Inches(0.07))
    strip.fill.solid()
    strip.fill.fore_color.rgb = color
    strip.line.fill.background()

    add_text_box(slide, icon + "  " + stage,
                 tx + Inches(0.18), ty + Inches(0.18), tw - Inches(0.36), Inches(0.5),
                 font_size=18, bold=True, color=color)
    add_bullet_box(slide, details, tx + Inches(0.18), ty + Inches(0.78),
                   tw - Inches(0.36), th - Inches(1.0),
                   font_size=12, color=C_INK, dot_color=color)

    if i < 2:
        arr = slide.shapes.add_shape(13,
            tx + tw, ty + Inches(1.5), Inches(0.3), Inches(0.25))
        arr.fill.solid()
        arr.fill.fore_color.rgb = C_MUTED
        arr.line.fill.background()

# Guardrail note
add_text_box(slide, "🔒  Integrity Rule:", Inches(0.65), Inches(5.4),
             Inches(5), Inches(0.35), font_size=13, bold=True, color=C_INK)
add_text_box(slide,
    'Never claim a trend is "live" without source evidence — confidence scores are always shown.',
    Inches(0.65), Inches(5.8), Inches(11.5), Inches(0.55),
    font_size=13, color=C_MUTED)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 13 – DEPLOYMENT & LIVE PRODUCT
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_NAVY)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN_DARK)

# Right accent
right_accent = slide.shapes.add_shape(1, Inches(9.5), 0, Inches(3.83), H)
right_accent.fill.solid()
right_accent.fill.fore_color.rgb = RGBColor(0x0F, 0x2E, 0x18)
right_accent.line.fill.background()

section_tag(slide, "Deployment", Inches(0.65), Inches(0.2), width=Inches(1.3))
add_text_box(slide, "Live Deployment", Inches(0.65), Inches(0.58),
             Inches(8.5), Inches(0.65), font_size=36, bold=True, color=C_WHITE)
divider_line(slide, Inches(1.32), color=C_GREEN_LIGHT, width_frac=0.6)

deploy_info = [
    ("🌐  Frontend", "Vercel", "marketpilot-iota.vercel.app"),
    ("⚙️  Backend API", "Render", "marketpilot-r22y.onrender.com"),
    ("📖  API Docs", "Swagger UI", "marketpilot-r22y.onrender.com/docs"),
    ("🗄️  Database", "Supabase", "PostgreSQL + Auth + RLS"),
]

for i, (label, platform, url) in enumerate(deploy_info):
    dy = Inches(1.65 + i * 1.25)
    card = add_rounded_rect(slide, Inches(0.55), dy, Inches(8.7), Inches(1.05),
                             fill_color=RGBColor(0x17, 0x28, 0x3E))
    add_text_box(slide, label, Inches(0.82), dy + Inches(0.1),
                 Inches(3.5), Inches(0.4), font_size=14, bold=True, color=C_WHITE)
    add_text_box(slide, f"{platform}  ·  {url}",
                 Inches(0.82), dy + Inches(0.52), Inches(8.0), Inches(0.4),
                 font_size=12, color=C_MUTED)

# Right panel: tech highlights
add_text_box(slide, "CI/CD & Infra", Inches(9.7), Inches(1.0),
             Inches(3.3), Inches(0.4), font_size=16, bold=True, color=C_GREEN_LIGHT)
infra = [
    "render.yaml IaC config",
    "Auto-deploy on Git push",
    "Vercel SPA routing rewrites",
    "Environment secret management",
    "CORS multi-origin support",
    "SSL / HTTPS enforced",
]
add_bullet_box(slide, infra, Inches(9.7), Inches(1.5),
               Inches(3.3), Inches(5.3),
               font_size=12, color=C_WHITE, dot_color=C_GREEN_LIGHT)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 14 – TESTING & CODE QUALITY
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_CANVAS)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN)

section_tag(slide, "Quality", Inches(0.65), Inches(0.2), width=Inches(1.1))
add_text_box(slide, "Testing & Code Quality", Inches(0.65), Inches(0.55),
             Inches(10), Inches(0.65), font_size=36, bold=True, color=C_INK)
divider_line(slide, Inches(1.32), color=C_GREEN, width_frac=0.9)

# Big number highlight
stat_box(slide, "109", "Passing Tests",
         Inches(0.65), Inches(1.55), width=Inches(2.4), height=Inches(1.3))
stat_box(slide, "0", "Test Failures",
         Inches(3.35), Inches(1.55), width=Inches(2.4), height=Inches(1.3), accent=C_GREEN)
stat_box(slide, "v1.3", "API Version",
         Inches(6.05), Inches(1.55), width=Inches(2.4), height=Inches(1.3), accent=C_BLUE)
stat_box(slide, "MIT", "License",
         Inches(8.75), Inches(1.55), width=Inches(2.4), height=Inches(1.3), accent=C_MUTED)

add_text_box(slide, "Test Coverage Areas", Inches(0.65), Inches(3.1),
             Inches(7), Inches(0.4), font_size=16, bold=True, color=C_INK)

test_areas = [
    "Authentication schemas (register, login, tokens)",
    "Product CRUD validation & edge cases",
    "CSV import row-level error handling",
    "Brand Kit schema constraints",
    "Workspace creation & enforcement rules",
    "Gemini LLM prompt structure & output parsing",
    "AI guardrail prohibited-word detection",
    "Pydantic v2 field validators",
]
add_bullet_box(slide, test_areas, Inches(0.65), Inches(3.6),
               Inches(11.8), Inches(3.5),
               font_size=13, color=C_INK, dot_color=C_GREEN)


# ══════════════════════════════════════════════════════════════════════════════
# SLIDE 15 – SUMMARY & LEARNINGS
# ══════════════════════════════════════════════════════════════════════════════
slide = prs.slides.add_slide(blank_layout)
add_rect(slide, 0, 0, W, H, fill_color=C_NAVY)
hex_bar(slide, 0.0, height_inches=0.06, color=C_GREEN)
hex_bar(slide, 7.44, height_inches=0.06, color=C_GREEN_DARK)

# Decorative circles (background texture)
for cx, cy, cr, alpha in [
    (Inches(12.2), Inches(6.5), Inches(2.5), RGBColor(0x14, 0x3D, 0x1C)),
    (Inches(11.5), Inches(5.5), Inches(1.5), RGBColor(0x16, 0x58, 0x23)),
    (Inches(0.5),  Inches(6.5), Inches(1.8), RGBColor(0x0D, 0x48, 0x20)),
]:
    c = slide.shapes.add_shape(9, cx - cr, cy - cr, cr * 2, cr * 2)
    c.fill.solid()
    c.fill.fore_color.rgb = alpha
    c.line.fill.background()

section_tag(slide, "Summary", Inches(0.65), Inches(0.2), width=Inches(1.1))
add_text_box(slide, "Summary & Key Learnings", Inches(0.65), Inches(0.55),
             Inches(10), Inches(0.65), font_size=36, bold=True, color=C_WHITE)
divider_line(slide, Inches(1.32), color=C_GREEN_LIGHT, width_frac=0.85)

# Left column: what was built
add_text_box(slide, "What Was Built", Inches(0.65), Inches(1.55),
             Inches(6), Inches(0.4), font_size=16, bold=True, color=C_GREEN_LIGHT)
built = [
    "Full-stack AI marketing platform (V1)",
    "FastAPI + Supabase backend (Modules 1–4+)",
    "React 18 frontend with live Vercel deployment",
    "Google Gemini-powered strategy engine",
    "5-format content studio with export",
    "109 automated backend tests",
]
add_bullet_box(slide, built, Inches(0.65), Inches(2.05),
               Inches(5.8), Inches(2.5),
               font_size=12, color=C_WHITE, dot_color=C_GREEN_LIGHT)

# Right column: key learnings
add_text_box(slide, "Key Learnings", Inches(7.0), Inches(1.55),
             Inches(5.5), Inches(0.4), font_size=16, bold=True, color=C_AMBER)
learnings = [
    "LLM guardrails are critical for production AI",
    "Pydantic v2 enforces contract-first APIs",
    "RLS is more secure than app-level auth checks",
    "Background workers prevent API blocking",
    "Schema-first design reduces refactoring",
    "Real user data shapes better AI prompts",
]
add_bullet_box(slide, learnings, Inches(7.0), Inches(2.05),
               Inches(5.8), Inches(2.5),
               font_size=12, color=C_WHITE, dot_color=C_AMBER)

# Bottom banner
banner = slide.shapes.add_shape(1,
    Inches(0.55), Inches(5.0), Inches(12.23), Inches(1.5))
banner.fill.solid()
banner.fill.fore_color.rgb = RGBColor(0x14, 0x3D, 0x1C)
banner.line.fill.background()

add_text_box(slide, "Thank You",
             Inches(0.65), Inches(5.1), Inches(12.23), Inches(0.65),
             font_size=30, bold=True, color=C_WHITE, align=PP_ALIGN.CENTER)
add_text_box(slide,
    "MarketPilot AI  ·  marketpilot-iota.vercel.app  ·  github.com/Danish-Riaz",
    Inches(0.65), Inches(5.82), Inches(12.23), Inches(0.4),
    font_size=12, color=C_GREEN_LIGHT, align=PP_ALIGN.CENTER)

# ── Save ──────────────────────────────────────────────────────────────────────
output_path = r"C:\Users\danis\Desktop\Internship Project\MarketPilot_AI_Final_Presentation.pptx"
prs.save(output_path)
print("Presentation saved to: " + output_path)
