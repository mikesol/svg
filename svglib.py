'''
only use paths and arcs
even though svg has native support for other elements (polygon, rectangle etc.),
it is a pain for people writing converters and backends to
cover all these cases.
the goal is to find the minimum number of elemetns that can articulate our needs
- path for lines and bezier curves
- arc for circles and parts of circles


All value readers could potentially be activated from the javascript.
Those that are passive just have a passive flag set.
'''

from utilities import *
import cmath

# m4g1c values
TEXT_HEIGHT = 20
TEXT_PADDING = 10
VALUE_BOX_W = 60
VALUE_BOX_H = TEXT_HEIGHT # need to maybe change this relationship...
TEXT_BOX_PADDING = 3

class FaustObject(object) :
  def open_group_svg(self) :
    out = '<g transform="translate({0},{1})">'.format(self.x, self.y)
    return out
  # code dup...
  def get_x_offset(self) :
    if not hasattr(self, 'mom') :
      return self.x
    return self.x + self.mom.get_x_offset() if self.mom else self.x
  def get_y_offset(self) :
    if not hasattr(self, 'mom') :
      return self.y
    return self.y + self.mom.get_y_offset() if self.mom else self.y
  def close_group_svg(self) :
    out = '</g>'
    return out

class FaustIncrementalObject(FaustObject) :
  def draw_value_box_svg(self, id, fn) :
    out = '<path transform="translate(0,{4})" id="faust_value_box_{2}" d="M0 0L{0} 0L{0} {1}L0 {1}L0 0" style="fill:white;stroke:black;" onmousedown="({3})()"/>'.format(
      self.value_box_w,
      self.value_box_h,
      id,
      fn,
      self.internal_dims()[1] + self.box_padding)
    return out
  def draw_value_svg(self,id,fn) :
    out = '<text transform="translate({0},{1})"><tspan id=\'faust_value_{2}\' onmousedown="({3})()">{4}</tspan></text>'.format(
      self.box_padding,
      self.internal_dims()[1] + self.lpadding_y,
      id,
      fn,
      self.default)
    return out
  def draw_label_svg(self, id) :
    out = '<text transform="translate(0,{0})"><tspan id="{1}">{2}</tspan></text>'.format(
      self.internal_dims()[1] + self.lpadding_y + self.lpadding_y,
      'faust_label_'+id,
      self.label)
    return out

