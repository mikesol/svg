// all onload need to be pushed to the end of the creation

// we want to stay in the faust namespace, so...
var _FAUST_NAMESPACE = new Array();
_FAUST_NAMESPACE["TEXT_HEIGHT"] = 20;
_FAUST_NAMESPACE["TEXT_PADDING"] = 10;
_FAUST_NAMESPACE["VALUE_BOX_W"] = 60;
_FAUST_NAMESPACE["VALUE_BOX_H"] = _FAUST_NAMESPACE["TEXT_HEIGHT"];
_FAUST_NAMESPACE["TEXT_BOX_PADDING"] = 3;

// some convenience methods for inheritence

_FAUST_NAMESPACE["surrogateCtor"] = function() {}

_FAUST_NAMESPACE["extend"] = function(base, sub) {
  // Copy the prototype from the base to setup inheritance
  _FAUST_NAMESPACE["surrogateCtor"].prototype = base.prototype;
  sub.prototype = new _FAUST_NAMESPACE["surrogateCtor"]();
  // Remember the constructor property was set wrong, let's fix it
  sub.prototype.constructor = sub;
}

/*
  DEFINES THE FAUST OBJECT CLASS.
  All graphical objects inherit from this.
*/

_FAUST_NAMESPACE["FaustObject"] = function() {
  this.x = 0.0;
  this.y = 0.0;
}

_FAUST_NAMESPACE["FaustObject"].prototype.make_group = function(svg, parent, id, onload, onload_params) {
  var out = null;
  if (parent != null) {
    out = svg.group(
      parent,
      id,
      {
        transform: 'translate('+this.x+','+this.y+')'
        id: id;
      });
  }
  else {
    out = svg.group(
      id,
      {
        transform: 'translate('+this.x+','+this.y+')'
      });
  }
  if (onload != null) {
    out.bind('onload', onload_params, onload);
  }
  return out;
}

_FAUST_NAMESPACE["FaustObject"].prototype.get_x_offset = function() {
  if (!this.mom) {
    return this.x;
  }
  return this.x + this.mom.get_x_offset();
}

_FAUST_NAMESPACE["FaustObject"].prototype.get_y_offset = function() {
  if (!this.mom) {
    return this.y;
  }
  return this.y + this.mom.get_y_offset();
}

_FAUST_NAMESPACE["FaustObject"].prototype.compress = function() {
  // does nothing
}

/*
  DEFINES THE FAUST INCREMENTAL OBJECT CLASS.
  All objects that go up in increments inherit from this.
*/

_FAUST_NAMESPACE["FaustIncrementalObject"] = function () {}
_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["FaustObject"], _FAUST_NAMESPACE["FaustIncrementalObject"]);

_FAUST_NAMESPACE["FaustIncrementalObject"].prototype.make_value_box = function(svg, parent, id, mousedown, mousedown_params) {
  var vb = svg.path(
    parent,
    "M0 0L"+this.value_box_w+" 0L"+this.value_box_w+" "+this.value_box_h+"L0 "+this.value_box_h+"L0 0",
    {
      id: 'faust_value_box_'+id,
      transform: 'translate(0,'+(this.internal_dims()[1] + this.box_padding)+')',
      style: 'fill:white;stroke:black;'
    }
  );
  vb.bind('mousedown', mousedown_params, mousedown);
  //return vb;
}

_FAUST_NAMESPACE["FaustIncrementalObject"].prototype.make_value_value = function(svg, parent, id, mousedown, mousedown_params) {
  var vv = svg.text(
    parent,
    0,
    0,
    this.def,
    {
      id: 'faust_value_value_'+id,
      transform: 'translate('+this.box_padding+','+(this.internal_dims()[1] + this.lpadding_y)+')',
      style: 'fill:white;stroke:black;'
    }
  );
  vv.bind('mousedown', mousedown_params, mousedown);
  //return vv;
}

_FAUST_NAMESPACE["FaustIncrementalObject"].prototype.make_label = function(svg, parent,id) {
  var vl = svg.text(
    parent,
    0,
    0,
    this.label,
    {
      id: 'faust_label_'+id,
      transform: 'translate(0,'+(this.internal_dims()[1] + this.lpadding_y + this.lpadding_y)+')',
      style: 'fill:white;stroke:black;'
    }
  );
  //return vl;
}

/*
  DEFINES A ROTATING BUTTON.
*/

_FAUST_NAMESPACE["FaustRotatingButton"] = function(options) {
  this.mom = options.mom || null;
  this.ir = options.ir || 50;
  this.mr = options.mr || 25;
  this._r = this.ir;
  var a0 = options.a0 || 180;
  var sweep = options.sweep || 180;
  if (sweep < 0) {
    a0 += sweep;
    sweep = Math.abs(sweep);
  }
  sweep = sweep % 360;
  if (sweep == 0) {
    sweep = 360;
  }
  this.a0 = a0;
  this.sweep = sweep;
  this.sp = options.sp || 0.1;
  this.label = options.label || 'foo';
  this.unit = options.unit || 'unit';
  this.mn = options.mn || 0;
  this.mx = options.mx || 100;
  this.def = _FAUST_NAMESPACE["bound"](options.def || 50, this.mn, this.mx);
  this.step = options.step || 1;
  this.step = options.step || 1;
  this.lpadding_y = options.lpadding_y || _FAUST_NAMESPACE["TEXT_HEIGHT"];
  this.box_padding = options.box_padding || _FAUST_NAMESPACE["TEXT_BOX_PADDING"];
  this.gravity options.gravity || {0 : _FAUST_NAMESPACE["CENTER"], 1: _FAUST_NAMESPACE["CENTER"])};
  this.fill= options.fill || _FAUST_NAMESPACE["CYAN"];
  this.value_box_w = options.value_box_w || _FAUST_NAMESPACE["VALUE_BOX_W"];
  this.value_box_h = options.value_box_h || _FAUST_NAMESPACE["VALUE_BOX_H"];
  this.address = options.address || '';
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["FaustIncrementalObject"], _FAUST_NAMESPACE["FaustRotatingButton"]);

_FAUST_NAMESPACE["FaustRotatingButton"].prototype.compress = function(coef) {
  this._r = Math.max(this.mr, this._r * coef);
}

_FAUST_NAMESPACE["FaustRotatingButton"].prototype.r = function() {
  return this._r;
}

/*
  def get_maybe_extremal_coords(self) :
    angles = sorted(list(set(find_all_90s(self.a0, self.sweep) + [self.a0, self.a0 + self.sweep])))
    return [rect_to_coord(cmath.rect(*polar)) for polar in [(self.r(), d2r(angle)) for angle in angles]]+[(0,0)]
*/

