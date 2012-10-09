'''
only use paths and arcs
even though svg has native support for other elements (polygon, rectangle etc.),
it is a pain for people writing converters and backends to
cover all these cases.
the goal is to find the minimum number of elemetns that can articulate our needs
- path for lines and bezier curves
- arc for circles and parts of circles
'''

from utilities import *
import cmath

# m4g1c values
TEXT_HEIGHT = 15
TEXT_PADDING = 10

class FaustObject(object) :
  def open_group_svg(self) :
    out = '<g transform="translate(X,Y)">'
    out = out.replace("X", str(self.x))
    out = out.replace("Y", str(self.y))
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

class FaustRotatingButton(FaustObject) :
  '''
  ALL ANGLES EXPRESSED IN DEGREES
  a0 = initial angle
  sweep = number of degrees :: ALWAYS POSITIVE
  '''
  def __init__(self, mom=None, r=50, a0=180, sweep=180, sp=0.1, label='foo', unit='grames', default=50, mn=0, mx=100, step=1, lpadding=TEXT_HEIGHT, gravity=(CENTER, CENTER), fill=CYAN) :
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
    self.default = default
    self.mn = mn
    self.mx = mx
    self.step = step
    self.lpadding = lpadding
    self.gravity = gravity # [x,y] gravity for SELF
    self.fill = fill
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
    return ugh[0], ugh[1] + self.lpadding + TEXT_PADDING
  def get_translation(self) :
    # first, we need to translate the coordinate space so that the
    # left-bottom is 0,0
    coords = self.get_maybe_extremal_coords()
    return (min([coord[0] for coord in coords]), min([coord[0] for coord in coords]))
  def mobility_string(self, id, start_rot) :
    # ugh, in svg, rotate is weird. need to tack on 180 :(
    out = 'transform="translate(0,0) scale(1,1) rotate(SR,RX,RY)" id="ID" onmousedown="(rotate_button(\'ID\',A0,SW,P,RX,RY,OX,OY,MN,MX,S))()"'
    torig = coord_sub((0,0), self.get_translation())
    out = out.replace("SR", str(start_rot + 180))
    out = out.replace("SW", str(self.sweep))
    out = out.replace("P", str(self.sp))
    out = out.replace("A0", str(self.a0 + 180))
    out = out.replace("S", str(self.step))
    out = out.replace("RX", str(torig[0]))
    out = out.replace("RY", str(torig[1]))
    out = out.replace("OX", str(self.get_x_offset()))
    out = out.replace("OY", str(self.get_y_offset()))
    out = out.replace("MN", str(self.mn))
    out = out.replace("MX", str(self.mx))
    out = out.replace("ID", str(id))
    return out
  @staticmethod
  def generic_draw(origin, start, end, r, fill, stroke, instruction, small) :
    out = '<path d="MX0 Y0LX1 Y1 AR R ONEZERO 1 X2 Y2LX0 Y0" style="fill:F;stroke:S;" & />'
    out = out.replace("ONEZERO", '1 0' if small else '0 1')
    out = out.replace("X0", str(origin[0]))
    out = out.replace("Y0", str(origin[1]))
    out = out.replace("X1", str(start[0]))
    out = out.replace("Y1", str(start[1]))
    out = out.replace("X2", str(end[0]))
    out = out.replace("Y2", str(end[1]))
    out = out.replace("R", str(r))
    out = out.replace("F", fill)
    out = out.replace("S", stroke)
    out = out.replace("&", instruction)
    return out
  def draw_unsliding_part_svg(self) :
    # first, we need to translate the coordinate space so that the
    # left-bottom is 0,0
    trans = self.get_translation()
    start = coord_sub(rect_to_coord(cmath.rect(self.r, d2r(self.a0))), trans)
    end = coord_sub(rect_to_coord(cmath.rect(self.r, d2r(self.a0 + self.sweep))), trans)
    org = coord_sub((0,0), trans)
    return FaustRotatingButton.generic_draw(org, start, end, self.r, color_to_rgb(self.fill), color_to_rgb(BLACK), '', self.sweep < 180)
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
    instruction = self.mobility_string('faust_rotating_button_sliding_part'+id, startp - half_slider_angle)
    return FaustRotatingButton.generic_draw(org, start, end, self.r, color_to_rgb(GREY), color_to_rgb(BLACK), instruction, self.sweep * self.sp < 180)
  def draw_label_svg(self) :
    out = '<text transform="translate(0,Y)"><tspan>L</tspan></text>'
    out = out.replace('Y',str(self.internal_dims()[1] + self.lpadding))
    out = out.replace("L",str(self.label))
    return out
  def export_to_svg(self) :
    id = randString()
    group_open = self.open_group_svg()
    unsliding_part = self.draw_unsliding_part_svg()
    sliding_part = self.draw_sliding_part_svg(id)
    label = self.draw_label_svg()
    group_close = self.close_group_svg()
    return group_open + unsliding_part + sliding_part + label + group_close