class FaustRotatingButton(FaustIncrementalObject) :
  '''
  ALL ANGLES EXPRESSED IN DEGREES
  a0 = initial angle
  sweep = number of degrees :: ALWAYS POSITIVE
  '''
  def __init__(self, mom=None, r=50, a0=180, sweep=180, sp=0.1, label='foo', unit='grames', default=50, mn=0, mx=100, step=1, lpadding_y=TEXT_HEIGHT, box_padding=TEXT_BOX_PADDING, gravity=(CENTER, CENTER), fill=CYAN, value_box_w = VALUE_BOX_W, value_box_h = VALUE_BOX_H) :
    self.mom = mom
    self.r = r
    if sweep < 0 :
      a0 += sweep
      sweep = abs(sweep)
    sweep %= 360
    if sweep == 0 :
      sweep = 360
    self.a0 = a0
    self.sweep = sweep
    self.sp = sp
    self.label = label
    self.unit = unit
    self.default = bound(default,mn,mx)
    self.mn = mn
    self.mx = mx
    self.step = step
    self.box_padding = box_padding
    self.lpadding_y = lpadding_y
    self.gravity = gravity # [x,y] gravity for SELF
    self.fill = fill
    self.value_box_w = value_box_w
    self.value_box_h = value_box_h
  def get_maybe_extremal_coords(self) :
    angles = sorted(list(set(find_all_90s(self.a0, self.sweep) + [self.a0, self.a0 + self.sweep])))
    return [rect_to_coord(cmath.rect(*polar)) for polar in [(self.r, d2r(angle)) for angle in angles]]+[(0,0)]
  def internal_dims(self) :
    # sorted not necessary, but why not...
    coords = self.get_maybe_extremal_coords()
    box = Box()
    for coord in coords :
      box.add_point(coord)
    ugh = box.lens()
    return ugh
  def dims(self) :
    ugh = self.internal_dims()
    return ugh[0], ugh[1] + (2 * self.lpadding_y) + TEXT_PADDING
  def get_translation(self) :
    # first, we need to translate the coordinate space so that the
    # left-bottom is 0,0
    coords = self.get_maybe_extremal_coords()
    return (min([coord[0] for coord in coords]), min([coord[0] for coord in coords]))
  def mobility_string(self, id, start_rot) :
    # ugh, in svg, rotate is weird. need to tack on 180 :(
    torig = coord_sub((0,0), self.get_translation())
    out = 'transform="translate(0,0) scale(1,1) rotate({0},{1},{2})" id="{3}" onmousedown="(rotate_button(\'{3}\',{4},{5},{6},{1},{2},{7},{8},{9},{10},{11},\'{12}\'))()" onmouseup="mouseUpFunction()"'.format(
      start_rot + 180, # 0
      torig[0], # 1
      torig[1], # 2
      id, # 3
      self.a0 + 180, # 4
      self.sweep, # 5
      self.sp, # 6
      self.get_x_offset(), # 7
      self.get_y_offset(), # 8
      self.mn, # 9
      self.mx, # 10
      self.step, # 11
      self.label) # 12
    return out
  @staticmethod
  def generic_draw(origin, start, end, r, fill, stroke, instruction, small) :
    out = '<path d="M{0} {1}L{2} {3} A{4} {4} {5} 1 {6} {7}L{0} {1}" style="fill:{8};stroke:{9};" {10} />'.format(
      origin[0], origin[1],
      start[0], start[1],
      r, '1 0' if small else '0 1',
      end[0], end[1],
      fill, stroke, instruction)
    return out
  def draw_unsliding_part_svg(self, id) :
    # first, we need to translate the coordinate space so that the
    # left-bottom is 0,0
    trans = self.get_translation()
    start = coord_sub(rect_to_coord(cmath.rect(self.r, d2r(self.a0))), trans)
    end = coord_sub(rect_to_coord(cmath.rect(self.r, d2r(self.a0 + self.sweep))), trans)
    org = coord_sub((0,0), trans)
    return FaustRotatingButton.generic_draw(
      org,
      start,
      end,
      self.r,
      color_to_rgb(self.fill),
      color_to_rgb(BLACK),
      'id="{0}"'.format('faust_rotating_button_unsliding_part_'+id),
      self.sweep < 180)
  def draw_sliding_part_svg(self, id) :
    trans = self.get_translation()
    slider_angle = self.sweep * self.sp
    half_slider_angle = slider_angle * 0.5
    startp = remap(self.default, self.mn, self.mx, self.a0 + half_slider_angle, self.a0 + self.sweep - half_slider_angle)
    #start = coord_sub(rect_to_coord(cmath.rect(self.r, d2r(startp - half_slider_angle))), trans)
    #end = coord_sub(rect_to_coord(cmath.rect(self.r, d2r(startp + half_slider_angle))), trans)
    start = coord_sub(rect_to_coord(cmath.rect(self.r, d2r(self.a0))), trans)
    end = coord_sub(rect_to_coord(cmath.rect(self.r, d2r(self.a0 + slider_angle))), trans)
    org = coord_sub((0,0), trans)
    instruction = self.mobility_string('faust_rotating_button_sliding_part_'+id, startp - half_slider_angle)
    return FaustRotatingButton.generic_draw(org, start, end, self.r, color_to_rgb(GREY), color_to_rgb(BLACK), instruction, self.sweep * self.sp < 180)
  def make_key_sink_function(self, id) :
    # ugh...code dup...consolodate if possible...
    torig = coord_sub((0,0), self.get_translation())
    out = 'rotating_button_key_sink(\'{0}\',{1},{2},{3},{4},{5},{6},{7},{8},{9},{10},{11},\'{12}\')'.format(
      id, # 0
      self.a0 + 180, # 1
      self.sweep, # 2
      self.sp, # 3
      torig[0], # 1
      torig[1], # 2
      self.get_x_offset(), # 4
      self.get_y_offset(), # 5
      self.mn, # 6
      self.mx, # 7
      self.step, # 8
      self.default,
      self.label) # 10
    return out
  def export_to_svg(self) :
    id = randString()
    fn = self.make_key_sink_function(id)
    group_open = self.open_group_svg()
    unsliding_part = self.draw_unsliding_part_svg(id)
    sliding_part = self.draw_sliding_part_svg(id)
    box = self.draw_value_box_svg(id, fn)
    value = self.draw_value_svg(id, fn)
    label = self.draw_label_svg(id)
    group_close = self.close_group_svg()
    return group_open + unsliding_part + sliding_part + box + value + label + group_close