_FAUST_NAMESPACE["FaustRotatingButton"].prototype.get_maybe_extremal_coords = function() {
  var angles = _FAUST_NAMESPACE["find_all_90s"](this.a0, this.sweep);
  angles.push(this.a0);
  angles.push(this.a0 + this.sweep);
  angles.sort();
  var coords = new Array();
  for (var i = 0; i < angles.length; i++) {
    coords.push(_FAUST_NAMESPACE["point_from_polar"](this.r(), _FAUST_NAMESPACE["d2r"](angles[i])));
  }
  coords.push([0,0]);
  return coords;
}

_FAUST_NAMESPACE["FaustRotatingButton"].prototype.internal_dims = function() {
  var coords = this.get_maybe_extremal_coords();
  var box = _FAUST_NAMESPACE["Box"]();
  for (var i = 0; i < coords.length; i++) {
    box.add_point(coords[i]);
  }
  var ugh = box.lens();
  return ugh;
}

_FAUST_NAMESPACE["FaustRotatingButton"].prototype.dims = function() {
  var ugh = this.internal_dims();
  return [max(ugh[0], this.value_box_w), ugh[1] + (2 * this.lpadding_y) + _FAUST_NAMESPACE["TEXT_PADDING"]];
}

_FAUST_NAMESPACE["FaustRotatingButton"].prototype.get_translation = function() {
  var coords = this.get_maybe_extremal_coords();
  var x = Number.POSITIVE_INFINITY;
  var y = Number.POSITIVE_INFINITY;
  for (var i = 0; i < coords.length; i++) {
    x = Math.min(x, coords[i][0]);
    y = Math.min(x, coords[i][1]);
  }
  return [x,y];
}

_FAUST_NAMESPACE["FaustRotatingButton"].prototype.make_joint = function(svg, g, id) {
  var trans = this.get_translation()
  var start = _FAUST_NAMESPACE["coord_sub"](_FAUST_NAMESPACE["point_from_polar"](this.r(), _FAUST_NAMESPACE["d2r"](this.a0)), trans);
  var end = _FAUST_NAMESPACE["coord_sub"](_FAUST_NAMESPACE["point_from_polar"](this.r(), _FAUST_NAMESPACE["d2r"](this.a0 + this.sweep)), trans);
  var origin = _FAUST_NAMESPACE["coord_sub"]([0,0], trans);
  var small = this.sweep < 180;
  svg.path(
    g,
    "M"+origin[0]+" "+origin[1]+"L"+start[0]+" "+start[1]+"A"+this.r()+" "+this.r()+" "+(small ? "1 0" : "0 1")+" 1 "+end[0]+" "+end[1]+"L"+origin[0]+" "+origin[1],
    {
      style : "fill:"+_FAUST_NAMESPACE["color_to_rgb"](this.fill)+";stroke:black;",
      id : 'faust_rbutton_joint_'+id
    }
  );
}
_FAUST_NAMESPACE["FaustRotatingButton"].prototype.make_knob = function(svg, g, id) {
  var trans = this.get_translation();
  var slider_angle = this.sweep * this.sp;
  var half_slider_angle = slider_angle * 0.5;
  var startp = _FAUST_NAMESPACE["remap"](this.def, this.mn, this.mx, this.a0 + half_slider_angle, this.a0 + this.sweep - half_slider_angle)
  var start = _FAUST_NAMESPACE["coord_sub"](_FAUST_NAMESPACE["point_from_polar"](this.r(), _FAUST_NAMESPACE["d2r"](this.a0)), trans);
  var end = _FAUST_NAMESPACE["coord_sub"](_FAUST_NAMESPACE["point_from_polar"](this.r(), _FAUST_NAMESPACE["d2r"](this.a0 + slider_angle)), trans);
  var origin = _FAUST_NAMESPACE["coord_sub"]([0,0], trans);
  var small = this.sweep * this.sp < 180;
  var full_id = 'faust_rbutton_knob_'+id;

  var knob = svg.path(
    g,
    "M"+origin[0]+" "+origin[1]+"L"+start[0]+" "+start[1]+"A"+this.r()+" "+this.r()+" "+(small ? "1 0" : "0 1")+" 1 "+end[0]+" "+end[1]+"L"+origin[0]+" "+origin[1],
    {
      style : "fill:grey;stroke:black;",
      id : full_id;
      transform : 'translate(0,0) scale(1,1) rotate('+(startp - half_slider_angle + 180)+','+origin[0]+','+origin[1]+')';
    }
  );
  
  knob.bind(
    'load',
    {
      id : full_id,
      a0 : this.a0 + 180,
      sweep : this.sweep,
      sp : this.sp,
      rx : origin[0],
      ry : origin[1],
      ox : this.get_x_offset(),
      oy : this.get_y_offset(),
      mn : this.mn,
      mx : this.mx,
      step : this.step,
      label : this.label,
      address : this.address
    },
    _FAUST_NAMESPACE["initiate_rbutton"]
  );

  knob.bind(
    'mousedown',
    { id : full_id },
    _FAUST_NAMESPACE["activate_rbutton"]
  )
}

_FAUST_NAMESPACE["FaustRotatingButton"].prototype.make = function(svg, parent) {
  var id = _FAUST_NAMESPACE["randString"]();
  var g = this.make_group(svg, parent, id);
  this.make_joint(svg, g, id);
  this.make_knob(svg, g, id);
  this.make_value_box(svg, g, id, _FAUST_NAMESPACE["rotating_button_key_sink"], {id : this.id});
  this.make_value_value(svg, g, id, _FAUST_NAMESPACE["rotating_button_key_sink"], {id : this.id});
  this.make_label(svg, g, id);
  //return true;
}

/*
  DEFINES A SLIDER.
*/

_FAUST_NAMESPACE["FaustSlidingObject"] = function(options) {
  this.mom = options.mom || null;
  this.o = options.o || _FAUST_NAMESPACE["X_AXIS"];
  this.iwa = options.iwa || 40;
  this.isa = options.isa || 200;
  this.mwa = options.mwa || 20;
  this.msa = options.msa || 100;
  this.label = options.label || 'foo';
  this.unit = options.unit || 'grames';
  this.mn = options.mn || 0;
  this.mx = options.mx || 100;
  this.def = _FAUST_NAMESPACE["bound"](options.def || 50, this.mn, this.mx);
  this.step = options.step || 1;
  this.lpadding_y = options.lpadding_y || _FAUST_NAMESPACE["TEXT_HEIGHT"];
  this.box_padding = options.box_padding || _FAUST_NAMESPACE["TEXT_BOX_PADDING"];
  this.gravity = options.gravity || [_FAUST_NAMESPACE["CENTER"], _FAUST_NAMESPACE["CENTER"]];
  this.fill = options.fill || _FAUST_NAMESPACE["CYAN"];
  this.value_box_w = options.value_box_w || _FAUST_NAMESPACE["VALUE_BOX_W"];
  this.value_box_h = options.value_box_h || _FAUST_NAMESPACE["VALUE_BOX_H"];
  this.address = options.address || '';
  this.type = options.type || '';
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["FaustIncrementalObject"], _FAUST_NAMESPACE["FaustSlidingObject"]);

