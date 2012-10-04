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

# m4g1c values
TEXT_HEIGHT = 15
TEXT_PADDING = 10

class FaustObject(object) :
  def open_group_svg(self) :
    out = '<g transform="translate(X,Y)">'
    out = out.replace("X", str(self.x))
    out = out.replace("Y", str(self.y))
    return out
  def close_group_svg(self) :
    out = '</g>'
    return out

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
  def draw_unsliding_component_svg(self, fill, stroke, kls) :
    out = '<path d="M0 0LX 0LX YL0 YL0 0" style="fill:F;stroke:S;" class="C" />'
    out = out.replace('X', str(xy(self.o, self.sa, self.wa)))
    out = out.replace('Y', str(xy(self.o, self.wa, self.sa)))
    out = out.replace('F', fill)
    out = out.replace('S', stroke)
    out = out.replace('C', kls)
    return out
  def draw_unsliding_part_inside_svg(self) :
    return self.draw_unsliding_component_svg(color_to_rgb(self.fill), 'none', 'faust_slider_unsliding_part_border')
  def draw_unsliding_part_border_svg(self) :
    return self.draw_unsliding_component_svg('none', color_to_rgb(BLACK), 'faust_slider_unsliding_part_inside')
  def draw_sliding_component_svg(self, id_stem, fill, stroke, kls, ending) :
    slider_girth = self.sa  * self.sp
    half_slider_girth = slider_girth * 0.5
    startp = remap(self.default, self.mn, self.mx, 0 + half_slider_girth, self.sa - half_slider_girth)
    bottom = startp - half_slider_girth
    top = startp + half_slider_girth
    out = '<path id="IQ" d="MX0 Y0LX1 Y0LX1 Y1LX0 Y1LX0 Y0" style="fill:C;stroke:R" class="K" onclick="F(I,X,Y,MN,MX,S)"/>'
    out = out.replace('X0', str(xy(self.o, bottom, 0)))
    out = out.replace('X1', str(xy(self.o, top, self.wa)))
    out = out.replace('Y0', str(xy(self.o, 0, bottom)))
    out = out.replace('Y1', str(xy(self.o, self.wa, top)))
    out = out.replace('MN', str(self.mn))
    out = out.replace('MX', str(self.mx))
    out = out.replace('S', str(self.step))
    out = out.replace('Q', str(ending))
    out = out.replace('C', fill)
    out = out.replace('R', stroke)
    out = out.replace('K', kls)
    out = out.replace('F', xy(self.o,'horizontal_slide','vertical_slide'))
    out = out.replace('X', str(xy(self.o,self.sa,self.wa)))
    out = out.replace('Y', str(xy(self.o,self.wa,self.sa)))
    out = out.replace('I', str(id_stem))
    return out
  def draw_sliding_part_inside_svg(self, id_stem) :
    return self.draw_sliding_component_svg(id_stem, color_to_rgb(GREY), 'none', 'faust_slider_sliding_part_inside', '_inside')
  def draw_sliding_part_border_svg(self, id_stem) :
    return self.draw_sliding_component_svg(id_stem, 'none', color_to_rgb(BLACK), 'faust_slider_sliding_part_border', '_border')
  def draw_label_svg(self) :
    out = '<text transform="translate(0,Y)"><tspan>L</tspan></text>'
    out = out.replace('Y',str(xy(self.o,self.wa,self.sa) + self.lpadding))
    out = out.replace("L",str(self.label))
    return out
  def export_to_svg(self) :
    # In svg, the width and height of text can be guessed but is often
    # browser specific. We get around this by always adding the text
    # after everything else so nothing else's position depends on it
    id_stem = randString()
    group_open = self.open_group_svg()
    unsliding_part_inside = self.draw_unsliding_part_inside_svg()
    unsliding_part_border = self.draw_unsliding_part_border_svg()
    sliding_part_inside = self.draw_sliding_part_inside_svg(id_stem)
    sliding_part_border = self.draw_sliding_part_border_svg(id_stem)
    label = self.draw_label_svg()
    group_close = self.close_group_svg()
    return group_open + unsliding_part_inside + unsliding_part_border + sliding_part_inside + sliding_part_border + label + group_close

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
  def svg_open(self) :
    out = '<svg>'
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