class FaustSlider(FaustIncrementalObject) :
  '''
  wa = size of the weak axis
  sa = size of the strong axis
  sp = percentage of the strong axis a slider takes up
  label = label
  unit = unit
  default = default value
  '''
  def __init__(self, mom=None, o=X_AXIS, wa=40, sa=200, sp=0.15, label='foo', unit='grames', default=50, mn=0, mx=100, step=1, lpadding_y=TEXT_HEIGHT, box_padding=TEXT_BOX_PADDING, gravity=(CENTER, CENTER), fill=CYAN, value_box_w = VALUE_BOX_W, value_box_h = VALUE_BOX_H) :
    self.mom = mom
    self.o = o
    self.wa = wa
    self.sa = sa
    self.sp = sp
    self.label = label
    self.unit = unit
    self.default = bound(default,mn,mx)
    self.mn = mn
    self.mx = mx
    self.step = step
    self.lpadding_y = lpadding_y
    self.box_padding = box_padding
    self.gravity = gravity # [x,y] gravity for SELF
    self.fill = fill
    self.value_box_w = value_box_w
    self.value_box_h = value_box_h
  def internal_dims(self) :
    x = xy(self.o, self.sa, self.wa)
    y = xy(self.o, self.wa, self.sa)
    return x,y
  def dims(self) :
    ugh = self.internal_dims()
    # include label and value in y
    ugh = (max(ugh[0], self.value_box_w), ugh[1] + (2 * self.lpadding_y) + TEXT_PADDING)
    log(self, ("DIMS FOR SLIDER",) + ugh)
    return ugh
  def draw_unsliding_component_svg(self, fill, stroke, id) :
    out = '<path d="M0 0L{0} 0L{0} {1}L0 {1}L0 0" style="fill:{2};stroke:{3};" id="{4}" />'.format(
      xy(self.o, self.sa, self.wa), xy(self.o, self.wa, self.sa),
      fill, stroke,
      'faust_slider_unsliding_part_'+id)
    return out
  def draw_unsliding_part_svg(self, id) :
    return self.draw_unsliding_component_svg(color_to_rgb(self.fill), color_to_rgb(BLACK), id)
  def draw_sliding_component_svg(self, fill, stroke, id) :
    slider_girth = self.sa  * self.sp
    half_slider_girth = slider_girth * 0.5
    startp = remap(self.default, self.mn, self.mx, 0 + half_slider_girth, self.sa - half_slider_girth)
    bottom = startp - half_slider_girth
    top = startp + half_slider_girth
    out = '<path transform="translate({0},{1})" id="{2}" d="M0 0L{3} 0L{3} {4}L0 {4}L0 0" style="fill:{5};stroke:{6}" onmousedown="({7}(\'{2}\',{8},{9},{10},{11},{12},\'{13}\'))()" onmouseup="mouseUpFunction()"/>'.format(
      xy(self.o, bottom, 0), xy(self.o, 0, bottom),
      'faust_slider_sliding_part_'+id,
      xy(self.o, slider_girth, self.wa),
      xy(self.o, self.wa, slider_girth),
      fill, stroke,
      # function arguments
      xy(self.o,'horizontal_slide','vertical_slide'),
      self.sa,
      self.sp,
      self.mn,
      self.mx,
      self.step,
      self.label)
    return out
  def make_key_sink_function(self, id) :
    # ugh...code dup...consolodate if possible...
    out = '{0}_key_sink(\'{1}\',{2},{3},{4},{5},{6},{7},\'{8}\')'.format(
      xy(self.o,'horizontal_slide','vertical_slide'),
      id, # 0
      self.sa,
      self.sp,
      self.mn,
      self.mx,
      self.step,
      self.default,
      self.label)
    return out
  def draw_sliding_part_svg(self, id) :
    return self.draw_sliding_component_svg(color_to_rgb(GREY), color_to_rgb(BLACK), id)
  def export_to_svg(self) :
    # In svg, the width and height of text can be guessed but is often
    # browser specific. We get around this by always adding the text
    # after everything else so nothing else's position depends on it
    id = randString()
    group_open = self.open_group_svg()
    fn = self.make_key_sink_function(id)
    unsliding_part = self.draw_unsliding_part_svg(id)
    sliding_part = self.draw_sliding_part_svg(id)
    box = self.draw_value_box_svg(id, fn)
    value = self.draw_value_svg(id, fn)
    label = self.draw_label_svg(id)
    group_close = self.close_group_svg()
    return group_open + unsliding_part + sliding_part + box + value + label + group_close