_FAUST_NAMESPACE["FaustSlidingObject"].prototype.compress = function(coef) {
  this._wa = Math.max(this.mwa, this._wa * coef);
  this._sa = Math.max(this.msa, this._sa * coef);
}

_FAUST_NAMESPACE["FaustSlidingObject"].prototype.wa = function() {
  return this._wa;
}

_FAUST_NAMESPACE["FaustSlidingObject"].prototype.sa = function() {
  return this._sa;
}

_FAUST_NAMESPACE["FaustSlidingObject"].prototype.internal_dims = function() {
  var x = _FAUST_NAMESPACE["xy"](this.o, this.sa(), this.wa());
  var y = _FAUST_NAMESPACE["xy"](this.o, this.wa(), this.sa());
  return [x,y];
}

_FAUST_NAMESPACE["FaustSlidingObject"].prototype.dims = function() {
  var ugh = this.internal_dims();
  ugh = [Math.max(ugh[0], this.value_box_w), ugh[1] + (2 * this.lpadding_y) + _FAUST_NAMESPACE["TEXT_PADDING"]];
  return ugh;
}

_FAUST_NAMESPACE["FaustSlidingObject"].prototype.make_joint = function(svg, g, id) {
  var w = _FAUST_NAMESPACE["xy"](this.o, this.sa(), this.wa());
  var h = _FAUST_NAMESPACE["xy"](this.o, this.wa(), this.sa());
  svg.path(
    g,
    "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0",
    {
      id : 'faust_'+this.type+'_joint_'+id,
      style : "fill:"+_FAUST_NAMESPACE["color_to_rgb"](this.fill)+";stroke:black;"
    }
  )
}

_FAUST_NAMESPACE["FaustSlider"] = function(options) {
  _FAUST_NAMESPACE["FaustSlidingObject"].call(this, options);
  this.sp = options.sp || 0.15;
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["FaustSlidingObject"], _FAUST_NAMESPACE["FaustSlider"]);

_FAUST_NAMESPACE["FaustSlider"].prototype.make_knob = function(svg, g, id) {
  var slider_girth = this.sa()  * this.sp;
  var half_slider_girth = slider_girth * 0.5;
  var startp = _FAUST_NAMESPACE["remap"](this.def, this.mn, this.mx, 0 + half_slider_girth, this.sa() - half_slider_girth);
  var bottom = startp - half_slider_girth;
  var top = startp + half_slider_girth;
  var w = _FAUST_NAMESPACE["xy"](this.o, slider_girth, this.wa());
  var h = _FAUST_NAMESPACE["xy"](this.o, this.wa(), slider_girth);
  var x = _FAUST_NAMESPACE["xy"](this.o, bottom, 0);
  var y = _FAUST_NAMESPACE["xy"](this.o, 0, bottom);
  var full_id = 'faust_'+this.type+'_knob_'+id;
  knob = svg.path(
    g,
    "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0",
    {
      id : full_id,
      style : "fill:grey;stroke:black;",
      transform : 'translate('+x+','+y+')';
    }
  );

  knob.bind(
    'load',
    {
      id : full_id,
      sa : this.sa(),
      sp : this.sp,
      mn : this.mn,
      mx : this.mx,
      step : this.step,
      label : this.label,
      address : this.address
    },
    _FAUST_NAMESPACE['initiate_'+this.type]
  );

  knob.bind(
    'mousedown',
    { id : full_id },
    _FAUST_NAMESPACE['activate_'+this.type]
  )
}

_FAUST_NAMESPACE["FaustSlider"].prototype.make = function(svg, parent) {
  var id = _FAUST_NAMESPACE["randString"]();
  var g = this.make_group(svg, parent, id);
  this.make_joint(svg, g, id);
  this.make_knob(svg, g, id);
  this.make_value_box(
    svg,
    g,
    id,
    _FAUST_NAMESPACE[this.type+'_key_sink'],
    {id : this.id}
  );
  this.make_value_value(
    svg,
    g,
    id,
    _FAUST_NAMESPACE[this.type+'_key_sink'],
    {id : this.id}
  );
  this.make_label(svg, g, id);
  //return true;
}

/*
  DEFINES A HORIZONTAL SLIDER.
*/

_FAUST_NAMESPACE["FaustHorizontalSlider"] = function(options) {
  options = options || {};
  options["o"] = _FAUST_NAMESPACE["X_AXIS"];
  options["type"] = 'hslider';
  _FAUST_NAMESPACE["FaustSlider"].call(this, options);
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["FaustSlider"], _FAUST_NAMESPACE["FaustHorizontalSlider"]);

/*
  DEFINES A VERTICAL SLIDER.
*/

_FAUST_NAMESPACE["FaustVerticalSlider"] = function(options) {
  options = options || {};
  options["o"] = _FAUST_NAMESPACE["Y_AXIS"];
  options["type"] = 'vslider';
  _FAUST_NAMESPACE["FaustSlider"].call(this, options);
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["FaustSlider"], _FAUST_NAMESPACE["FaustVerticalSlider"]);

_FAUST_NAMESPACE["FaustBarGraph"] = function(options) {
  _FAUST_NAMESPACE["FaustSlidingObject"].call(this, options);
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["FaustSlidingObject"], _FAUST_NAMESPACE["FaustBarGraph"]);

_FAUST_NAMESPACE["FaustBarGraph"].prototype.make_meter = function(svg, g, id) {
  var full_id = 'faust_'+this.type+'_meter_'+id;
  def = _FAUST_NAMESPACE["remap"](this.def, this.mn, this.mx, 0, this.sa())
  var w = _FAUST_NAMESPACE["xy"](self.o, def, self.wa());
  var h = _FAUST_NAMESPACE["xy"](self.o, self.wa(), def);
  meter = svg.path(
    g,
    "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0",
    {
      id : full_id,
      style : "fill:grey;stroke:black;"
    }
  );

  meter.bind(
    'load',
    {
      id : full_id,
      address : this.address
    },
    _FAUST_NAMESPACE['initiate_'+this.type]
  );
}

