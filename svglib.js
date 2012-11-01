// all onload need to be pushed to the end of the creation

/*
  DEFINES THE FAUST OBJECT CLASS.
  All graphical objects inherit from this.
*/

_FAUST_NAMESPACE["UIObject"] = function() {
  this.x = 0.0;
  this.y = 0.0;
}

_FAUST_NAMESPACE["UIObject"].prototype.make_group = function(svg, id, onload, onload_params) {
  out = svg.group(
    id,
    {
      transform: 'translate('+this.x+','+this.y+')'
    });

  if (onload) {
    out.bind('onload', onload_params, onload);
  }
  return out;
}

_FAUST_NAMESPACE["UIObject"].prototype.get_x_offset = function() {
  if (!this.mom) {
    return this.x;
  }
  return this.x + this.mom.get_x_offset();
}

_FAUST_NAMESPACE["UIObject"].prototype.get_y_offset = function() {
  if (!this.mom) {
    return this.y;
  }
  return this.y + this.mom.get_y_offset();
}

_FAUST_NAMESPACE["UIObject"].prototype.compress = function() {
  // does nothing
}

/*
  DEFINES THE FAUST INCREMENTAL OBJECT CLASS.
  All objects that go up in increments inherit from this.
*/

_FAUST_NAMESPACE["IncrementalObject"] = function () {}
_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["UIObject"], _FAUST_NAMESPACE["IncrementalObject"]);

_FAUST_NAMESPACE["IncrementalObject"].prototype.make_value_box = function(svg, id, mousedown, mousedown_params) {
  var vb = svg.path(
    "M0 0L"+this.value_box_w+" 0L"+this.value_box_w+" "+this.value_box_h+"L0 "+this.value_box_h+"L0 0",
    {
      id: 'faust_value_box_'+id,
      transform: 'translate(0,'+(this.internal_dims()[1] + this.box_padding)+')',
      style: 'fill:white;stroke:black;'
    }
  );
  vb.bind('mousedown', mousedown_params, mousedown);
  return vb;
}