class FaustHorizontalSlider(FaustSlider) :
  def __init__(self, mom=None, wa=40, sa=200, sp=0.15, label='foo', unit='grames', default=50, mn=0, mx=100, step=1, lpadding_y=TEXT_HEIGHT, box_padding=TEXT_BOX_PADDING, gravity=(CENTER, CENTER), fill=CYAN, value_box_w = VALUE_BOX_W, value_box_h = VALUE_BOX_H) :
    FaustSlider.__init__(self, mom=mom, o=X_AXIS, wa=wa, sa=sa, sp=sp, label=label, unit=unit, default=default, mn=mn, mx=mx, step=step, lpadding_y=lpadding_y, box_padding=box_padding, gravity=gravity, fill=fill, value_box_w=value_box_w, value_box_h=value_box_h)

class FaustVerticalSlider(FaustSlider) :
  def __init__(self, mom=None, wa=40, sa=200, sp=0.15, label='foo', unit='grames', default=50, mn=0, mx=100, step=1, lpadding_y=TEXT_HEIGHT, box_padding=TEXT_BOX_PADDING, gravity=(CENTER, CENTER), fill=CYAN, value_box_w = VALUE_BOX_W, value_box_h = VALUE_BOX_H) :
    FaustSlider.__init__(self, mom=mom, o=Y_AXIS, wa=wa, sa=sa, sp=sp, label=label, unit=unit, default=default, mn=mn, mx=mx, step=step, lpadding_y=lpadding_y, box_padding=box_padding, gravity=gravity, fill=fill, value_box_w=value_box_w, value_box_h=value_box_h)

class FaustBarGraph(FaustIncrementalObject) :
  '''
  kind of a code dup with slider...
  '''
  def __init__(self, mom=None, o=X_AXIS, wa=40, sa=200, label='foo', unit='grames', default=50, mn=0, mx=100, step=1, lpadding_y=TEXT_HEIGHT, box_padding=TEXT_BOX_PADDING, gravity=(CENTER, CENTER), fill=CYAN, value_box_w = VALUE_BOX_W, value_box_h = VALUE_BOX_H) :
    self.mom = mom
    self.o = o
    self.wa = wa
    self.sa = sa
    self.label = label
    self.unit = unit
    self.default = bound(default,mn,mx)
    self.mn = mn
    self.mx = mx
    self.step = step
    self.lpadding_y = lpadding_y
    self.box_padding = box_padding
    self.gravity = gravity # [x,y] gravity for SELF
    self.fill = fill
    self.value_box_w = value_box_w
    self.value_box_h = value_box_h
  def internal_dims(self) :
    x = xy(self.o, self.sa, self.wa)
    y = xy(self.o, self.wa, self.sa)
    return x,y
  def dims(self) :
    ugh = self.internal_dims()
    # include label and value in y
    ugh = (max(ugh[0], self.value_box_w), ugh[1] + (2 * self.lpadding_y) + TEXT_PADDING)
    log(self, ("DIMS FOR BAR GRAPH",) + ugh)
    return ugh
  def draw_unsliding_component_svg(self, fill, stroke, id) :
    out = '<path d="M0 0L{0} 0L{0} {1}L0 {1}L0 0" style="fill:{2};stroke:{3};" id="{4}" />'.format(
      xy(self.o, self.sa, self.wa), xy(self.o, self.wa, self.sa),
      fill, stroke,
      'faust_bargraph_unsliding_part_'+id)
    return out
  def draw_unsliding_part_svg(self, id) :
    return self.draw_unsliding_component_svg(color_to_rgb(self.fill), color_to_rgb(BLACK), id)
  def draw_sliding_component_svg(self, fill, stroke, id) :
    default = remap(self.default, self.mn, self.mx, 0, self.sa)
    out = '<path id="{0}" d="M0 0L{1} 0L{1} {2}L0 {2}L0 0" style="fill:{3};stroke:{4}" onmousedown="({5}(\'{0}\',{6},{7},{8},{9},\'{10}\'))()" onmouseup="mouseUpFunction()"/>'.format(
      'faust_bargraph_sliding_part_'+id,
      xy(self.o, default, self.wa),
      xy(self.o, self.wa, default),
      fill, stroke,
      # function arguments
      xy(self.o,'horizontal_barslide','vertical_barslide'),
      self.sa,
      self.mn,
      self.mx,
      self.step,
      self.label)
    return out
  # sliders don't have key sinks
  def draw_sliding_part_svg(self, id) :
    return self.draw_sliding_component_svg(color_to_rgb(GREY), color_to_rgb(BLACK), id)
  def export_to_svg(self) :
    # In svg, the width and height of text can be guessed but is often
    # browser specific. We get around this by always adding the text
    # after everything else so nothing else's position depends on it
    id = randString()
    group_open = self.open_group_svg()
    unsliding_part = self.draw_unsliding_part_svg(id)
    sliding_part = self.draw_sliding_part_svg(id)
    box = self.draw_value_box_svg(id, 'devnull()')
    value = self.draw_value_svg(id, 'devnull()')
    label = self.draw_label_svg(id)
    group_close = self.close_group_svg()
    return group_open + unsliding_part + sliding_part + box + value + label + group_close