class FaustSlider(FaustObject) :
  '''
  wa = size of the weak axis
  sa = size of the strong axis
  sp = percentage of the strong axis a slider takes up
  label = label
  unit = unit
  default = default value
  '''
  def __init__(self, mom=None, o=X_AXIS, wa=40, sa=200, sp=0.15, label='foo', unit='grames', default=50, mn=0, mx=100, step=1, lpadding=TEXT_HEIGHT, gravity=(CENTER, CENTER), fill=CYAN) :
    FaustObject.__init__(self)
    self.mom = mom
    self.o = o
    self.wa = wa
    self.sa = sa
    self.sp = sp
    self.label = label
    self.unit = unit
    self.default = default
    self.mn = mn
    self.mx = mx
    self.step = step
    self.lpadding = lpadding
    self.gravity = gravity # [x,y] gravity for SELF
    self.fill = fill
  def dims(self) :
    x = xy(self.o, self.sa, self.wa)
    y = xy(self.o, self.wa, self.sa)
    log(self, ("DIMS FOR SLIDER", x, y + self.lpadding + TEXT_PADDING))
    return x, y + self.lpadding + TEXT_PADDING
  def draw_unsliding_component_svg(self, fill, stroke) :
    out = '<path d="M0 0LX 0LX YL0 YL0 0" style="fill:F;stroke:S;" />'
    out = out.replace('X', str(xy(self.o, self.sa, self.wa)))
    out = out.replace('Y', str(xy(self.o, self.wa, self.sa)))
    out = out.replace('F', fill)
    out = out.replace('S', stroke)
    return out
  def draw_unsliding_part_svg(self) :
    return self.draw_unsliding_component_svg(color_to_rgb(self.fill), color_to_rgb(BLACK))
  def draw_sliding_component_svg(self, fill, stroke, kls, id) :
    slider_girth = self.sa  * self.sp
    half_slider_girth = slider_girth * 0.5
    startp = remap(self.default, self.mn, self.mx, 0 + half_slider_girth, self.sa - half_slider_girth)
    bottom = startp - half_slider_girth
    top = startp + half_slider_girth
    out = '<path transform="translate(TX,TY)" id="ID" d="M0 0LX 0LX YL0 YL0 0" style="fill:C;stroke:R" onmousedown="(F(\'ID\',T,P,MN,MX,S))()"/>'
    out = out.replace('MN', str(self.mn))
    out = out.replace('MX', str(self.mx))
    out = out.replace('TX', str(xy(self.o, bottom, 0)))
    out = out.replace('TY', str(xy(self.o, 0, bottom)))
    out = out.replace('X', str(xy(self.o, slider_girth, self.wa)))
    out = out.replace('Y', str(xy(self.o, self.wa, slider_girth)))
    out = out.replace('S', str(self.step))
    out = out.replace('C', fill)
    out = out.replace('R', stroke)
    out = out.replace('K', kls)
    out = out.replace('F', xy(self.o,'horizontal_slide','vertical_slide'))
    out = out.replace('T', str(self.sa))
    out = out.replace('P', str(self.sp))
    out = out.replace('ID', str(kls+id))
    return out
  def draw_sliding_part_svg(self, id) :
    return self.draw_sliding_component_svg(color_to_rgb(GREY), color_to_rgb(BLACK), 'faust_slider_sliding_part', id)
  def draw_label_svg(self) :
    out = '<text transform="translate(0,Y)"><tspan>L</tspan></text>'
    out = out.replace('Y',str(xy(self.o,self.wa,self.sa) + self.lpadding))
    out = out.replace("L",str(self.label))
    return out
  def export_to_svg(self) :
    # In svg, the width and height of text can be guessed but is often
    # browser specific. We get around this by always adding the text
    # after everything else so nothing else's position depends on it
    id = randString()
    group_open = self.open_group_svg()
    unsliding_part = self.draw_unsliding_part_svg()
    sliding_part = self.draw_sliding_part_svg(id)
    label = self.draw_label_svg()
    group_close = self.close_group_svg()
    return group_open + unsliding_part + sliding_part + label + group_close