_FAUST_NAMESPACE["FaustBarGraph"].prototype.make = function(svg, parent) {
  var id = _FAUST_NAMESPACE["randString"]();
  var g = this.make_group(svg, parent, id);
  this.make_joint(svg, g, id);
  this.make_meter(svg, g, id);
  this.make_value_box(
    svg,
    g,
    id
  );
  this.make_value_value(
    svg,
    g,
    id
  );
  this.make_label(svg, g, id);
  //return true;
}

/*
  DEFINES A HORIZONTAL BAR GRAPH.
*/

_FAUST_NAMESPACE["FaustHorizontalBarGraph"] = function(options) {
  options = options || {};
  options["o"] = _FAUST_NAMESPACE["X_AXIS"];
  options["type"] = 'hbargraph';
  _FAUST_NAMESPACE["FaustBarGraph"].call(this, options);
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["FaustBarGraph"], _FAUST_NAMESPACE["FaustHorizontalBarGraph"]);

/*
  DEFINES A VERTICAL BAR GRAPH.
*/

_FAUST_NAMESPACE["FaustVerticalBarGraph"] = function(options) {
  options = options || {};
  options["o"] = _FAUST_NAMESPACE["Y_AXIS"];
  options["type"] = 'vbargraph';
  _FAUST_NAMESPACE["FaustBarGraph"].call(this, options);
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["FaustBarGraph"], _FAUST_NAMESPACE["FaustVerticalBarGraph"]);

_FAUST_NAMESPACE["FaustCheckBox"] = function(options) {
  this.MAGIC = 19; // not optional...
  this.mom = options.mom || null;
  this.d = options.d || 19;
  this.label = options.label || 'foo';
  this.gravity = options.gravity || [_FAUST_NAMESPACE["CENTER"], _FAUST_NAMESPACE["CENTER"]];
  this.fill = options.fill || _FAUST_NAMESPACE["PINK"];
  this.def = options.def || false;
  this.lpadding_y = options.lpadding_y || _FAUST_NAMESPACE["TEXT_HEIGHT"];
  this.box_padding = options.box_padding || _FAUST_NAMESPACE["TEXT_BOX_PADDING"];
  this.address = options.address || '';
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["FaustObject"], _FAUST_NAMESPACE["FaustCheckBox"]);

_FAUST_NAMESPACE["FaustCheckBox"].prototype.compress = function() {}

_FAUST_NAMESPACE["FaustCheckBox"].prototype.internal_dims = function() {
  return [self.d, self.d];
}

_FAUST_NAMESPACE["FaustCheckBox"].prototype.dims = function() {
  var ugh = this.internal_dims();
  return [ugh[0], ugh[1] + this.lpadding_y + _FAUST_NAMESPACE["TEXT_PADDING"] + (this.d * 0.1 / this.MAGIC)]
}

// DON'T FORGET TO SPECIFY CHECK IN CALLBACK
_FAUST_NAMESPACE["FaustCheckBox"].prototype.make_box = function(svg, g, id) {
  var full_id = 'faust_checkbox_box_'+id;
  var w = this.d;
  var h = this.d;
  box = svg.path(
    g,
    "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0",
    {
      id : full_id,
      style : "fill:white;stroke:black;"
    }
  );

  box.bind(
    'load',
    {
      id : full_id,
      address : this.address
    },
    _FAUST_NAMESPACE['initiate_checkbox']
  );

  box.bind(
    'mousedown',
    { id : full_id },
    _FAUST_NAMESPACE['change_checkbox']
  )
}

_FAUST_NAMESPACE["FaustCheckBox"].prototype.make_check = function(svg, g, id) {
  var full_id = 'faust_checkbox_check_'+id;
  var w = this.d;
  var h = this.d;
  var scale = this.d * 1.0 / this.MAGIC;
  box = svg.path(
    g,
    "M 8.5296806,20.14262 C 6.6396806,17.55262 6.7896806,15.14262 5.2896806,13.53262 C 3.7896806,11.95262 5.6496806,12.23262 6.0696806,12.49262 C 9.5326806,14.79862 8.7036806,21.25062 11.339681,13.13262 C 13.095681,6.90862 16.589681,1.89262 17.296681,0.95421999 C 18.049681,0.02261999 18.400681,1.04122 17.638681,2.16262 C 14.279681,7.67262 13.569681,11.03262 11.150681,19.23262 C 10.846681,20.26262 9.3646806,21.28262 8.5296806,20.13262 L 8.5286806,20.13762 L 8.5296806,20.14262 z",
    {
      id : full_id,
      transform="scale("+scale+","+scale+") translate(-1.0896806, -4.3926201)",
      style="fill:"+_FAUST_NAMESPACE["color_to_rgb"](this.fill)+";opacity:"+(this.def == 1 ? 1.0 : 0.0)+";"
    }
  );

  box.bind(
    'load',
    {
      id : full_id,
      address : this.address
    },
    _FAUST_NAMESPACE['initiate_checkbox']
  );

  box.bind(
    'mousedown',
    { id : full_id },
    _FAUST_NAMESPACE['change_checkbox']
  )
}

_FAUST_NAMESPACE["FaustCheckBox"].prototype.make = function(svg, parent) {
  var id = _FAUST_NAMESPACE["randString"]();
  var g = this.make_group(svg, parent, id);
  this.make_box(svg, g, id);
  this.make_check(svg, g, id);
  this.make_label(svg, g, id);
  //return true;
}