_FAUST_NAMESPACE["IncrementalObject"].prototype.make_value_value = function(svg, id, mousedown, mousedown_params) {
  var vv = svg.text(
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

  return vv;
}

_FAUST_NAMESPACE["IncrementalObject"].prototype.make_label = function(svg, id) {
  var vl = svg.text(
    0,
    0,
    this.label,
    {
      id: 'faust_label_'+id,
      transform: 'translate(0,'+(this.internal_dims()[1] + this.lpadding_y + this.lpadding_y)+')',
      style: 'fill:white;stroke:black;'
    }
  );
  return vl;
}

/*
  DEFINES A ROTATING BUTTON.
*/

_FAUST_NAMESPACE["RotatingButton"] = function(options) {
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

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["IncrementalObject"], _FAUST_NAMESPACE["RotatingButton"]);

_FAUST_NAMESPACE["RotatingButton"].prototype.compress = function(coef) {
  this._r = Math.max(this.mr, this._r * coef);
}

_FAUST_NAMESPACE["RotatingButton"].prototype.r = function() {
  return this._r;
}

_FAUST_NAMESPACE["RotatingButton"].prototype.get_maybe_extremal_coords = function() {
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

_FAUST_NAMESPACE["RotatingButton"].prototype.internal_dims = function() {
  var coords = this.get_maybe_extremal_coords();
  var box = _FAUST_NAMESPACE["Box"]();
  for (var i = 0; i < coords.length; i++) {
    box.add_point(coords[i]);
  }
  var ugh = box.lens();
  return ugh;
}

_FAUST_NAMESPACE["RotatingButton"].prototype.dims = function() {
  var ugh = this.internal_dims();
  return [max(ugh[0], this.value_box_w), ugh[1] + (2 * this.lpadding_y) + _FAUST_NAMESPACE["TEXT_PADDING"]];
}

_FAUST_NAMESPACE["RotatingButton"].prototype.get_translation = function() {
  var coords = this.get_maybe_extremal_coords();
  var x = Number.POSITIVE_INFINITY;
  var y = Number.POSITIVE_INFINITY;
  for (var i = 0; i < coords.length; i++) {
    x = Math.min(x, coords[i][0]);
    y = Math.min(x, coords[i][1]);
  }
  return [x,y];
}

_FAUST_NAMESPACE["RotatingButton"].prototype.make_joint = function(svg, id) {
  var trans = this.get_translation()
  var start = _FAUST_NAMESPACE["coord_sub"](_FAUST_NAMESPACE["point_from_polar"](this.r(), _FAUST_NAMESPACE["d2r"](this.a0)), trans);
  var end = _FAUST_NAMESPACE["coord_sub"](_FAUST_NAMESPACE["point_from_polar"](this.r(), _FAUST_NAMESPACE["d2r"](this.a0 + this.sweep)), trans);
  var origin = _FAUST_NAMESPACE["coord_sub"]([0,0], trans);
  var small = this.sweep < 180;
  var d = "M{0} {1}L{2} {3} A{4} {4} {5} 1 {6} {7}L{0} {1}";
  d.format([
    origin[0], origin[1],
    start[0], start[1],
    this.r(),
    (small ? "1 0" : "0 1"),
    end[0], end[1]
  ]);

  var joint = svg.path(
    d,
    {
      style : "fill:"+_FAUST_NAMESPACE["color_to_rgb"](this.fill)+";stroke:black;",
      id : 'faust_rbutton_joint_'+id
    }
  );
  
  return joint;
}

_FAUST_NAMESPACE["RotatingButton"].prototype.make_knob = function(svg, id) {
  var trans = this.get_translation();
  var slider_angle = this.sweep * this.sp;
  var half_slider_angle = slider_angle * 0.5;
  var startp = _FAUST_NAMESPACE["remap"](this.def, this.mn, this.mx, this.a0 + half_slider_angle, this.a0 + this.sweep - half_slider_angle)
  var start = _FAUST_NAMESPACE["coord_sub"](_FAUST_NAMESPACE["point_from_polar"](this.r(), _FAUST_NAMESPACE["d2r"](this.a0)), trans);
  var end = _FAUST_NAMESPACE["coord_sub"](_FAUST_NAMESPACE["point_from_polar"](this.r(), _FAUST_NAMESPACE["d2r"](this.a0 + slider_angle)), trans);
  var origin = _FAUST_NAMESPACE["coord_sub"]([0,0], trans);
  var small = this.sweep * this.sp < 180;
  var full_id = 'faust_rbutton_knob_'+id;
  var d = "M{0} {1}L{2} {3} A{4} {4} {5} 1 {6} {7}L{0} {1}";
  d.format([
    origin[0], origin[1],
    start[0], start[1],
    this.r(),
    (small ? "1 0" : "0 1"),
    end[0], end[1]
  ]);

  var knob = svg.path(
    d,
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
  );
  
  return knob;
}

_FAUST_NAMESPACE["RotatingButton"].prototype.make = function(svg) {
  var id = _FAUST_NAMESPACE["randString"]();
  var g = this.make_group(svg, id);

  g.add(this.make_joint(svg, id));
  g.add(this.make_knob(svg, id));
  g.add(this.make_value_box(svg, id, _FAUST_NAMESPACE["rotating_button_key_sink"], {id : this.id}));
  g.add(this.make_value_value(svg, id, _FAUST_NAMESPACE["rotating_button_key_sink"], {id : this.id}));
  g.add(this.make_label(svg, id));

  return g;
}

/*
  DEFINES A SLIDER.
*/

_FAUST_NAMESPACE["SlidingObject"] = function(options) {
  this.mom = options.mom || null;
  this.o = options.o || _FAUST_NAMESPACE["X_AXIS"];
  this.iwa = options.iwa || 40;
  this.isa = options.isa || 200;
  this._sa = this.isa;
  this._wa = this.iwa;
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

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["IncrementalObject"], _FAUST_NAMESPACE["SlidingObject"]);

_FAUST_NAMESPACE["SlidingObject"].prototype.compress = function(coef) {
  this._wa = Math.max(this.mwa, this._wa * coef);
  this._sa = Math.max(this.msa, this._sa * coef);
}

_FAUST_NAMESPACE["SlidingObject"].prototype.wa = function() {
  return this._wa;
}

_FAUST_NAMESPACE["SlidingObject"].prototype.sa = function() {
  return this._sa;
}

_FAUST_NAMESPACE["SlidingObject"].prototype.internal_dims = function() {
  var x = _FAUST_NAMESPACE["xy"](this.o, this.sa(), this.wa());
  var y = _FAUST_NAMESPACE["xy"](this.o, this.wa(), this.sa());
  return [x,y];
}

_FAUST_NAMESPACE["SlidingObject"].prototype.dims = function() {
  var ugh = this.internal_dims();
  ugh = [Math.max(ugh[0], this.value_box_w), ugh[1] + (2 * this.lpadding_y) + _FAUST_NAMESPACE["TEXT_PADDING"]];
  return ugh;
}

_FAUST_NAMESPACE["SlidingObject"].prototype.make_joint = function(svg, id) {
  var w = _FAUST_NAMESPACE["xy"](this.o, this.sa(), this.wa());
  var h = _FAUST_NAMESPACE["xy"](this.o, this.wa(), this.sa());
  var joint = svg.path(
    "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0",
    {
      id : 'faust_'+this.type+'_joint_'+id,
      style : "fill:"+_FAUST_NAMESPACE["color_to_rgb"](this.fill)+";stroke:black;"
    }
  );

  return joint;
}

_FAUST_NAMESPACE["Slider"] = function(options) {
  _FAUST_NAMESPACE["SlidingObject"].call(this, options);
  this.sp = options.sp || 0.15;
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["SlidingObject"], _FAUST_NAMESPACE["Slider"]);

_FAUST_NAMESPACE["Slider"].prototype.make_knob = function(svg, id) {
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
  var knob = svg.path(
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
  );
  
  return knob;
}

_FAUST_NAMESPACE["Slider"].prototype.make = function(svg) {
  var id = _FAUST_NAMESPACE["randString"]();
  var g = this.make_group(svg, id);
  g.add(this.make_joint(svg, id));
  g.add(this.make_knob(svg, id));
  g.add(this.make_value_box(
    svg,
    id,
    _FAUST_NAMESPACE[this.type+'_key_sink'],
    {id : this.id}
  ));
  g.add(this.make_value_value(
    svg,
    id,
    _FAUST_NAMESPACE[this.type+'_key_sink'],
    {id : this.id}
  ));
  g.add(this.make_label(svg, id));
  return g;
}

/*
  DEFINES A HORIZONTAL SLIDER.
*/

_FAUST_NAMESPACE["HorizontalSlider"] = function(options) {
  options = options || {};
  options["o"] = _FAUST_NAMESPACE["X_AXIS"];
  options["type"] = 'hslider';
  _FAUST_NAMESPACE["Slider"].call(this, options);
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["Slider"], _FAUST_NAMESPACE["HorizontalSlider"]);

/*
  DEFINES A VERTICAL SLIDER.
*/

_FAUST_NAMESPACE["VerticalSlider"] = function(options) {
  options = options || {};
  options["o"] = _FAUST_NAMESPACE["Y_AXIS"];
  options["type"] = 'vslider';
  _FAUST_NAMESPACE["Slider"].call(this, options);
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["Slider"], _FAUST_NAMESPACE["VerticalSlider"]);

_FAUST_NAMESPACE["BarGraph"] = function(options) {
  _FAUST_NAMESPACE["SlidingObject"].call(this, options);
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["SlidingObject"], _FAUST_NAMESPACE["BarGraph"]);

_FAUST_NAMESPACE["BarGraph"].prototype.make_meter = function(svg, id) {
  var full_id = 'faust_'+this.type+'_meter_'+id;
  def = _FAUST_NAMESPACE["remap"](this.def, this.mn, this.mx, 0, this.sa())
  var w = _FAUST_NAMESPACE["xy"](self.o, def, self.wa());
  var h = _FAUST_NAMESPACE["xy"](self.o, self.wa(), def);
  var meter = svg.path(
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
  
  return meter;
}

_FAUST_NAMESPACE["BarGraph"].prototype.make = function(svg) {
  var id = _FAUST_NAMESPACE["randString"]();
  var g = this.make_group(svg, id);

  g.add(this.make_joint(svg, id));
  g.add(this.make_meter(svg, id));
  g.add(this.make_value_box(svg, id));
  g.add(this.make_value_value(svg, id));
  g.add(this.make_label(svg, id));

  return g;
}

/*
  DEFINES A HORIZONTAL BAR GRAPH.
*/

_FAUST_NAMESPACE["HorizontalBarGraph"] = function(options) {
  options = options || {};
  options["o"] = _FAUST_NAMESPACE["X_AXIS"];
  options["type"] = 'hbargraph';
  _FAUST_NAMESPACE["BarGraph"].call(this, options);
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["BarGraph"], _FAUST_NAMESPACE["HorizontalBarGraph"]);

/*
  DEFINES A VERTICAL BAR GRAPH.
*/

_FAUST_NAMESPACE["VerticalBarGraph"] = function(options) {
  options = options || {};
  options["o"] = _FAUST_NAMESPACE["Y_AXIS"];
  options["type"] = 'vbargraph';
  _FAUST_NAMESPACE["BarGraph"].call(this, options);
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["BarGraph"], _FAUST_NAMESPACE["VerticalBarGraph"]);

_FAUST_NAMESPACE["CheckBox"] = function(options) {
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

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["UIObject"], _FAUST_NAMESPACE["CheckBox"]);

_FAUST_NAMESPACE["CheckBox"].prototype.compress = function() {}

_FAUST_NAMESPACE["CheckBox"].prototype.internal_dims = function() {
  return [self.d, self.d];
}

_FAUST_NAMESPACE["CheckBox"].prototype.dims = function() {
  var ugh = this.internal_dims();
  return [ugh[0], ugh[1] + this.lpadding_y + _FAUST_NAMESPACE["TEXT_PADDING"] + (this.d * 0.1 / this.MAGIC)]
}

// DON'T FORGET TO SPECIFY CHECK IN CALLBACK
_FAUST_NAMESPACE["CheckBox"].prototype.make_box = function(svg, id) {
  var full_id = 'faust_checkbox_box_'+id;
  var w = this.d;
  var h = this.d;
  var box = svg.path(
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
  );
  
  return box;
}

_FAUST_NAMESPACE["CheckBox"].prototype.make_check = function(svg, id) {
  var full_id = 'faust_checkbox_check_'+id;
  var w = this.d;
  var h = this.d;
  var scale = this.d * 1.0 / this.MAGIC;
  var box = svg.path(
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
  );
  
  return box;
}

_FAUST_NAMESPACE["Checkbox"].prototype.make_label = function(svg, id) {
  var vl = svg.text(
    0,
    0,
    this.label,
    {
      id: 'faust_label_'+id,
      transform: 'translate(0,'+(this.internal_dims()[1] + this.lpadding_y)+')',
      style: 'fill:white;stroke:black;'
    }
  );

  return vl;
}

_FAUST_NAMESPACE["CheckBox"].prototype.make = function(svg) {
  var id = _FAUST_NAMESPACE["randString"]();
  var g = this.make_group(svg, id);

  g.add(this.make_box(svg, id));
  g.add(this.make_check(svg, id));
  g.add(this.make_label(svg, id));

  return g;
}

/*
  Button in 
*/

_FAUST_NAMESPACE["Button"] = function(options) {
  this.mom = options.mom || None;
  this.iw = options.iw || 80;
  this.ih = options.ih || 40;
  this.mw = options.mw || 40;
  this.mh = options.mh || 20;
  this._w = this.iw;
  this._h = this.ih;
  this.label = options.label || 'foo';
  this.gravity = options.gravity || [_FAUST_NAMESPACE["CENTER"], _FAUST_NAMESPACE["CENTER"]];
  this.fillOn = options.fillOn || _FAUST_NAMESPACE["PINK"];
  this.fillOff = options.fillOff || _FAUST_NAMESPACE["GREEN"];
  this.baselineSkip = options.baselineSkip || 5;
  this.address = options.address || '';
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["UIObject"], _FAUST_NAMESPACE["Button"]);

_FAUST_NAMESPACE["Button"].prototype.w = function() {
  return this._w;
}

_FAUST_NAMESPACE["Button"].prototype.h = function() {
  return this._h;
}

_FAUST_NAMESPACE["Button"].prototype.compress = function(coef) {
  this._w = Math.max(this.mw, this._w * coef);
  this._h = Math.max(this.mh, this._h * coef);
}

_FAUST_NAMESPACE["Button"].prototype.dims = function(coef) {
  return [self.w(), self.h()];
}

_FAUST_NAMESPACE["Button"].prototype.make_button_button = function(svg, id) {
  var full_id = 'faust_buttoon_button_'+id;
  var rf = 10;
  var d = "M{0} 0L{1} 0C{2} 0 {2} 0 {2} {3}L{2} {4}C{2} {5} {2} {5} {1} {5}L{0} {5}C0 {5} 0 {5} 0 {4}L0 {3}C0 0 0 0 {0} 0";
  d.format([rf, this.w() - rf, this.w(), rf, this.h() - rf, this.h()]);
  var button = svg.path(
    d,
    {
      id : full_id,
      style="fill:"+_FAUST_NAMESPACE["color_to_rgb"](this.fillOff)+";"
    }
  );

  button.bind(
    'load',
    {
      fillOff : _FAUST_NAMESPACE["color_to_rgb"](this.fillOff),
      fillOn : _FAUST_NAMESPACE["color_to_rgb"](this.fillOn),
      id : full_id,
      address : this.address,
    },
    _FAUST_NAMESPACE['initiate_button']
  );

  button.bind(
    'mousedown',
    { id : full_id },
    _FAUST_NAMESPACE['button_down']
  );

  button.bind(
    'mouseup',
    { id : full_id },
    _FAUST_NAMESPACE['button_up']
  );
  
  return button;
}

_FAUST_NAMESPACE["Button"].prototype.make_label = function(svg, id) {
  var full_id = 'faust_button_button_'+id;
  var vl = svg.text(
    0,
    0,
    this.label,
    {
      text-anchor: 'middle',
      id: 'faust_label_'+id,
      transform: 'translate('+(this.w() / 2.0)+','+(this.h() / 2.0 + this.baselineSkip)+')',
      style: 'fill:white;stroke:black;'
    }
  );
  
  vi.bind(
    'mousedown',
    { id : full_id },
    _FAUST_NAMESPACE['button_down']
  );

  vi.bind(
    'mouseup',
    { id : full_id },
    _FAUST_NAMESPACE['button_up']
  );

  return vl;
}

_FAUST_NAMESPACE["Button"].prototype.make = function(svg) {
  var id = _FAUST_NAMESPACE["randString"]();
  var g = this.make_group(svg, id);

  g.add(this.make_button_button(svg, id));
  g.add(this.make_label(svg, id));

  return g;
}

_FAUST_NAMESPACE["NumericalEntry"] = function(options) {
  this.mom = options.mom || null;
  this.iw = options.iw || _FAUST_NAMESPACE["VALUE_BOX_W"];
  this.ih = options.ih || _FAUST_NAMESPACE["VALUE_BOX_H"];
  this.mw = options.mw || _FAUST_NAMESPACE["VALUE_BOX_W"];
  this.mh = options.mh || _FAUST_NAMESPACE["VALUE_BOX_H"];
  this._w = this.iw;
  this._h = this.ih;
  this.label = options.label || 'foo';
  this.unit = options.unitl || 'grames';
  this.mn = options.mn || 0;
  this.mx = options.mx || 100;
  this.def = _FAUST_NAMESPACE["bound"](options.def || 50, this.mn, this.mx);
  this.step = options.step || 1;
  this.padding = options.padding || 1;
  this.lpadding_y = options.lpadding_y || _FAUST_NAMESPACE["TEXT_HEIGHT"];
  this.box_padding = options.box_padding || _FAUST_NAMESPACE["TEXT_BOX_PADDING"];
  this.gravity = options.gravity || [_FAUST_NAMESPACE["CENTER"], _FAUST_NAMESPACE["CENTER"]];
  this.fill = options.fill || _FAUST_NAMESPACE["CYAN"];
  this.value_box_w = options.value_box_w || _FAUST_NAMESPACE["VALUE_BOX_W"];
  this.value_box_h = options.value_box_h || _FAUST_NAMESPACE["VALUE_BOX_H"];
  this.address = options.address || '';
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["IncrementalObject"], _FAUST_NAMESPACE["NumericalEntry"]);

_FAUST_NAMESPACE["NumericalEntry"].prototype.w = function() {
  return this._w;
}

_FAUST_NAMESPACE["NumericalEntry"].prototype.h = function() {
  return this._h;
}

_FAUST_NAMESPACE["NumericalEntry"].prototype.compress = function(coef) {
  this._w = Math.max(this.mw, this._w * coef);
  this._h = Math.max(this.mh, this._h * coef);
}

_FAUST_NAMESPACE["NumericalEntry"].prototype.internal_dims = function() {
  return [this.w(), this.h()];
}

_FAUST_NAMESPACE["NumericalEntry"].prototype.dims = function() {
  var ugh = this.internal_dims;
  ugh = [Math.max(ugh[0], this.value_box_w), ugh[1] + (2 * this.lpadding_y) + _FAUST_NAMESPACE["TEXT_PADDING"]];
  return ugh;
}

_FAUST_NAMESPACE["NumericalEntry"].prototype.make_left_button = function(svg, id) {
  return this.make_button(svg, id, 0, false);
}

_FAUST_NAMESPACE["NumericalEntry"].prototype.make_right_button = function(svg, id) {
  return this.make_button(svg, id, this.w() / 2.0 + this.padding, true);
}

_FAUST_NAMESPACE["NumericalEntry"].prototype.make_button = function(svg, id, xo, incr) {
  var identifier = incr ? 'rbutton' : 'lbutton';
  var full_id = 'faust_nentry_'+identifier+'_'+id;
  var w = this.w() / 2.0 - this.padding;
  var h = this.h();

  var d = "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0";
  var button = svg.path(
    d,
    {
      transform = 'translate('+xo+',0)',
      id : full_id,
      style="fill:grey;"
    }
  );


  button.bind(
    'mousedown',
    {
      id : full_id,
      incr : incr
    },
    _FAUST_NAMESPACE['activate_nentry']
  );
  
  return button;
}

_FAUST_NAMESPACE["NumericalEntry"].prototype.make_minus = function(svg, id) {
  var full_id = 'faust_nentry_minus_'+id;
  var x0 = (this.w() / 2.0 - this.padding) / 4.0;
  var y = this.h() / 2.0;
  var x1 = (this.w() / 2.0 - this.padding) * 3.0 / 4.0;
      
  var d = "M"+x0+" "+y+"L"+x1+" "+y;
  var minus = svg.path(
    d,
    {
      id : full_id,
      style: 'stroke:black;'
    }
  );


  minus.bind(
    'mousedown',
    {
      id : full_id,
      incr : false
    },
    _FAUST_NAMESPACE['activate_nentry']
  );
  
  return minus;
}

_FAUST_NAMESPACE["NumericalEntry"].prototype.make_plus = function(svg, id) {
  var full_id = 'faust_nentry_plus_'+id;
  var x00 = (this.w() / 2.0 - this.padding) / 4.0;
  var y0 = this.h() / 2.0;
  var x01 = (this.w() / 2.0 - this.padding) * 3.0 / 4.0;
  var x1 = (this.w() / 2.0 - this.padding) / 2.0;
  var y10 = this.h() / 4.0;
  var y11 = this.h() * 3.0 / 4.0;
  
  var d = "M{0} {1}L{2} {1}M{3} {4}L{3} {5}";
  d.format([x00, y0, x01, x1, y10, y11]);
  var plus = svg.path(
    d,
    {
      transform : 'translate('+(this.w() / 2.0 + this.padding)+',0)';
      id : full_id,
      style: 'stroke:black;'
    }
  );


  plus.bind(
    'mousedown',
    {
      id : full_id,
      incr : true
    },
    _FAUST_NAMESPACE['activate_nentry']
  );
  
  return plus;
}

_FAUST_NAMESPACE["NumericalEntry"].prototype.make = function(svg) {
  var id = _FAUST_NAMESPACE["randString"]();
  var g = this.make_group(
    svg,
    id,
    _FAUST_NAMESPACE["initiate_nentry"],
    {
      id : id,
      mn : this.mn,
      mx : this.mx,
      step : this.step,
      def : this.def,
      label : this.label,
      address : this.address
    }
  );

  g.add(this.make_left_button(svg, id));
  g.add(this.make_right_button(svg, id));
  g.add(this.make_minus(svg, id));
  g.add(this.make_plus(svg, id));
  g.add(this.make_value_box(svg, id, _FAUST_NAMESPACE["nentry_key_sink"], { id : id }));
  g.add(this.make_value_value(svg, id, _FAUST_NAMESPACE["nentry_key_sink"], { id : id }));
  g.add(this.make_label(svg, id));

  return g;
}

_FAUST_NAMESPACE["LayoutManager"] = function(options) {
  this.mom = options.mom || null;
  this.o = options.o || _FAUST_NAMESPACE["X_AXIS"];
  this.padding = options.padding || 10;
  this.objs = options.objs || [];
  this.constrain = options.constrain || true;
  this.gravity = options.gravity || [_FAUST_NAMESPACE["CENTER"], _FAUST_NAMESPACE["CENTER"]];
  this.label = options.label || 'foo';
  this.lpadding_y = options.lpaddiny_y || _FAUST_NAMESPACE["TEXT_HEIGHT"];
  this.box_padding = options.box_padding || _FAUST_NAMESPACE["TEXT_BOX_PADDING"];
  this.x = 0;
  this.y = 0;
  this.w = 0;
  this.h = 0;
  this.box_cache = _FAUST_NAMESPACE["Box"]();
  this.id = _FAUST_NAMESPACE["randString"]();
  this.fill = _FAUST_NAMESPACE["magic_color"]();
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["UIObject"], _FAUST_NAMESPACE["LayoutManager"]);

_FAUST_NAMESPACE["LayoutManager"].prototype.internal_dims = function() {
  out = [[],[]];

  for (var i = 0; i < this.objs.length; i++) {
    var dim = this.objs[i].dims();
    out[_FAUST_NAMESPACE["X_AXIS"]].push(dim[_FAUST_NAMESPACE["X_AXIS"]]);
    out[_FAUST_NAMESPACE["Y_AXIS"]].push(dim[_FAUST_NAMESPACE["Y_AXIS"]]);
  }

  for (var i = _FAUST_NAMESPACE["X_AXIS"]; i < _FAUST_NAMESPACE["NO_AXES"]; i++) {
    out[i] = (i == this.o ? out[i].sum() : out[i].max());
  }

  out[_FAUST_NAMESPACE["other_axis"](this.o)] += this.padding * 2;
  out[this.o] += this.padding * (this.objs.length + 1);
  return out;
}

_FAUST_NAMESPACE["LayoutManager"].prototype.populate_objects = function() {
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].mom = this;
    if ((this.objs[i] instanceof _FAUST_NAMESPACE["LayoutManager"])
        || (this.objs[i] instanceof _FAUST_NAMESPACE["TabGroup"])) {
      this.objs[i].populate_objects();
    }
  }
}

_FAUST_NAMESPACE["LayoutManager"].prototype.dims = function() {
  var ugh = self.internal_dims();
  var out = [ugh[0], ugh[1] + Math.max(this.lpadding_y, this.padding) + this.padding + _FAUST_NAMESPACE["TEXT_PADDING"]];
  return out;
}
_FAUST_NAMESPACE["LayoutManager"].prototype.get_ratio_and_leftover = function(x, y) {
  if (this.constrain) {
    var dims = this.internal_dims();
    var ratio = Math.min(1.0 * x / dims[_FAUST_NAMESPACE["X_AXIS"]], 1.0 * y / dims[_FAUST_NAMESPACE["Y_AXIS"]]);
    var leftover = [x - (dims[_FAUST_NAMESPACE["X_AXIS"]] * ratio), y - (dims[_FAUST_NAMESPACE["Y_AXIS"]] * ratio)];
    return [ratio, leftover];
  }
  return [1.0, [0.0, 0.0]];
}

_FAUST_NAMESPACE["LayoutManager"].prototype.get_real_points = function(x, y) {
  var rp = [];
  for (var i = 0; i < this.objs.length; i++) {
    if (this.objs[i] instanceof _FAUST_NAMESPACE["LayoutManager"]) {
      rp = rp.concat(this.objs[i].get_real_points());
    }
    else {
      var dim = this.objs[i].dims();
      var x = this.objs[i].get_x_offset();
      var y = this.objs[i].get_y_offset();
      rp.push([x,y]);
      rp.push([x+dim[0], y+dim[1]]);
    }
  }
  // we want to account for padding for Y coordinates...
  rp.sort(function(a,b){return a[1] - b[1]});
  rp.push([rp[-1][0], rp[-1][1] + Math.max(this.lpadding_y, this.padding)]);
  rp.push([rp[0][0], rp[0][1] - this.padding]);
  // and now X coordinates...
  rp.sort(function(a,b){return a[0] - b[0]});
  rp.append([rp[-1][0] + this.padding, rp[-1][1]]);
  rp.append([rp[0][0] - this.padding, rp[0][1]]);
  return rp;
}

_FAUST_NAMESPACE["LayoutManager"].prototype.compress = function(coef) {
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].compress(coef);
  }
}