class FaustHorizontalBarGraph(FaustBarGraph) :
  def __init__(self, mom=None, wa=40, sa=200, label='foo', unit='grames', default=50, mn=0, mx=100, step=1, lpadding_y=TEXT_HEIGHT, box_padding=TEXT_BOX_PADDING, gravity=(CENTER, CENTER), fill=CYAN, value_box_w = VALUE_BOX_W, value_box_h = VALUE_BOX_H) :
    FaustBarGraph.__init__(self, mom=mom, o=X_AXIS, wa=wa, sa=sa, label=label, unit=unit, default=default, mn=mn, mx=mx, step=step, lpadding_y=lpadding_y, box_padding=box_padding, gravity=gravity, fill=fill, value_box_w=value_box_w, value_box_h=value_box_h)

class FaustVerticalBarGraph(FaustBarGraph) :
  def __init__(self, mom=None, wa=40, sa=200, label='foo', unit='grames', default=50, mn=0, mx=100, step=1, lpadding_y=TEXT_HEIGHT, box_padding=TEXT_BOX_PADDING, gravity=(CENTER, CENTER), fill=CYAN, value_box_w = VALUE_BOX_W, value_box_h = VALUE_BOX_H) :
    FaustBarGraph.__init__(self, mom=mom, o=Y_AXIS, wa=wa, sa=sa, label=label, unit=unit, default=default, mn=mn, mx=mx, step=step, lpadding_y=lpadding_y, box_padding=box_padding, gravity=gravity, fill=fill, value_box_w=value_box_w, value_box_h=value_box_h)

class FaustCheckBox(FaustObject) :
  '''
  '''
  MAGIC = 19
  def __init__(self, mom=None, d=19, label='foo', gravity=(CENTER, CENTER), fill=PINK, default=False, lpadding_y=TEXT_HEIGHT, box_padding=TEXT_BOX_PADDING,) :
    FaustObject.__init__(self)
    # everything in terms of 19 because that's what the scale of the check is
    # the check is hardcoded for now in the javascript document...
    self.mom = mom
    self.d = d
    self.label = label
    self.gravity = gravity # [x,y] gravity for SELF
    self.default = default
    self.fill = fill
    self.lpadding_y = lpadding_y
  def internal_dims(self) :
    log(self, ("DIMS FOR CHECKBOX", self.d, self.d))
    return self.d, self.d
  def dims(self) :
    ugh = self.internal_dims()
    return ugh[0], ugh[1] + self.lpadding_y + TEXT_PADDING + (self.d * 0.1 / FaustCheckBox.MAGIC) # kludge for overhang of check
  def draw_box_svg(self, id) :
    out = '<path d="M0 0L{0} 0L{0} {0}L0 {0}L0 0" style="fill:white;stroke:black;" onmousedown="(change_checkbox(\'{1}\'))()" onmouseup="mouseUpFunction()"/>'.format(
      self.d, id)
    return out
  def draw_check_svg(self,id) :
    # ugh...for now, we do disappearing based on opacity
    out = '<path transform="scale({0},{0}) translate(-1.0896806, -4.3926201)" id="{3}" d="M 8.5296806,20.14262 C 6.6396806,17.55262 6.7896806,15.14262 5.2896806,13.53262 C 3.7896806,11.95262 5.6496806,12.23262 6.0696806,12.49262 C 9.5326806,14.79862 8.7036806,21.25062 11.339681,13.13262 C 13.095681,6.90862 16.589681,1.89262 17.296681,0.95421999 C 18.049681,0.02261999 18.400681,1.04122 17.638681,2.16262 C 14.279681,7.67262 13.569681,11.03262 11.150681,19.23262 C 10.846681,20.26262 9.3646806,21.28262 8.5296806,20.13262 L 8.5286806,20.13762 L 8.5296806,20.14262 z" style="opacity:{1};" fill="{2}" onmousedown="(change_checkbox(\'{3}\'))()" onmouseup="mouseUpFunction()"/>'.format(
      self.d * 1.0 / FaustCheckBox.MAGIC,
      1.0 if self.default else 0.0,
      color_to_rgb(self.fill),
      id)
    return out
  def draw_label_svg(self) :
    out = '<text transform="translate(0,{0})"><tspan>{1}</tspan></text>'.format(
      self.internal_dims()[1] + self.lpadding_y,
      self.label)
    return out
  def export_to_svg(self) :
    # In svg, the width and height of text can be guessed but is often
    # browser specific. We get around this by always adding the text
    # after everything else so nothing else's position depends on it
    id = randString()
    group_open = self.open_group_svg()
    box = self.draw_box_svg(id)
    check = self.draw_check_svg(id)
    label = self.draw_label_svg()
    group_close = self.close_group_svg()
    return group_open + box + label + check + group_close