class FaustCheckBox(FaustObject) :
  '''
  '''
  MAGIC = 19
  def __init__(self, mom=None, d=19, label='foo', gravity=(_FAUST_NAMESPACE["CENTER"], _FAUST_NAMESPACE["CENTER"]), fill=PINK, default=False, lpadding_y=_FAUST_NAMESPACE["TEXT_HEIGHT"], box_padding=_FAUST_NAMESPACE["TEXT_BOX_PADDING"], address='') :
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
    self.address = address
  def compress(self, coef) :
    # do nothing...we want the size of this to always be the same
    pass
  def internal_dims(self) :
    log(self, ("DIMS FOR CHECKBOX", self.d, self.d))
    return self.d, self.d
  def dims(self) :
    ugh = self.internal_dims()
    return ugh[0], ugh[1] + self.lpadding_y + _FAUST_NAMESPACE["TEXT_PADDING"] + (self.d * 0.1 / FaustCheckBox.MAGIC) # kludge for overhang of check
  def draw_box_svg(self, id) :
    out = '<path d="M0 0L{0} 0L{0} {0}L0 {0}L0 0" style="fill:white;stroke:black;" onmousedown="(change_checkbox(\'{1}\'))()" onmouseup="mouseUpFunction()" onload="(initiate_checkbox(\'{1}\',\'{2}\'))()"/>'.format(
      self.d,
      'faust_checkbox_check_'+id,
      self.address)
    return out
  def draw_check_svg(self,id) :
    # ugh...for now, we do disappearing based on opacity
    out = '<path transform="scale({0},{0}) translate(-1.0896806, -4.3926201)" id="{3}" d="M 8.5296806,20.14262 C 6.6396806,17.55262 6.7896806,15.14262 5.2896806,13.53262 C 3.7896806,11.95262 5.6496806,12.23262 6.0696806,12.49262 C 9.5326806,14.79862 8.7036806,21.25062 11.339681,13.13262 C 13.095681,6.90862 16.589681,1.89262 17.296681,0.95421999 C 18.049681,0.02261999 18.400681,1.04122 17.638681,2.16262 C 14.279681,7.67262 13.569681,11.03262 11.150681,19.23262 C 10.846681,20.26262 9.3646806,21.28262 8.5296806,20.13262 L 8.5286806,20.13762 L 8.5296806,20.14262 z" style="opacity:{1};" fill="{2}" onmousedown="(change_checkbox(\'{3}\'))()" onmouseup="mouseUpFunction()" onload="(initiate_checkbox(\'{4}\',\'{3}\'))()"/>'.format(
      self.d * 1.0 / FaustCheckBox.MAGIC,
      1.0 if self.default else 0.0,
      _FAUST_NAMESPACE["color_to_rgb"](self.fill),
      'faust_checkbox_check_'+id,
      self.address)
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
  def __init__(self, mom=None, iw=80, ih=40, mw=40, mh=20, label='foo', gravity=(_FAUST_NAMESPACE["CENTER"], _FAUST_NAMESPACE["CENTER"]), fillOn=PINK, fillOff=GREEN, baselineSkip = 5, address='') :
    FaustObject.__init__(self)
    self.mom = mom
    self.iw = iw
    self.ih = ih
    self.mw = mw
    self.mh = mh
    self._w = iw
    self._h = ih
    self.label = label
    self.gravity = gravity # [x,y] gravity for SELF
    self.fillOn = fillOn
    self.fillOff = fillOff
    self.baselineSkip = baselineSkip
    self.address = address
  def w(self) :
    return self._w
  def h(self) :
    return self._h
  def compress(self, coef) :
    self._w = max(self.mw, self._w * coef)
    self._h = max(self.mh, self._h * coef)
  def dims(self) :
    log(self, ("DIMS FOR BUTTON", self.w(), self.h()))
    return self.w(), self.h()
  def draw_button_svg(self, id) :
    rf = 10
    out = '<path id="{8}" d="M{0} 0L{1} 0C{2} 0 {2} 0 {2} {3}L{2} {4}C{2} {5} {2} {5} {1} {5}L{0} {5}C0 {5} 0 {5} 0 {4}L0 {3}C0 0 0 0 {0} 0" style="fill:{6};stroke:{7};" onload="(initiate_button(\'{8}\',\'{6}\',\'{7}\',\'{9}\'))()" onmousedown="(button_down(\'{8}\'))()" onmouseup="(button_up(\'{8}\'))()"/>'.format(
      rf,
      self.w() - rf,
      self.w(),
      rf,
      self.h() - rf,
      self.h(),
      _FAUST_NAMESPACE["color_to_rgb"](self.fillOff),
      _FAUST_NAMESPACE["color_to_rgb"](self.fillOn),
      'faust_button_box_'+id,
      self.address)
    return out
  def draw_label_svg(self, id) :
    out = '<text transform="translate({0},{1})" text-anchor="middle"><tspan onmousedown="(button_down(\'{3}\'))()" onmouseup="(button_up(\'{3}\'))()">{2}</tspan></text>'.format(
      self.w() / 2.0,
      self.h() / 2.0 + self.baselineSkip,
      self.label,
      'faust_button_text_'+id)
    return out
  def export_to_svg(self) :
    # In svg, the width and height of text can be guessed but is often
    # browser specific. We get around this by always adding the text
    # after everything else so nothing else's position depends on it
    id = randString()
    group_open = self.open_group_svg()
    button = self.draw_button_svg(id)
    label = self.draw_label_svg(id)
    group_close = self.close_group_svg()
    return group_open + button + label + group_close

# ugh...need to work this out...
class FaustOldNumericalEntry(FaustIncrementalObject) :
  '''	
  Uses keydowns to fill the box.
  Heavy on Javascript.
  '''
  def __init__(self, mom=None, label='foo', gravity=(_FAUST_NAMESPACE["CENTER"], _FAUST_NAMESPACE["CENTER"]), mn=0, mx=100, default=50, step=1, lpadding_y = _FAUST_NAMESPACE["TEXT_HEIGHT"], box_padding = _FAUST_NAMESPACE["TEXT_BOX_PADDING"], value_box_w = _FAUST_NAMESPACE["VALUE_BOX_W"], value_box_h = _FAUST_NAMESPACE["VALUE_BOX_H"], address='') :
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
    self.address = address
  def compress(self, coef) :
    # do nothing...we want the size of this to always be the same
    pass
  def internal_dims(self) :
    dims = (self.value_box_w, self.value_box_h)
    log(self, ("DIMS FOR NUMERICAL ENTRY",) + dims)
    return dims
  def dims(self) :
    ugh = self.internal_dims()
    return ugh[0], ugh[1] + self.lpadding_y + _FAUST_NAMESPACE["TEXT_PADDING"]
  def make_key_sink_function(self, id) :
    out = 'make_key_sink(\'{0}\',{1},{2},{3},{4},\'{5}\')'.format(
      id,
      self.mn,
      self.mx,
      self.step,
      self.default,
      self.address
    )
    return out
  def init_fn(self, id) :
    out = 'initiate_nentry(\'{0}\',{1},{2},{3},{4},\'{5}\')'.format(
      id,
      self.mn,
      self.mx,
      self.step,
      self.default,
      self.address
    )
    return out
  def export_to_svg(self) :
    id = randString()
    fn = self.make_key_sink_function(id)
    group_open = self.open_group_svg(onload=self.init_fn(id))
    box = self.draw_value_box_svg(id, fn)
    text = self.draw_value_svg(id, fn)
    label = self.draw_label_svg(id)
    group_close = self.close_group_svg()
    return group_open + box + text + label + group_close