_FAUST_NAMESPACE["LayoutManager"].prototype.do_spacing = function(x, y) {
  var dims = this.dims();
  if (!this.constrain) {
    x = dims[0];
    y = dims[1];
  }
  this.w = x;
  this.h = y;
  // first pass for compression
  var ratio_and_leftover = this.get_ratio_and_leftover(x, y);
  var ratio = ratio_and_leftover[0];
  // now compress
  if (ratio < 1) {
    this.compress(ratio);
  }
  // second pass after compression
  var ratio_and_leftover = this.get_ratio_and_leftover(x, y);
  var ratio = ratio_and_leftover[0];
  var leftover = ratio_and_leftover[1];
  // increase padding by size
  var padding = this.padding * ratio;
  // the first padding will need to account for any additional space, thus
  // the call to jvalue with the leftover
  // use self.gravity, as object gravities will be used internally
  var running_count = padding + _FAUST_NAMESPACE["jvalue"](leftover[this.o], _FAUST_NAMESPACE["LEFT"], this.gravity[this.o]);
  for (var i = 0; i < this.objs.length; i++) {
    var obj = this.objs[i];
    var dim = obj.dims();
    // find dimensions
    var nx = _FAUST_NAMESPACE["xy"](this.o, dim[_FAUST_NAMESPACE["X_AXIS"]] * ratio, x);
    var ny = _FAUST_NAMESPACE["xy"](this.o, y, dim[_FAUST_NAMESPACE["Y_AXIS"]] * ratio);
    if (obj instanceof _FAUST_NAMESPACE["LayoutManager"]) {
      // find offsets
      obj.x = _FAUST_NAMESPACE["xy"](this.o, running_count, this.constrain ? 0 : (dims[_FAUST_NAMESPACE["X_AXIS"]] - dim[_FAUST_NAMESPACE["X_AXIS"]]) / 2.0);
      obj.y = _FAUST_NAMESPACE["xy"](this.o, this.constrain ? 0 : (dims[_FAUST_NAMESPACE["Y_AXIS"]] - dim[_FAUST_NAMESPACE["Y_AXIS"]]) / 2.0, running_count);
      obj.do_spacing(nx, ny);
    }
    else if (obj instanceof _FAUST_NAMESPACE["TabGroup"]) {
      obj.setX(_FAUST_NAMESPACE["xy"](this.o, running_count, 0));
      obj.setY(_FAUST_NAMESPACE["xy"](this.o, 0, running_count));
      obj.do_spacing(nx, ny);
    }
    else {
      xv1 = _FAUST_NAMESPACE["xy"](this.o, running_count, 0);
      xv2 = _FAUST_NAMESPACE["xy"](this.o, running_count + (dim[_FAUST_NAMESPACE["X_AXIS"]] * (ratio - 1)), x - dim[_FAUST_NAMESPACE["X_AXIS"]]);
      obj.x = _FAUST_NAMESPACE["linear_combination"](obj.gravity[_FAUST_NAMESPACE["X_AXIS"]], xv1, xv2);
      yv1 = _FAUST_NAMESPACE["xy"](this.o, 0, running_count);
      yv2 = _FAUST_NAMESPACE["xy"](this.o, y - dim[_FAUST_NAMESPACE["Y_AXIS"]], running_count + (dim[_FAUST_NAMESPACE["Y_AXIS"]] * (ratio - 1)));
      obj.y = _FAUST_NAMESPACE["linear_combination"](obj.gravity[_FAUST_NAMESPACE["Y_AXIS"]], yv1, yv2);
    }
    running_count += padding + (_FAUST_NAMESPACE["xy"](this.o, dim[_FAUST_NAMESPACE["X_AXIS"]], dim[_FAUST_NAMESPACE["Y_AXIS"]]) * ratio);
  }
  // we only want to draw boxes around content
  var my_x = this.get_x_offset();
  var my_y = this.get_y_offset();
  var realpoints = this.get_real_points().map(function(pt) {
    return _FAUST_NAMESPACE["coord_sub"](pt, [my_x, my_y]);
  });
  this.box_cache.clear(); // in case we do typesetting multiple times
  for (var i = 0; i < realpoints.length; i++) {
    this.box_cache.add_point(realpoints[i]);
  }
}