class FaustButton(FaustObject) :
  '''
  '''
  def __init__(self, mom=None, w=80, h=40, label='foo', gravity=(CENTER, CENTER), fillOn=PINK, fillOff=GREEN, baselineSkip = 5) :
    FaustObject.__init__(self)
    self.mom = mom
    self.w = w
    self.h = h
    self.label = label
    self.gravity = gravity # [x,y] gravity for SELF
    self.fillOn = fillOn
    self.fillOff = fillOff
    self.baselineSkip = baselineSkip
  def dims(self) :
    log(self, ("DIMS FOR BUTTON", self.w, self.h))
    return self.w, self.h
  def draw_button_svg(self, id) :
    rf = 10
    out = '<path id="{9}" d="M{0} 0L{1} 0C{2} 0 {2} 0 {2} {3}L{2} {4}C{2} {5} {2} {5} {1} {5}L{0} {5}C0 {5} 0 {5} 0 {4}L0 {3}C0 0 0 0 {0} 0" style="fill:{6};stroke:{7};" onmousedown="(button_down(\'{9}\',\'{8}\'))()" onmouseup="(button_up(\'{9}\',\'{6}\'))()"/>'.format(
      rf,
      self.w - rf,
      self.w,
      rf,
      self.h - rf,
      self.h,
      color_to_rgb(self.fillOff),
      color_to_rgb(BLACK),
      color_to_rgb(self.fillOn),
      id)
    return out
  def draw_label_svg(self) :
    out = '<text transform="translate({0},{1})" text-anchor="middle"><tspan>{2}</tspan></text>'.format(
      self.w / 2.0,
      self.h / 2.0 + self.baselineSkip,
      self.label)
    return out
  def export_to_svg(self) :
    # In svg, the width and height of text can be guessed but is often
    # browser specific. We get around this by always adding the text
    # after everything else so nothing else's position depends on it
    id = randString()
    group_open = self.open_group_svg()
    button = self.draw_button_svg(id)
    label = self.draw_label_svg()
    group_close = self.close_group_svg()
    return group_open + button + label + group_close

class FaustNumericalEntry(FaustIncrementalObject) :
  '''
  Uses keydowns to fill the box.
  Heavy on Javascript.
  '''
  def __init__(self, mom=None, label='foo', gravity=(CENTER, CENTER), mn=0, mx=100, default=50, step=1, lpadding_y = TEXT_HEIGHT, box_padding = TEXT_BOX_PADDING, value_box_w = VALUE_BOX_W, value_box_h = VALUE_BOX_H) :
    FaustObject.__init__(self)
    self.mom = mom
    self.value_box_w = value_box_w
    self.value_box_h = value_box_h
    self.label = label
    self.gravity = gravity # [x,y] gravity for SELF
    self.mn = mn
    self.mx = mx
    self.default = default
    self.box_padding = box_padding
    self.lpadding_y = lpadding_y
    self.step = step
  def internal_dims(self) :
    dims = (self.value_box_w, self.value_box_h)
    log(self, ("DIMS FOR NUMERICAL ENTRY",) + dims)
    return dims
  def dims(self) :
    ugh = self.internal_dims()
    return ugh[0], ugh[1] + self.lpadding_y + TEXT_PADDING
  def make_key_sink_function(self, id) :
    out = 'make_key_sink(\'{0}\',{1},{2},{3},{4})'.format(
      id,
      self.mn,
      self.mx,
      self.step,
      self.default
    )
    return out
  def export_to_svg(self) :
    id = randString()
    fn = self.make_key_sink_function(id)
    group_open = self.open_group_svg()
    box = self.draw_value_box_svg(id, fn)
    text = self.draw_value_svg(id, fn)
    label = self.draw_label_svg(id)
    group_close = self.close_group_svg()
    return group_open + box + text + label + group_close