class FaustNumericalEntry(FaustIncrementalObject) :
  '''
  w = width
  h = height
  sp = percentage of the strong axis a slider takes up
  label = label
  unit = unit
  default = default value
  '''
  def __init__(self, mom=None, iw=_FAUST_NAMESPACE["VALUE_BOX_W"], ih=_FAUST_NAMESPACE["VALUE_BOX_H"], mw=_FAUST_NAMESPACE["VALUE_BOX_W"], mh=_FAUST_NAMESPACE["VALUE_BOX_H"], label='foo', unit='grames', default=50, mn=0, mx=100, step=1, padding=1, lpadding_y=_FAUST_NAMESPACE["TEXT_HEIGHT"], box_padding=_FAUST_NAMESPACE["TEXT_BOX_PADDING"], gravity=(_FAUST_NAMESPACE["CENTER"], _FAUST_NAMESPACE["CENTER"]), fill=_FAUST_NAMESPACE["CYAN"], value_box_w = _FAUST_NAMESPACE["VALUE_BOX_W"], value_box_h = _FAUST_NAMESPACE["VALUE_BOX_H"], address = '') :
    self.mom = mom
    self.iw = iw
    self.ih = ih
    self.mw = mw
    self.mh = mh
    self._w = iw
    self._h = ih
    self.padding = padding
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
    self.address = address
  def onload_function(self, id) :
    out = 'initiate_nentry(\'{0}\',{1},{2},{3},{4},\'{5}\',\'{6}\')'.format(
      id, # 0
      self.mn, # 1
      self.mx, # 2
      self.step, # 3
      self.default, # 4
      self.label, # 5
      self.address) # 6
    return out
  def compress(self, coef) :
    self._w = max(self.mw, self._w * coef)
    self._h = max(self.mh, self._h * coef)
  def w(self) :
    return self._w
  def h(self) :
    return self._h
  def internal_dims(self) :
    return self.w(), self.h()
  def dims(self) :
    ugh = self.internal_dims()
    # include label and value in y
    ugh = (max(ugh[0], self.value_box_w), ugh[1] + (2 * self.lpadding_y) + _FAUST_NAMESPACE["TEXT_PADDING"])
    log(self, ("DIMS FOR SLIDER",) + ugh)
    return ugh
  def make_key_sink_function(self, id) :
    out = 'nentry_key_sink(\'{0}\')'.format(
      id)
    return out
  def draw_left_button(self, id) :
    return self.draw_button(id, 0, False)
  def draw_right_button(self, id) :
    return self.draw_button(id, self.w() / 2.0 + self.padding, True)
  def draw_button(self, id, x_offset, incr) :
    out = '<path transform="translate({0},0)" d="M0 0L0 {2}L{1} {2}L{1} 0L0 0" id="{3}" style="fill:grey;stroke:black;" onmousedown="activate_nentry(\'{3}\',{4})"/>'.format(
      x_offset,
      self.w() / 2.0 - self.padding,
      self.h(),
      'faust_nentry_'+('rbutton' if incr else 'lbutton')+'_'+id,
      1 if incr else 0
    )
    return out
  def draw_minus(self, id, x_offset, incr) :
    out = '<path transform="translate({0},0)" d="M{1} {2}L{3} {2}" style="fill:grey;stroke:black;" onmousedown="activate_nentry(\'{4}\',{5})"/>'.format(
      x_offset,
      (self.w() / 2.0 - self.padding) / 4.0,
      self.h() / 2.0,
      (self.w() / 2.0 - self.padding) * 3.0 / 4.0,
      'faust_nentry_'+('rbutton' if incr else 'lbutton')+'_'+id,
      1 if incr else 0
    )
    return out
  def draw_plus(self, id, x_offset, incr) :
    out = '<path transform="translate({0},0)" d="M{1} {2}L{3} {2}M{4} {5}L{4} {6}" style="fill:grey;stroke:black;" onmousedown="activate_nentry(\'{7}\',{8})"/>'.format(
      x_offset,
      (self.w() / 2.0 - self.padding) / 4.0,
      self.h() / 2.0 - 0.5,
      (self.w() / 2.0 - self.padding) * 3.0 / 4.0,
      (self.w() / 2.0 - self.padding) / 2.0,
      self.h() / 4.0,
      self.h() * 3.0 / 4.0,
      'faust_nentry_'+('rbutton' if incr else 'lbutton')+'_'+id,
      1 if incr else 0
    )
    return out
  def export_to_svg(self) :
    # In svg, the width and height of text can be guessed but is often
    # browser specific. We get around this by always adding the text
    # after everything else so nothing else's position depends on it
    id = randString()
    #onload = 'devnull()'
    onload = self.onload_function(id)
    group_open = self.open_group_svg(onload=onload)
    fn = self.make_key_sink_function(id)
    left_button = self.draw_left_button(id)
    right_button = self.draw_right_button(id)
    minus = self.draw_minus(id, 0, False)
    plus = self.draw_plus(id, self.w() / 2.0 + self.padding, True)
    box = self.draw_value_box_svg(id, fn)
    value = self.draw_value_svg(id, fn)
    label = self.draw_label_svg(id)
    group_close = self.close_group_svg()
    return group_open + left_button + right_button + minus + plus + box + value + label + group_close