_FAUST_NAMESPACE["LayoutManager"].prototype.make_label = function(svg) {
  full_id = 'faust_label_'+this.id;
  var vl = svg.text(
    0,
    0,
    this.label,
    {
      id : full_id,
      transform: 'translate('+(this.box_cache.x[0] + 3)+','+(this.box_cache.y[1] - 3)+')'
    }
  );

  return vl;
}

_FAUST_NAMESPACE["LayoutManager"].prototype.make_background = function(svg) {
  full_id = 'faust_background_'+this.id;
  var w = this.box_cache.x[1] - this.box_cache.x[0];
  var h = this.box_cache.y[1] - this.box_cache.y[0];
  var d = "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0";
  var background = svg.path(
    d,
    {
      id : full_id,
      transform: 'translate('+this.box_cache.x[0]+','+this.box_cache.y[0]+')',
      style: 'fill:'+_FAUST_NAMESPACE["color_to_rgb"](this.fill)+';stroke:black;'
    }
  );

  return background;
}

_FAUST_NAMESPACE["LayoutManager"].prototype.make = function(svg) {
  var g = this.make_group(svg, self.id);

  g.add(this.make_background(svg));
  g.add(this.make_label(svg));
  for (vsize i = 0; i < this.objs.length; i++) {
    g.add(this.objs[i].make(svg));
  }
  
  return g;
}