class FaustHorizontalSlider(FaustSlider) :
  def __init__(self, mom=None, wa=40, sa=200, sp=0.15, label='foo', unit='grames', default=50, mn=0, mx=100, step=1, lpadding=TEXT_HEIGHT, gravity=(CENTER, CENTER), fill=CYAN) :
    FaustSlider.__init__(self, mom=mom, o=X_AXIS, wa=wa, sa=sa, sp=sp, label=label, unit=unit, default=default, mn=mn, mx=mx, step=step, lpadding=lpadding, gravity=gravity, fill=fill)

class FaustVerticalSlider(FaustSlider) :
  def __init__(self, mom=None, wa=40, sa=200, sp=0.15, label='foo', unit='grames', default=50, mn=0, mx=100, step=1, lpadding=TEXT_HEIGHT, gravity=(CENTER, CENTER), fill=CYAN) :
    FaustSlider.__init__(self, mom=mom, o=Y_AXIS, wa=wa, sa=sa, sp=sp, label=label, unit=unit, default=default, mn=mn, mx=mx, step=step, lpadding=lpadding, gravity=gravity, fill=fill)

class LayoutManager(FaustObject) :
  def __init__(self, mom=None, o=X_AXIS, padding=10, objects=[], gravity = (CENTER, CENTER)) :
    self.mom = mom
    self.o = o
    self.padding = padding
    self.objects = objects
    self.gravity = gravity # [x,y] gravity for SELF
    self.x = 0
    self.y = 0
  def dims(self) :
    out = [[object.dims()[x] for object in self.objects] for x in [X_AXIS, Y_AXIS]]
    ops = xy(self.o, [sum,max], [max,sum])
    for x in range(NO_AXES) :
      out[x] = ops[x](out[x])
    out[other_axis(self.o)] += (self.padding * 2)
    out[self.o] += (self.padding * (len(self.objects) + 1))
    log(self, ("DIMS FOR LAYOUT MANAGER",)+tuple(out))
    return tuple(out)
  def do_spacing(self, x, y) :
    # we place objects in their place according to gravity
    # we allow layout managers to fill the full space they're allotted
    # for now, we let stuff mess up if the dims are too squished
    dims = self.dims()
    ratio = min(1.0 * x / dims[X_AXIS], 1.0 * y / dims[Y_AXIS])
    log(self, ("RATIO FOR LAYOUT MANAGER", ratio))
    leftover = (x - (dims[X_AXIS] * ratio), y - (dims[Y_AXIS] * ratio))
    log(self, ("LEFTOVER FOR LAYOUT MANAGER", leftover))
    # increase padding by size
    padding = self.padding * ratio
    # the first padding will need to account for any additional space, thus
    # the call to jvalue with the leftover
    # use self.gravity, as object gravities will be used internally
    running_count = padding + jvalue(leftover[self.o], LEFT, self.gravity[self.o])
    for x in range(len(self.objects)) :
      object = self.objects[x]
      dim = object.dims()
      # find dimensions
      nx = xy(self.o, dim[X_AXIS] * ratio, x)
      ny = xy(self.o, y, dim[Y_AXIS] * ratio)
      if isinstance(object, LayoutManager) :
        # find offsets
        object.x = xy(self.o, running_count, 0)
        object.y = xy(self.o, 0, running_count)
        object.do_spacing(nx, ny)
      else :
        xv1 = xy(self.o, running_count, 0)
        xv2 = xy(self.o, running_count + (dim[X_AXIS] * (ratio - 1)), x - dim[X_AXIS])
        log(self, ("X1", xv1, "X2", xv2, "LC", linear_combination(object.gravity[X_AXIS], xv1, xv2)))
        object.x = linear_combination(object.gravity[X_AXIS], xv1, xv2)
        yv1 = xy(self.o, 0, running_count)
        yv2 = xy(self.o, y - dim[Y_AXIS], running_count + (dim[Y_AXIS] * (ratio - 1)))
        log(self, ("Y1", yv1, "Y2", yv2, "LC", linear_combination(object.gravity[Y_AXIS], yv1, yv2)))
        object.y = linear_combination(object.gravity[Y_AXIS], yv1, yv2)
      running_count += padding + (xy(self.o, dim[X_AXIS], dim[Y_AXIS]) * ratio)
  def export_to_svg(self) :
    group_open = self.open_group_svg()    
    main = ''.join([object.export_to_svg() for object in self.objects])
    group_close = self.close_group_svg()
    return group_open + main + group_close
  
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
  def __init__(self, js='', css='', lm=None, w=800, h=400, verbose=False) :
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