class LayoutManager(FaustObject) :
  def __init__(self, mom=None, o=_FAUST_NAMESPACE["X_AXIS"], padding=10, objs=None, constrain=True, gravity=(_FAUST_NAMESPACE["CENTER"], _FAUST_NAMESPACE["CENTER"]), label='foo', lpadding_y=_FAUST_NAMESPACE["TEXT_HEIGHT"], box_padding=_FAUST_NAMESPACE["TEXT_BOX_PADDING"]) :
    self.mom = mom
    self.o = o
    self.padding = padding
    self.objs = objs
    if not self.objs :
      self.objs = []
    self.gravity = gravity # [x,y] gravity for SELF
    self.x = 0
    self.y = 0
    self.w = 0
    self.h = 0
    self.label = label
    self.lpadding_y = lpadding_y
    self.box_cache = Box()
    self.id = randString()
    self.fill = magic_color()
    self.constrain = constrain
  def dims(self) :
    ugh = self.internal_dims()
    #out = (ugh[0], ugh[1] + self.lpadding_y + _FAUST_NAMESPACE["TEXT_PADDING"])
    out = (ugh[0], ugh[1] + max(self.lpadding_y, self.padding) + self.padding + _FAUST_NAMESPACE["TEXT_PADDING"])
    log(self, ("DIMS FOR LAYOUT MANAGER",)+out+(self.x, self.y))
    return out
  def internal_dims(self) :
    out = [[obj.dims()[x] for obj in self.objs] for x in [_FAUST_NAMESPACE["X_AXIS"], _FAUST_NAMESPACE["Y_AXIS"]]]
    ops = _FAUST_NAMESPACE["xy"](self.o, [sum,max], [max,sum])
    for x in range(NO_AXES) :
      out[x] = ops[x](out[x])
    out[other_axis(self.o)] += (self.padding * 2)
    out[self.o] += (self.padding * (len(self.objs) + 1))
    return tuple(out)
  def get_ratio_and_leftover(self, x, y) :
    # NOTE
    # self.constrain controls a LOT
    if self.constrain :
      dims = self.internal_dims()
      ratio = min(1.0 * x / dims[_FAUST_NAMESPACE["X_AXIS"]], 1.0 * y / dims[_FAUST_NAMESPACE["Y_AXIS"]])
      log(self, ("RATIO FOR LAYOUT MANAGER", ratio))
      leftover = (x - (dims[_FAUST_NAMESPACE["X_AXIS"]] * ratio), y - (dims[_FAUST_NAMESPACE["Y_AXIS"]] * ratio))
      log(self, ("LEFTOVER FOR LAYOUT MANAGER", leftover))
      return ratio, leftover
    else :
      return 1.0, (0.0, 0.0)
  def get_real_points(self) :
    rp = []
    for obj in self.objs :
      if isinstance(obj, LayoutManager) :
        rp += obj.get_real_points()
      else :
        dim = obj.dims()
        x = obj.get_x_offset()
        y = obj.get_y_offset()
        rp.append((x,y))
        rp.append((x+dim[0], y+dim[1]))
    # we want to account for padding for Y coordinates...
    rp.sort(key = lambda x:x[1])
    rp.append((rp[-1][0], rp[-1][1] + max(self.lpadding_y, self.padding)))
    rp.append((rp[0][0], rp[0][1] - self.padding))
    # and now X coordinates...
    rp.sort()
    rp.append((rp[-1][0] + self.padding, rp[-1][1]))
    rp.append((rp[0][0] - self.padding, rp[0][1]))
    return rp
  def compress(self, coef) :
    for obj in self.objs :
      obj.compress(coef)
  def do_spacing(self, x, y) :
    # we place objects in their place according to gravity
    # we allow layout managers to fill the full space they're allotted
    # for now, we let stuff mess up if the dims are too squished
    dims = self.dims()
    if not self.constrain :
      x = dims[0]
      y = dims[1]
    self.w = x
    self.h = y
    # first pass for compression
    ratio, leftover = self.get_ratio_and_leftover(x, y)
    # now compress
    if ratio < 1 :
      self.compress(ratio)
    # second pass after compression
    ratio, leftover = self.get_ratio_and_leftover(x, y)
    # increase padding by size
    padding = self.padding * ratio
    # the first padding will need to account for any additional space, thus
    # the call to jvalue with the leftover
    # use self.gravity, as object gravities will be used internally
    running_count = padding + jvalue(leftover[self.o], LEFT, self.gravity[self.o])
    for z in range(len(self.objs)) :
      obj = self.objs[z]
      dim = obj.dims()
      # find dimensions
      nx = _FAUST_NAMESPACE["xy"](self.o, dim[_FAUST_NAMESPACE["X_AXIS"]] * ratio, x)
      ny = _FAUST_NAMESPACE["xy"](self.o, y, dim[_FAUST_NAMESPACE["Y_AXIS"]] * ratio)
      if isinstance(obj, LayoutManager) :
        # find offsets
        obj.x = _FAUST_NAMESPACE["xy"](self.o, running_count, 0 if self.constrain else (dims[_FAUST_NAMESPACE["X_AXIS"]] - dim[_FAUST_NAMESPACE["X_AXIS"]]) / 2.0)
        obj.y = _FAUST_NAMESPACE["xy"](self.o, 0 if self.constrain else (dims[_FAUST_NAMESPACE["Y_AXIS"]] - dim[_FAUST_NAMESPACE["Y_AXIS"]]) / 2.0, running_count)
        obj.do_spacing(nx, ny)
      elif isinstance(obj, TabGroup) :
        obj.setX(_FAUST_NAMESPACE["xy"](self.o, running_count, 0))
        obj.setY(_FAUST_NAMESPACE["xy"](self.o, 0, running_count))
        obj.do_spacing(nx, ny)
      else :
        xv1 = _FAUST_NAMESPACE["xy"](self.o, running_count, 0)
        xv2 = _FAUST_NAMESPACE["xy"](self.o, running_count + (dim[_FAUST_NAMESPACE["X_AXIS"]] * (ratio - 1)), x - dim[_FAUST_NAMESPACE["X_AXIS"]])
        #log(self, ("RATIO", ratio, "X", x, "Y", y))
        #log(self, ("X1", xv1, "X2", xv2, "LC", linear_combination(obj.gravity[_FAUST_NAMESPACE["X_AXIS"]], xv1, xv2)))
        obj.x = linear_combination(obj.gravity[_FAUST_NAMESPACE["X_AXIS"]], xv1, xv2)
        yv1 = _FAUST_NAMESPACE["xy"](self.o, 0, running_count)
        yv2 = _FAUST_NAMESPACE["xy"](self.o, y - dim[_FAUST_NAMESPACE["Y_AXIS"]], running_count + (dim[_FAUST_NAMESPACE["Y_AXIS"]] * (ratio - 1)))
        #log(self, ("Y1", yv1, "Y2", yv2, "LC", linear_combination(obj.gravity[_FAUST_NAMESPACE["Y_AXIS"]], yv1, yv2)))
        obj.y = linear_combination(obj.gravity[_FAUST_NAMESPACE["Y_AXIS"]], yv1, yv2)
      running_count += padding + (_FAUST_NAMESPACE["xy"](self.o, dim[_FAUST_NAMESPACE["X_AXIS"]], dim[_FAUST_NAMESPACE["Y_AXIS"]]) * ratio)
    # we only want to draw boxes around content
    my_x = self.get_x_offset()
    my_y = self.get_y_offset()
    realpoints = [_FAUST_NAMESPACE["coord_sub"](pt, (my_x, my_y)) for pt in self.get_real_points()]
    self.box_cache.clear() # in case we do typesetting multiple times
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
    log(self, ("DIMS FOR BACKGROUND BOX "+str(self.box_cache),))
    out = '<path transform="translate({2},{3})" d="M0 0L{0} 0L{0} {1}L0 {1}L0 0" fill="{4}" stroke="black"/>'.format(
      self.box_cache.x[1] - self.box_cache.x[0],
      self.box_cache.y[1] - self.box_cache.y[0],
      self.box_cache.x[0],
      self.box_cache.y[0],
      _FAUST_NAMESPACE["color_to_rgb"](self.fill)
    )
    return out
  def export_to_svg(self) :
    group_open = self.open_group_svg(id=self.id)    
    background = self.background_svg()
    main = ''.join([obj.export_to_svg() for obj in self.objs])
    label = self.draw_label_svg()
    group_close = self.close_group_svg()
    return group_open + background + main + label + group_close