_FAUST_NAMESPACE["TabGroup"] = function(options) {
  this.mom = options.mom || null;
  this.headroom = options.headroom || 40;
  this.x_padding = options.x_padding || 10;
  this.x_width = options.x_width || 80;
  this.objs= options.objs || [];
  this.def = options.def || 0;
  this.baselineSkip = options.baselineSkip || 5;
  this.constrain = options.constrain || true;
  this.x = 0;
  this.y = 0;
  this.id = _FAUST_NAMESPACE["randString"]();
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["UIObject"], _FAUST_NAMESPACE["TabGroup"]);

_FAUST_NAMESPACE["TabGroup"].prototype.compress = function(coef) {
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].compress(coef);
  }
}

_FAUST_NAMESPACE["TabGroup"].prototype.setX = function(x) {
  this.x = x;
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].x = x;
  }
}

_FAUST_NAMESPACE["TabGroup"].prototype.setY = function(y) {
  this.y = y;
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].y = y + this.headroom;
  }
}

_FAUST_NAMESPACE["LayoutManager"].prototype.populate_objects = function() {
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].mom = this;
    if ((this.objs[i] instanceof _FAUST_NAMESPACE["LayoutManager"])
        || (this.objs[i] instanceof _FAUST_NAMESPACE["TabGroup"])) {
      this.objs[i].populate_objects();
    }
  }
}