class LayoutManager(FaustObject) :
  def __init__(self, mom=None, o=X_AXIS, padding=10, objects=None, gravity = (CENTER, CENTER), label='foo', lpadding_y=TEXT_HEIGHT, box_padding=TEXT_BOX_PADDING) :
    self.mom = mom
    self.o = o
    self.padding = padding
    self.objects = objects
    if not self.objects :
      self.objects = []
    self.gravity = gravity # [x,y] gravity for SELF
    self.x = 0
    self.y = 0
    self.w = 0
    self.h = 0
    self.label = label
    self.lpadding_y = lpadding_y
    self.box_cache = Box()
  def dims(self) :
    ugh = self.internal_dims()
    out = (ugh[0], ugh[1] + self.lpadding_y + TEXT_PADDING)
    log(self, ("DIMS FOR LAYOUT MANAGER",)+out+(self.x, self.y))
    return out
  def internal_dims(self) :
    out = [[object.dims()[x] for object in self.objects] for x in [X_AXIS, Y_AXIS]]
    ops = xy(self.o, [sum,max], [max,sum])
    for x in range(NO_AXES) :
      out[x] = ops[x](out[x])
    out[other_axis(self.o)] += (self.padding * 2)
    out[self.o] += (self.padding * (len(self.objects) + 1))
    return tuple(out)
  def get_ratio_and_leftover(self, x, y) :
    dims = self.internal_dims()
    ratio = min(1.0 * x / dims[X_AXIS], 1.0 * y / dims[Y_AXIS])
    log(self, ("RATIO FOR LAYOUT MANAGER", ratio))
    leftover = (x - (dims[X_AXIS] * ratio), y - (dims[Y_AXIS] * ratio))
    log(self, ("LEFTOVER FOR LAYOUT MANAGER", leftover))
    return ratio, leftover
  def get_real_points(self) :
    rp = []
    for object in self.objects :
      if isinstance(object, LayoutManager) :
        rp += object.get_real_points()
      else :
        dim = object.dims()
        x = object.get_x_offset()
        y = object.get_y_offset()
        rp.append((x,y))
        rp.append((x+dim[0], y+dim[1]))
    # we want to account for lpadding and textheight, so...
    rp.sort(key = lambda x:x[1])
    rp.append((rp[-1][0], rp[-1][1] + max(self.lpadding_y, self.padding)))
    rp.append((rp[0][0], rp[0][1] - self.padding))
    rp.sort()
    rp.append((rp[-1][0] + self.padding, rp[-1][1]))
    rp.append((rp[0][0] - self.padding, rp[0][1]))
    return rp
  def do_spacing(self, x, y) :
    # we place objects in their place according to gravity
    # we allow layout managers to fill the full space they're allotted
    # for now, we let stuff mess up if the dims are too squished
    self.w = x
    self.h = y
    ratio, leftover = self.get_ratio_and_leftover(x, y)
    # increase padding by size
    padding = self.padding * ratio
    # the first padding will need to account for any additional space, thus
    # the call to jvalue with the leftover
    # use self.gravity, as object gravities will be used internally
    running_count = padding + jvalue(leftover[self.o], LEFT, self.gravity[self.o])
    for z in range(len(self.objects)) :
      object = self.objects[z]
      dim = object.dims()
      # find dimensions
      nx = xy(self.o, dim[X_AXIS] * ratio, x)
      ny = xy(self.o, y, dim[Y_AXIS] * ratio)
      if isinstance(object, LayoutManager) :
        # find offsets
        object.x = xy(self.o, running_count, 0)
        object.y = xy(self.o, 0, running_count)
        object.do_spacing(nx, ny)
      elif isinstance(object, TabGroup) :
        object.setX(xy(self.o, running_count, 0))
        object.setY(xy(self.o, 0, running_count))
        object.do_spacing(nx, ny)
      else :
        xv1 = xy(self.o, running_count, 0)
        xv2 = xy(self.o, running_count + (dim[X_AXIS] * (ratio - 1)), x - dim[X_AXIS])
        #log(self, ("RATIO", ratio, "X", x, "Y", y))
        #log(self, ("X1", xv1, "X2", xv2, "LC", linear_combination(object.gravity[X_AXIS], xv1, xv2)))
        object.x = linear_combination(object.gravity[X_AXIS], xv1, xv2)
        yv1 = xy(self.o, 0, running_count)
        yv2 = xy(self.o, y - dim[Y_AXIS], running_count + (dim[Y_AXIS] * (ratio - 1)))
        #log(self, ("Y1", yv1, "Y2", yv2, "LC", linear_combination(object.gravity[Y_AXIS], yv1, yv2)))
        object.y = linear_combination(object.gravity[Y_AXIS], yv1, yv2)
      running_count += padding + (xy(self.o, dim[X_AXIS], dim[Y_AXIS]) * ratio)
    # we only want to draw boxes around content
    my_x = self.get_x_offset()
    my_y = self.get_y_offset()
    realpoints = [coord_sub(pt, (my_x, my_y)) for pt in self.get_real_points()]
    for point in realpoints :
      self.box_cache.add_point(point)
  def draw_label_svg(self) :
    # there will be a horizontal issue with the label
    out = '<text transform="translate({0},{1})"><tspan>{2}</tspan></text>'.format(
      self.box_cache.x[0] + 3,
      self.box_cache.y[1] - 3,
      self.label)
    return out
  def background_svg(self) :
    #dims = self.dims()
    #ratio, leftover = self.get_ratio_and_leftover(self.w, self.h)
    #padding = self.padding * ratio
    #xshift = padding + jvalue(leftover[self.o], LEFT, self.gravity[self.o]) if self.o == X_AXIS else jvalue(self.w, LEFT, self.gravity[self.o])
    log(self, ("DIMS FOR BACKGROUND BOX "+str(self.box_cache),))
    out = '<path transform="translate({2},{3})" d="M0 0L{0} 0L{0} {1}L0 {1}L0 0" fill="{4}" stroke="black"/>'.format(
      self.box_cache.x[1] - self.box_cache.x[0],
      self.box_cache.y[1] - self.box_cache.y[0],
      self.box_cache.x[0],
      self.box_cache.y[0],
      color_to_rgb(magic_color())
    )
    return out
  def export_to_svg(self) :
    group_open = self.open_group_svg()    
    background = self.background_svg()
    main = ''.join([object.export_to_svg() for object in self.objects])
    label = self.draw_label_svg()
    group_close = self.close_group_svg()
    return group_open + background + main + label + group_close