class TabGroup(FaustObject) :
  def __init__(self, mom=None, headroom=40, x_padding=10, x_width=80, objs=None, default = 0, baselineSkip = 5, constrain=True) :
    self.mom = mom
    self.objs = [] if not objs else objs
    self.headroom = headroom
    self.default = default
    self.x_padding = x_padding
    self.x_width = x_width
    self.x = 0
    self.y = 0
    self.baselineSkip = baselineSkip
    self.id = randString()
    self.constrain = constrain
  def compress(self, coef) :
    for obj in self.objs :
      obj.compress(coef)
  def setX(self, x) :
    self.x = x
    for obj in self.objs :
      obj.x = x
  def setY(self, y) :
    self.y = y
    for obj in self.objs :
      obj.y = y + headroom
  def dims(self) :
    x = 0
    y = 0
    for obj in self.objs :
      dim = obj.dims()
      x = max(x, dim[0])
      y = max(y, dim[1])
    return x, y + self.headroom
  '''
  def do_spacing(self, x, y) :
    dims = self.dims()
    for obj in self.objs :
      dim = obj.dims()
      obj.x = 0 + (0 if self.constrain else (dims[0] - dim[0]) / 2.0)
      obj.y = self.headroom + (0 if self.constrain else (dims[1] - dim[1]) / 2.0)
      obj.do_spacing(x, y - self.headroom)
  '''
  def do_spacing(self, x, y) :
    for obj in self.objs :
      obj.x = 0
      obj.y = self.headroom
      obj.do_spacing(x, y - self.headroom)
  def draw_label_svg(self, x, y, l, goodid, badidstr) :
    out = '<text transform="translate({0},{1})" text-anchor="middle"><tspan onclick="shuffletabs(\'{3}\', \'{4}\', {5}, {6})">{2}</tspan></text>'.format(
      x,
      y,
      l,
      goodid,
      badidstr,
      self.x,
      self.y + self.headroom
    )
    return out
  def draw_tab_svg(self,w,h,x,y,goodid,badidstr, fill) :
    out = '<path transform="translate({0},{1})" d="M0 0L{2} 0L{2} {3}L0 {3}L0 0" onclick="shuffletabs(\'{4}\', \'{5}\', {6}, {7})" fill="{8}" stroke="black"/>'.format(
      x,
      y,
      w,
      h,
      goodid,
      badidstr,
      self.x,
      self.y + self.headroom,
      _FAUST_NAMESPACE["color_to_rgb"](fill))
    return out
  def draw_tabs_svg(self) :
    # we evenly space buttons across x axis
    out = ''
    running_count = 0
    for obj in self.objs :
      out += self.draw_tab_svg(
        self.x_width,
        self.headroom,
        running_count,
        0,
        obj.id,
        '#'.join([obj2.id for obj2 in filter(lambda(x) : x != obj, self.objs)]),
        obj.fill)
      out += self.draw_label_svg(
        running_count + self.x_width / 2.0,
        self.headroom / 2.0 + self.baselineSkip,
        obj.label,
        obj.id,
        '#'.join([obj2.id for obj2 in filter(lambda(x) : x != obj, self.objs)])
      )
      running_count += self.x_width + self.x_padding
    return out
  def make_onclick(self) :
    # a url-like string that shows what the default is
    # this is parsed on load time so that the correct tab group is showing
    out = "cache_tab_group({0},\'{1}\',\'{2}\')".format(
      self.default,
      self.id,
      '#'.join([obj.id for obj in self.objs])
    )
    return out
  def export_to_svg(self) :
    onclick = self.make_onclick()
    group_open = self.open_group_svg(self.id, onclick)
    tabs = self.draw_tabs_svg()
    main = ''.join([obj.export_to_svg() for obj in self.objs])
    group_close = self.close_group_svg()
    return group_open + tabs + main + group_close

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
  def __init__(self, js='', css='', other='', lm=None, w=1200, h=800, verbose=False, constrain=False, title='') :
    self.js = js
    self.css = css
    self.lm = lm
    self.w = w
    self.h = h
    self.verbose = verbose
    self.other = other # way to sneak in other stuff
    self.constrain = constrain
    self.title = title
  def get_x_offset(self) : return 0
  def get_y_offset(self) : return 0
  def svg_open(self, viewbox = None) :
    out = '<svg xmlns="http://www.w3.org/2000/svg" width="{0}px" height="{1}px" {2}>'.format(
      self.w,
      self.h,
      'viewbox="{0} {1} {2} {3}"'.format(viewbox[0],viewbox[1],viewbox[2],viewbox[3]) if viewbox else ''
    )
    return out
  def svg_close(self) :
    out = '</svg>'
    return out
  def export(self) :
    svg_open = self.svg_open(viewbox=None if self.constrain else (0,0)+self.lm.dims())
    js_open = self.js_open()
    js = self.js+'\nvar ROOT="'+self.title+'";\n'
    js_close = self.js_close()
    css_open = self.css_open()
    css = self.css
    css_close = self.css_close()
    other = self.other
    # trigger spacing calculations
    self.lm.do_spacing(self.w, self.h)
    main = self.lm.export_to_svg()
    svg_close = self.svg_close()
    return svg_open+other+js_open+js+js_close+css_open+css+css_close+main+svg_close

class HTMLDocument(XMLDocument) :
  def __init__(self, js='', css='', other='', lm=None, w=1200, h=800, verbose=False) :
    self.js = js
    self.css = css
    self.lm = lm
    self.w = w
    self.h = h
    self.verbose = verbose
    self.other = other # way to sneak in other stuff
    self.nodes = []
  def html_open(self) :
    out = '<html>'
    return out
  def html_close(self) :
    out = '</html>'
    return out
  def body_open(self) :
    out = '<body>'
    return out
  def body_close(self) :
    out = '</body>'
    return out
  def head_open(self) :
    out = '<head>'
    return out
  def head_close(self) :
    out = '</head>'
    return out
  def export(self) :
    html_open = self.html_open()
    js_open = self.js_open()
    js = self.js
    js_close = self.js_close()
    css_open = self.css_open()
    css = self.css
    css_close = self.css_close()
    other = self.other
    body_open = self.body_open()
    body_close = self.body_close()
    head_open = self.head_open()
    head_close = self.head_close()
    main = ''.join([node.export() for node in self.nodes])
    html_close = self.html_close()
    return html_open+head_open+other+js_open+js+js_close+css_open+css+css_close+head_close+body_open+main+body_close+html_close