_FAUST_NAMESPACE["TabGroup"].prototype.dims = function() {
  var x = 0;
  var y = 0;
  for (var i = 0; i < this.objs.length; i++) {
    var dim = this.objs[i].dims();
    x = Math.max(x, dim[0]);
    y = Math.max(y, dim[1]);
  }
  return [x, y + self.headroom];
}

_FAUST_NAMESPACE["TabGroup"].prototype.do_spacing = function(x,y) {
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].x = 0;
    this.objs[i].y = this.headroom;
    this.objs[i].do_spacing(x, y - this.headroom);
  }
}

_FAUST_NAMESPACE["TabGroup"].prototype.make_label = function(svg, x, y, l, goodid, badidstr) {
  var vl = svg.text(
    0,
    0,
    l,
    {
      text-anchor : 'middle',
      transform: 'translate('+x+','+y+')'
    }
  );
  
  vl.bind(
    'mousedown',
    {
      goodid : goodid,
      badidstr : badidstr,
      x : this.x,
      y : this.y + this.headroom
    },
    _FAUST_NAMESPACE["shuffletabs"]
  );
  
  return vl;
}

_FAUST_NAMESPACE["TabGroup"].prototype.make_tab = function(svg, w, h, x, y, goodid, badidstr, fill) {
  var tab = svg.path(
    "M 0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0",
    {
      transform: 'translate('+x+','+y+')',
      style: 'fill:'+_FAUST_NAMESPACE["color_to_rgb"](fill)+';stroke:black;'
    }
  );
  
  tab.bind(
    'mousedown',
    {
      goodid : goodid,
      badidstr : badidstr,
      x : this.x,
      y : this.y + this.headroom
    },
    _FAUST_NAMESPACE["shuffletabs"]
  );
  
  return tab;
}