class TabGroup(FaustObject) :
  def __init__(self, mom=None, headroom=40, objects=None, default = 0) :
    self.mom = mom
    self.objects = [] if not objects else objects
    self.headroom = headroom
    self.default = 0
  def setX(self, x) :
    self.x = x
    for obj in self.objects :
      obj.x = x
  def setY(self, y) :
    self.y = y
    for obj in self.objects :
      obj.y = y
  def do_spacing(self, x, y) :
    for obj in self.objects :
      obj.do_spacing(x, y)
  def export_to_svg() :
    group_open = self.open_group_svg()
    main = ''.join([object.export_to_svg() for object in self.objects])
    label = self.draw_label_svg()
    group_close = self.close_group_svg()
    return group_open + main + label + group_close

class XMLDocument(object) :
  def js_open(self) :
    out = '<script type="text/javascript">'
    return out
  def js_close(self) :
    out = '</script>'
    return out
  def css_open(self) :
    out = '<style type="text/css">'
    return out
  def css_close(self) :
    out = '</style>'
    return out

class SVGDocument(XMLDocument) :
  def __init__(self, js='', css='', lm=None, w=1200, h=800, verbose=False) :
    self.js = js
    self.css = css
    self.lm = lm
    self.w = w
    self.h = h
    self.verbose = verbose
  def get_x_offset(self) : return 0
  def get_y_offset(self) : return 0
  def svg_open(self) :
    out = '<svg xmlns="http://www.w3.org/2000/svg">'
    return out
  def svg_close(self) :
    out = '</svg>'
    return out
  def export_to_svg(self) :
    svg_open = self.svg_open()
    js_open = self.js_open()
    js = self.js
    js_close = self.js_close()
    css_open = self.css_open()
    css = self.css
    css_close = self.css_close()
    # trigger spacing calculations
    self.lm.do_spacing(self.w, self.h)
    main = self.lm.export_to_svg()
    svg_close = self.svg_close()
    return svg_open+js_open+js+js_close+css_open+css+css_close+main+svg_close