_FAUST_NAMESPACE["TabGroup"].prototype.make_tabs = function(svg) {
  // we evenly space buttons across x axis
  var g = svg.group('faust_tabgroup_tabbar_'+this.id);

  var running_count = 0;
  for (var i = 0; i < this.objs.length; i++) {
    var badidstr = this.objs.filter(function(obj) {obj != this.objs[i]}).map(function(obj) {return obj.id;}).join('#');
    g.add(this.make_tab_svg(
      this.x_width,
      this.headroom,
      running_count,
      0,
      this.objs[i].id,
      badidstr,
      this.objs[i].fill));
    g.add(this.make_label_svg(
      running_count + this.x_width / 2.0,
      this.headroom / 2.0 + this.baselineSkip,
      this.objs[i].label,
      this.objs[i].id,
      badidstr
    ));
    running_count += this.x_width + this.x_padding;
  }

  return g;
}

_FAUST_NAMESPACE["TabGroup"].prototype.make = function(svg) {
  var g = this.make_group(
    svg,
    self.id,
    _FAUST_NAMESPACE['cache_tab_group'],
    {
      self.def,
      self.id,
      this.objs.map(function(obj) {return obj.id;}).join('#');
    }
  );

  g.add(this.make_tabs(svg));
  for (vsize i = 0; i < this.objs.length; i++) {
    g.add(this.objs[i].make(svg));
  }

  return g;
}

// rather than extending the jQuery svg object, we just create a wrapper around it
_FAUST_NAMESPACE["SVG"] = function(svg, w, h, options) {
  this.svg = svg;
  this.w = w;
  this.h = h;
  this.constrain = options.constraion || false;
  this.lm = options.lm || null;
  this.title = options.title || 'foo';
  this.lm.mom = this;
}

_FAUST_NAMESPACE["extend"](_FAUST_NAMESPACE["UIObject"], _FAUST_NAMESPACE["SVG"]);

_FAUST_NAMESPACE["SVG"].prototype.get_x_offset = function() {
  return 0;
}

_FAUST_NAMESPACE["SVG"].prototype.get_y_offset = function() {
  return 0;
}

_FAUST_NAMESPACE["SVG"].prototype.make = function() {
  if (!self.constrain) {
    var dims = this.lm.dims();
    this.svg.configure(
      {
        viewBox: '0 0 '+dims[0]+' '+dims[1],
        width : this.w+'px',
        height: this.h+'px'
      },
      true);
  }
  _FAUST_NAMESPACE["ROOT"] = this.title;
  this.lm.populate_objects();
  this.lm.do_spacing(this.w, this.h);
  this.svg.add(this.lm.make(this.svg));
}

_FAUST_NAMESPACE["load"] = function(svg) {
  var raw_json = ;
  var json = eval ("(" + raw_json + ")");

  var faust_svg = _FAUST_NAMESPACE["SVG"](
    svg,
    $(window).width(),
    $(window).height(),
    {
      constrain : true,
      title : json["name"],
      lm : _FAUST_NAMESPACE["json_to_ui"](json)
    }
  );

  faust_svg.lm.mom = faust_svg;
  faust_svg.make();
}
