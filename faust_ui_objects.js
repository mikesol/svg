// all onload need to be pushed to the end of the creation

/*
  DEFINES THE FAUST OBJECT CLASS.
  All graphical objects inherit from this.
*/

_f4u$t.UIObject = function() {
  this.x = 0.0;
  this.y = 0.0;
}

_f4u$t.UIObject.prototype.make_group = function(svg, parent, id) {
  out = svg.group(
    parent,
    id,
    {
      transform: 'translate('+this.x+','+this.y+')'
    });

  return out;
}

_f4u$t.UIObject.prototype.get_x_offset = function() {
  if (!this.mom) {
    return this.x;
  }
  return this.x + this.mom.get_x_offset();
}

_f4u$t.UIObject.prototype.get_y_offset = function() {
  if (!this.mom) {
    return this.y;
  }
  return this.y + this.mom.get_y_offset();
}

_f4u$t.UIObject.prototype.compress = function() {
  // does nothing
}

/*
  DEFINES THE FAUST INCREMENTAL OBJECT CLASS.
  All objects that go up in increments inherit from this.
*/

_f4u$t.IncrementalObject = function () {}
_f4u$t.extend(_f4u$t.UIObject, _f4u$t.IncrementalObject);

_f4u$t.IncrementalObject.prototype.make_value_box = function(svg, parent, id, mousedown) {
  var vb = svg.path(
    parent,
    "M0 0L"+this.value_box_w+" 0L"+this.value_box_w+" "+this.value_box_h+"L0 "+this.value_box_h+"L0 0",
    {
      id: 'faust_value_box_'+id,
      transform: 'translate(0,'+(this.internal_dims()[1] + this.box_padding)+')',
      style: 'fill:white;stroke:black;',
      onmousedown : mousedown
    }
  );
  
  return vb;
}

_f4u$t.IncrementalObject.prototype.make_value_value = function(svg, parent, id, mousedown) {
  var vv = svg.text(
    parent,
    0,
    0,
    this.def.toString(),
    {
      id: 'faust_value_value_'+id,
      transform: 'translate('+this.box_padding+','+(this.internal_dims()[1] + this.lpadding_y)+')',
      onmousedown : mousedown
    }
  );
  return vv;
}

_f4u$t.IncrementalObject.prototype.make_label = function(svg, parent, id) {
  var vl = svg.text(
    parent,
    0,
    0,
    this.label,
    {
      id: 'faust_label_'+id,
      transform: 'translate(0,'+(this.internal_dims()[1] + this.lpadding_y + this.lpadding_y)+')'
    }
  );
  return vl;
}

/*
  DEFINES A ROTATING BUTTON.
*/

_f4u$t.RotatingButton = function(options) {
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
  this.def = _f4u$t.bound(options.def || 50, this.mn, this.mx);
  this.step = options.step || 1;
  this.step = options.step || 1;
  this.lpadding_y = options.lpadding_y || _f4u$t.TEXT_HEIGHT;
  this.box_padding = options.box_padding || _f4u$t.TEXT_BOX_PADDING;
  this.gravity = options.gravity || [_f4u$t.CENTER, _f4u$t.CENTER];
  this.fill= options.fill || _f4u$t.CYAN;
  this.value_box_w = options.value_box_w || _f4u$t.VALUE_BOX_W;
  this.value_box_h = options.value_box_h || _f4u$t.VALUE_BOX_H;
  this.address = options.address || '';
}

_f4u$t.extend(_f4u$t.IncrementalObject, _f4u$t.RotatingButton);

_f4u$t.RotatingButton.prototype.compress = function(coef) {
  this._r = Math.max(this.mr, this._r * coef);
}

_f4u$t.RotatingButton.prototype.r = function() {
  return this._r;
}

_f4u$t.RotatingButton.prototype.get_maybe_extremal_coords = function() {
  var angles = _f4u$t.find_all_90s(this.a0, this.sweep);
  angles.push(this.a0);
  angles.push(this.a0 + this.sweep);
  angles.sort();
  var coords = new Array();
  for (var i = 0; i < angles.length; i++) {
    coords.push(_f4u$t.point_from_polar(this.r(), _f4u$t.d2r(angles[i])));
  }
  coords.push([0,0]);
  return coords;
}

_f4u$t.RotatingButton.prototype.internal_dims = function() {
  var coords = this.get_maybe_extremal_coords();
  var box = new _f4u$t.Box();
  for (var i = 0; i < coords.length; i++) {
    box.add_point(coords[i]);
  }
  var ugh = box.lens();
  return ugh;
}

_f4u$t.RotatingButton.prototype.dims = function() {
  var ugh = this.internal_dims();
  return [Math.max(ugh[0], this.value_box_w), ugh[1] + (2 * this.lpadding_y) + _f4u$t.TEXT_PADDING];
}

_f4u$t.RotatingButton.prototype.get_translation = function() {
  var coords = this.get_maybe_extremal_coords();
  var x = Number.POSITIVE_INFINITY;
  var y = Number.POSITIVE_INFINITY;
  for (var i = 0; i < coords.length; i++) {
    x = Math.min(x, coords[i][0]);
    y = Math.min(x, coords[i][1]);
  }
  return [x,y];
}

_f4u$t.RotatingButton.prototype.make_joint = function(svg, parent, id) {
  var trans = this.get_translation()
  var start = _f4u$t.coord_sub(_f4u$t.point_from_polar(this.r(), _f4u$t.d2r(this.a0)), trans);
  var end = _f4u$t.coord_sub(_f4u$t.point_from_polar(this.r(), _f4u$t.d2r(this.a0 + this.sweep)), trans);
  var origin = _f4u$t.coord_sub([0,0], trans);
  var small = this.sweep < 180;
  var d = "M{0} {1}L{2} {3} A{4} {4} {5} 1 {6} {7}L{0} {1}";
  d = d.format([
    origin[0], origin[1],
    start[0], start[1],
    this.r(),
    (small ? "1 0" : "0 1"),
    end[0], end[1]
  ]);

  var joint = svg.path(
    parent,
    d,
    {
      style : "fill:"+_f4u$t.color_to_rgb(this.fill)+";stroke:black;",
      id : 'faust_rbutton_joint_'+id
    }
  );
  
  return joint;
}

_f4u$t.RotatingButton.prototype.make_knob = function(svg, parent, id) {
  var trans = this.get_translation();
  var slider_angle = this.sweep * this.sp;
  var half_slider_angle = slider_angle * 0.5;
  var startp = _f4u$t.remap(this.def, this.mn, this.mx, this.a0 + half_slider_angle, this.a0 + this.sweep - half_slider_angle)
  var start = _f4u$t.coord_sub(_f4u$t.point_from_polar(this.r(), _f4u$t.d2r(this.a0)), trans);
  var end = _f4u$t.coord_sub(_f4u$t.point_from_polar(this.r(), _f4u$t.d2r(this.a0 + slider_angle)), trans);
  var origin = _f4u$t.coord_sub([0,0], trans);
  var small = this.sweep * this.sp < 180;
  var full_id = 'faust_rbutton_knob_'+id;
  var d = "M{0} {1}L{2} {3} A{4} {4} {5} 1 {6} {7}L{0} {1}";
  d = d.format([
    origin[0], origin[1],
    start[0], start[1],
    this.r(),
    (small ? "1 0" : "0 1"),
    end[0], end[1]
  ]);

  var knob = svg.path(
    parent,
    d,
    {
      style : "fill:grey;stroke:black;",
      id : full_id,
      transform : 'translate(0,0) scale(1,1) rotate('+(startp - half_slider_angle + 180)+','+origin[0]+','+origin[1]+')',
      onmousedown : '_f4u$t.activate_rbutton("'+full_id+'")'
    }
  );
  
  return knob;
}

_f4u$t.RotatingButton.prototype.make = function(svg, parent) {
  var id = _f4u$t.randString();
  var g = this.make_group(svg, parent, id);
  var trans = this.get_translation();
  var origin = _f4u$t.coord_sub([0,0], trans);
  _f4u$t.initiate_rbutton(
    id,
    this.a0 + 180,
    this.sweep,
    this.sp,
    origin[0],
    origin[1],
    this.get_x_offset(),
    this.get_y_offset(),
    this.mn,
    this.mx,
    this.step,
    this.label,
    this.address
  );

  this.make_joint(svg, g, id);
  this.make_knob(svg, g, id);
  this.make_value_box(svg, g, id, '_f4u$t.rotating_button_key_sink("'+id+'")');
  this.make_value_value(svg, g, id, '_f4u$t.rotating_button_key_sink("'+id+'")');
  this.make_label(svg, g, id);

  return g;
}

/*
  DEFINES A SLIDER.
*/

_f4u$t.SlidingObject = function(options) {
  this.mom = options.mom || null;
  this.o = options.o || _f4u$t.X_AXIS;
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
  this.def = _f4u$t.bound(options.def || 50, this.mn, this.mx);
  this.step = options.step || 1;
  this.lpadding_y = options.lpadding_y || _f4u$t.TEXT_HEIGHT;
  this.box_padding = options.box_padding || _f4u$t.TEXT_BOX_PADDING;
  this.gravity = options.gravity || [_f4u$t.CENTER, _f4u$t.CENTER];
  this.fill = options.fill || _f4u$t.CYAN;
  this.value_box_w = options.value_box_w || _f4u$t.VALUE_BOX_W;
  this.value_box_h = options.value_box_h || _f4u$t.VALUE_BOX_H;
  this.address = options.address || '';
  this.type = options.type || '';
}

_f4u$t.extend(_f4u$t.IncrementalObject, _f4u$t.SlidingObject);

_f4u$t.SlidingObject.prototype.compress = function(coef) {
  this._wa = Math.max(this.mwa, this._wa * coef);
  this._sa = Math.max(this.msa, this._sa * coef);
}

_f4u$t.SlidingObject.prototype.wa = function() {
  return this._wa;
}

_f4u$t.SlidingObject.prototype.sa = function() {
  return this._sa;
}

_f4u$t.SlidingObject.prototype.internal_dims = function() {
  var x = _f4u$t.xy(this.o, this.sa(), this.wa());
  var y = _f4u$t.xy(this.o, this.wa(), this.sa());
  return [x,y];
}

_f4u$t.SlidingObject.prototype.dims = function() {
  var ugh = this.internal_dims();
  ugh = [Math.max(ugh[0], this.value_box_w), ugh[1] + (2 * this.lpadding_y) + _f4u$t.TEXT_PADDING];
  return ugh;
}

_f4u$t.SlidingObject.prototype.make_joint = function(svg, parent, id) {
  var w = _f4u$t.xy(this.o, this.sa(), this.wa());
  var h = _f4u$t.xy(this.o, this.wa(), this.sa());
  var joint = svg.path(
    parent,
    "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0",
    {
      id : 'faust_'+this.type+'_joint_'+id,
      style : "fill:"+_f4u$t.color_to_rgb(this.fill)+";stroke:black;"
    }
  );

  return joint;
}

_f4u$t.Slider = function(options) {
  _f4u$t.SlidingObject.call(this, options);
  this.sp = options.sp || 0.15;
}

_f4u$t.extend(_f4u$t.SlidingObject, _f4u$t.Slider);

_f4u$t.Slider.prototype.make_knob = function(svg, parent, id) {
  var slider_girth = this.sa()  * this.sp;
  var half_slider_girth = slider_girth * 0.5;
  var startp = _f4u$t.remap(this.def, this.mn, this.mx, 0 + half_slider_girth, this.sa() - half_slider_girth);
  var bottom = startp - half_slider_girth;
  var top = startp + half_slider_girth;
  var w = _f4u$t.xy(this.o, slider_girth, this.wa());
  var h = _f4u$t.xy(this.o, this.wa(), slider_girth);
  var x = _f4u$t.xy(this.o, bottom, 0);
  var y = _f4u$t.xy(this.o, 0, bottom);
  var full_id = 'faust_'+this.type+'_knob_'+id;
  var activate_fn = "activate_"+this.type;

  var knob = svg.path(
    parent,
    "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0",
    {
      id : full_id,
      style : "fill:grey;stroke:black;",
      transform : 'translate('+x+','+y+')',
      onmousedown : '_f4u$t["'+activate_fn+'"]("'+full_id+'")'
    }
  );
  
  return knob;
}

_f4u$t.Slider.prototype.make = function(svg, parent) {
  var id = _f4u$t.randString();
  var g = this.make_group(svg, parent, id);

  _f4u$t["initiate_"+this.type](
    id,
    this.sa(),
    this.sp,
    this.mn,
    this.mx,
    this.step,
    this.label,
    this.address
  );

  this.make_joint(svg, g, id);
  this.make_knob(svg, g, id);
  this.make_value_box(
    svg,
    g,
    id,
    '_f4u$t["'+this.type+'_key_sink"]("'+id+'")'
  );
  this.make_value_value(
    svg,
    g,
    id,
    '_f4u$t["'+this.type+'_key_sink"]("'+id+'")'
  );
  this.make_label(svg, g, id);
  return g;
}

/*
  DEFINES A HORIZONTAL SLIDER.
*/

_f4u$t.HorizontalSlider = function(options) {
  options = options || {};
  options["o"] = _f4u$t.X_AXIS;
  options["type"] = 'hslider';
  _f4u$t.Slider.call(this, options);
}

_f4u$t.extend(_f4u$t.Slider, _f4u$t.HorizontalSlider);

/*
  DEFINES A VERTICAL SLIDER.
*/

_f4u$t.VerticalSlider = function(options) {
  options = options || {};
  options["o"] = _f4u$t.Y_AXIS;
  options["type"] = 'vslider';
  _f4u$t.Slider.call(this, options);
}

_f4u$t.extend(_f4u$t.Slider, _f4u$t.VerticalSlider);

_f4u$t.BarGraph = function(options) {
  _f4u$t.SlidingObject.call(this, options);
}

_f4u$t.extend(_f4u$t.SlidingObject, _f4u$t.BarGraph);

_f4u$t.BarGraph.prototype.make_meter = function(svg, parent, id) {
  var full_id = 'faust_'+this.type+'_meter_'+id;
  def = _f4u$t.remap(this.def, this.mn, this.mx, 0, this.sa())
  var w = _f4u$t.xy(this.o, def, this.wa());
  var h = _f4u$t.xy(this.o, this.wa(), def);
  var meter = svg.path(
    parent,
    "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0",
    {
      id : full_id,
      style : "fill:grey;stroke:black;"
    }
  );

  return meter;
}

_f4u$t.BarGraph.prototype.make = function(svg, parent) {
  var id = _f4u$t.randString();
  var g = this.make_group(svg, parent, id);
  _f4u$t['initiate_'+this.type](id, this.address);

  this.make_joint(svg, g, id);
  this.make_meter(svg, g, id);
  this.make_value_box(svg, g, id);
  this.make_value_value(svg, g, id);
  this.make_label(svg, g, id);

  return g;
}

/*
  DEFINES A HORIZONTAL BAR GRAPH.
*/

_f4u$t.HorizontalBarGraph = function(options) {
  options = options || {};
  options["o"] = _f4u$t.X_AXIS;
  options["type"] = 'hbargraph';
  _f4u$t.BarGraph.call(this, options);
}

_f4u$t.extend(_f4u$t.BarGraph, _f4u$t.HorizontalBarGraph);

/*
  DEFINES A VERTICAL BAR GRAPH.
*/

_f4u$t.VerticalBarGraph = function(options) {
  options = options || {};
  options["o"] = _f4u$t.Y_AXIS;
  options["type"] = 'vbargraph';
  _f4u$t.BarGraph.call(this, options);
}

_f4u$t.extend(_f4u$t.BarGraph, _f4u$t.VerticalBarGraph);

_f4u$t.CheckBox = function(options) {
  this.MAGIC = 19; // not optional...
  this.mom = options.mom || null;
  this.d = options.d || 19;
  this.label = options.label || 'foo';
  this.gravity = options.gravity || [_f4u$t.CENTER, _f4u$t.CENTER];
  this.fill = options.fill || _f4u$t.PINK;
  this.def = options.def || false;
  this.lpadding_y = options.lpadding_y || _f4u$t.TEXT_HEIGHT;
  this.box_padding = options.box_padding || _f4u$t.TEXT_BOX_PADDING;
  this.address = options.address || '';
}

_f4u$t.extend(_f4u$t.UIObject, _f4u$t.CheckBox);

_f4u$t.CheckBox.prototype.compress = function() {}

_f4u$t.CheckBox.prototype.internal_dims = function() {
  return [this.d, this.d];
}

_f4u$t.CheckBox.prototype.dims = function() {
  var ugh = this.internal_dims();
  return [ugh[0], ugh[1] + this.lpadding_y + _f4u$t.TEXT_PADDING + (this.d * 0.1 / this.MAGIC)]
}

// DON'T FORGET TO SPECIFY CHECK IN CALLBACK
_f4u$t.CheckBox.prototype.make_box = function(svg, parent, id) {
  var full_id = 'faust_checkbox_box_'+id;
  var w = this.d;
  var h = this.d;
  
  var box = svg.path(
    parent,
    "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0",
    {
      id : full_id,
      style : "fill:white;stroke:black;",
      onmousedown : '_f4u$t.change_checkbox({0})'.format(full_id)
    }
  );

  return box;
}

_f4u$t.CheckBox.prototype.make_check = function(svg, parent, id) {
  var full_id = 'faust_checkbox_check_'+id;
  var w = this.d;
  var h = this.d;
  var scale = this.d * 1.0 / this.MAGIC;
  _f4u$t.initiate_checkbox(full_id, this.address);
  var box = svg.path(
    parent,
    "M 8.5296806,20.14262 C 6.6396806,17.55262 6.7896806,15.14262 5.2896806,13.53262 C 3.7896806,11.95262 5.6496806,12.23262 6.0696806,12.49262 C 9.5326806,14.79862 8.7036806,21.25062 11.339681,13.13262 C 13.095681,6.90862 16.589681,1.89262 17.296681,0.95421999 C 18.049681,0.02261999 18.400681,1.04122 17.638681,2.16262 C 14.279681,7.67262 13.569681,11.03262 11.150681,19.23262 C 10.846681,20.26262 9.3646806,21.28262 8.5296806,20.13262 L 8.5286806,20.13762 L 8.5296806,20.14262 z",
    {
      id : full_id,
      transform : "scale("+scale+","+scale+") translate(-1.0896806, -4.3926201)",
      style : "fill:"+_f4u$t.color_to_rgb(this.fill)+";opacity:"+(this.def == 1 ? 1.0 : 0.0)+";",
      onmousedown : '_f4u$t.change_checkbox({0})'.format(full_id)
    }
  );

  return box;
}

_f4u$t.CheckBox.prototype.make_label = function(svg, parent, id) {
  var vl = svg.text(
    parent,
    0,
    0,
    this.label,
    {
      id: 'faust_label_'+id,
      transform: 'translate(0,'+(this.internal_dims()[1] + this.lpadding_y)+')'
    }
  );

  return vl;
}

_f4u$t.CheckBox.prototype.make = function(svg, parent) {
  var id = _f4u$t.randString();
  var g = this.make_group(svg, parent, id);
  _f4u$t.initiate_checkbox(id, this.address);

  this.make_box(svg, g, id);
  this.make_check(svg, g, id);
  this.make_label(svg, g, id);

  return g;
}

/*
  Button in 
*/

_f4u$t.Button = function(options) {
  this.mom = options.mom || null;
  this.iw = options.iw || 80;
  this.ih = options.ih || 40;
  this.mw = options.mw || 40;
  this.mh = options.mh || 20;
  this._w = this.iw;
  this._h = this.ih;
  this.label = options.label || 'foo';
  this.gravity = options.gravity || [_f4u$t.CENTER, _f4u$t.CENTER];
  this.fillOn = options.fillOn || _f4u$t.PINK;
  this.fillOff = options.fillOff || _f4u$t.GREEN;
  this.baselineSkip = options.baselineSkip || 5;
  this.address = options.address || '';
}

_f4u$t.extend(_f4u$t.UIObject, _f4u$t.Button);

_f4u$t.Button.prototype.w = function() {
  return this._w;
}

_f4u$t.Button.prototype.h = function() {
  return this._h;
}

_f4u$t.Button.prototype.compress = function(coef) {
  this._w = Math.max(this.mw, this._w * coef);
  this._h = Math.max(this.mh, this._h * coef);
}

_f4u$t.Button.prototype.dims = function(coef) {
  return [this.w(), this.h()];
}

_f4u$t.Button.prototype.make_button_box = function(svg, parent, id) {
  var full_id = 'faust_button_box_'+id;
  var rf = 10;
  var d = "M{0} 0L{1} 0C{2} 0 {2} 0 {2} {3}L{2} {4}C{2} {5} {2} {5} {1} {5}L{0} {5}C0 {5} 0 {5} 0 {4}L0 {3}C0 0 0 0 {0} 0";
  d = d.format([rf, this.w() - rf, this.w(), rf, this.h() - rf, this.h()]);

  var button = svg.path(
    parent,
    d,
    {
      id : full_id,
      style : "fill:"+_f4u$t.color_to_rgb(this.fillOff)+";",
      onmousedown : '_f4u$t.button_down("'+full_id+'")',
      onmouseup : '_f4u$t.button_up("'+full_id+'")'
    }
  );

  return button;
}

_f4u$t.Button.prototype.make_label = function(svg, parent, id) {
  var full_id = 'faust_button_box_'+id;
  var vl = svg.text(
    parent,
    0,
    0,
    this.label,
    {
      "text-anchor" : 'middle',
      id: 'faust_label_'+id,
      transform: 'translate('+(this.w() / 2.0)+','+(this.h() / 2.0 + this.baselineSkip)+')',
      onmousedown : '_f4u$t.button_down("'+full_id+'")',
      onmouseup : '_f4u$t.button_up("'+full_id+'")'
    }
  );
  
  return vl;
}

_f4u$t.Button.prototype.make = function(svg, parent) {
  var id = _f4u$t.randString();
  var g = this.make_group(svg, parent, id);
  _f4u$t.initiate_button(
    id,
    _f4u$t.color_to_rgb(this.fillOff),
    _f4u$t.color_to_rgb(this.fillOn),
    this.address
  );

  this.make_button_box(svg, g, id);
  this.make_label(svg, g, id);

  return g;
}

_f4u$t.NumericalEntry = function(options) {
  this.mom = options.mom || null;
  this.iw = options.iw || _f4u$t.VALUE_BOX_W;
  this.ih = options.ih || _f4u$t.VALUE_BOX_H;
  this.mw = options.mw || _f4u$t.VALUE_BOX_W;
  this.mh = options.mh || _f4u$t.VALUE_BOX_H;
  this._w = this.iw;
  this._h = this.ih;
  this.label = options.label || 'foo';
  this.unit = options.unitl || 'grames';
  this.mn = options.mn || 0;
  this.mx = options.mx || 100;
  this.def = _f4u$t.bound(options.def || 50, this.mn, this.mx);
  this.step = options.step || 1;
  this.padding = options.padding || 1;
  this.lpadding_y = options.lpadding_y || _f4u$t.TEXT_HEIGHT;
  this.box_padding = options.box_padding || _f4u$t.TEXT_BOX_PADDING;
  this.gravity = options.gravity || [_f4u$t.CENTER, _f4u$t.CENTER];
  this.fill = options.fill || _f4u$t.CYAN;
  this.value_box_w = options.value_box_w || _f4u$t.VALUE_BOX_W;
  this.value_box_h = options.value_box_h || _f4u$t.VALUE_BOX_H;
  this.address = options.address || '';
}

_f4u$t.extend(_f4u$t.IncrementalObject, _f4u$t.NumericalEntry);

_f4u$t.NumericalEntry.prototype.w = function() {
  return this._w;
}

_f4u$t.NumericalEntry.prototype.h = function() {
  return this._h;
}

_f4u$t.NumericalEntry.prototype.compress = function(coef) {
  this._w = Math.max(this.mw, this._w * coef);
  this._h = Math.max(this.mh, this._h * coef);
}

_f4u$t.NumericalEntry.prototype.internal_dims = function() {
  return [this.w(), this.h()];
}

_f4u$t.NumericalEntry.prototype.dims = function() {
  var ugh = this.internal_dims();
  ugh = [Math.max(ugh[0], this.value_box_w), ugh[1] + (2 * this.lpadding_y) + _f4u$t.TEXT_PADDING];
  return ugh;
}

_f4u$t.NumericalEntry.prototype.make_left_button = function(svg, parent, id) {
  return this.make_button(svg, parent, id, 0, false);
}

_f4u$t.NumericalEntry.prototype.make_right_button = function(svg, parent, id) {
  return this.make_button(svg, parent, id, this.w() / 2.0 + this.padding, true);
}

_f4u$t.NumericalEntry.prototype.make_button = function(svg, parent, id, xo, incr) {
  var identifier = incr ? 'rbutton' : 'lbutton';
  var full_id = 'faust_nentry_'+identifier+'_'+id;
  var w = this.w() / 2.0 - this.padding;
  var h = this.h();

  var d = "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0";
  var button = svg.path(
    parent,
    d,
    {
      transform : 'translate('+xo+',0)',
      id : full_id,
      style : "fill:grey;",
      mouseDown : function() { _f4u$t.activate_nentry(full_id, incr); }
    }
  );

  return button;
}

_f4u$t.NumericalEntry.prototype.make_minus = function(svg, parent, id) {
  var full_id = 'faust_nentry_minus_'+id;
  var x0 = (this.w() / 2.0 - this.padding) / 4.0;
  var y = this.h() / 2.0;
  var x1 = (this.w() / 2.0 - this.padding) * 3.0 / 4.0;
      
  var d = "M"+x0+" "+y+"L"+x1+" "+y;
  var minus = svg.path(
    parent,
    d,
    {
      id : full_id,
      style: 'stroke:black;',
      mouseDown : function() { _f4u$t.activate_nentry(full_id, false); }
    }
  );

  return minus;
}

_f4u$t.NumericalEntry.prototype.make_plus = function(svg, parent, id) {
  var full_id = 'faust_nentry_plus_'+id;
  var x00 = (this.w() / 2.0 - this.padding) / 4.0;
  var y0 = this.h() / 2.0;
  var x01 = (this.w() / 2.0 - this.padding) * 3.0 / 4.0;
  var x1 = (this.w() / 2.0 - this.padding) / 2.0;
  var y10 = this.h() / 4.0;
  var y11 = this.h() * 3.0 / 4.0;
  
  var d = "M{0} {1}L{2} {1}M{3} {4}L{3} {5}";
  d = d.format([x00, y0, x01, x1, y10, y11]);
  var plus = svg.path(
    parent,
    d,
    {
      transform : 'translate('+(this.w() / 2.0 + this.padding)+',0)',
      id : full_id,
      style: 'stroke:black;',
      mouseDown : function() { _f4u$t.activate_nentry(full_id, true); }
    }
  );

  return plus;
}

_f4u$t.NumericalEntry.prototype.make = function(svg, parent) {
  var id = _f4u$t.randString();
  var g = this.make_group(svg, parent, id);
  _f4u$t.initiate_nentry(id, this.mn, this.mx, this.step, this.def, this.label, this.address);

  this.make_left_button(svg, g, id);
  this.make_right_button(svg, g, id);
  this.make_minus(svg, g, id);
  this.make_plus(svg, g, id);
  this.make_value_box(svg, g, id, '_f4u$t.nentry_key_sink("'+id+'")');
  this.make_value_value(svg, g, id, '_f4u$t.nentry_key_sink("'+id+'")');
  this.make_label(svg, g, id);

  return g;
}

_f4u$t.LayoutManager = function(options) {
  this.mom = options.mom || null;
  this.o = options.o || _f4u$t.X_AXIS;
  this.padding = options.padding || 10;
  this.objs = options.objs || [];
  this.constrain = options.constrain || false;
  this.gravity = options.gravity || [_f4u$t.CENTER, _f4u$t.CENTER];
  this.label = options.label || 'foo';
  this.lpadding_y = options.lpaddiny_y || _f4u$t.TEXT_HEIGHT;
  this.box_padding = options.box_padding || _f4u$t.TEXT_BOX_PADDING;
  this.x = 0;
  this.y = 0;
  this.w = 0;
  this.h = 0;
  this.box_cache = new _f4u$t.Box();
  this.id = _f4u$t.randString();
  this.fill = _f4u$t.magic_color();
}

_f4u$t.extend(_f4u$t.UIObject, _f4u$t.LayoutManager);

_f4u$t.LayoutManager.prototype.internal_dims = function() {
  outx = [];
  outy = [];
  for (var i = 0; i < this.objs.length; i++) {
    var dim = this.objs[i].dims();
    outx.push(dim[_f4u$t.X_AXIS]);
    outy.push(dim[_f4u$t.Y_AXIS]);
  }

  var out = [outx,outy];

  for (var i = _f4u$t.X_AXIS; i < _f4u$t.NO_AXES; i++) {
    out[i] = (i == this.o ? out[i].sum() : out[i].max());
  }

  out[_f4u$t.other_axis(this.o)] += this.padding * 2;
  out[this.o] += this.padding * (this.objs.length + 1);
  return out;
}

_f4u$t.LayoutManager.prototype.populate_objects = function() {
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].mom = this;
    if ((this.objs[i] instanceof _f4u$t.LayoutManager)
        || (this.objs[i] instanceof _f4u$t.TabGroup)) {
      this.objs[i].populate_objects();
    }
  }
}

_f4u$t.LayoutManager.prototype.dims = function() {
  var ugh = this.internal_dims();
  var out = [ugh[0], ugh[1] + Math.max(this.lpadding_y, this.padding) + this.padding + _f4u$t.TEXT_PADDING];
  return out;
}

_f4u$t.LayoutManager.prototype.get_ratio_and_leftover = function(x, y) {
  if (this.constrain) {
    var dims = this.internal_dims();
    var ratio = Math.min(1.0 * x / dims[_f4u$t.X_AXIS], 1.0 * y / dims[_f4u$t.Y_AXIS]);
    var leftover = [x - (dims[_f4u$t.X_AXIS] * ratio), y - (dims[_f4u$t.Y_AXIS] * ratio)];
    return [ratio, leftover];
  }
  return [1.0, [0.0, 0.0]];
}

_f4u$t.LayoutManager.prototype.get_real_points = function(x, y) {
  var rp = [];
  for (var i = 0; i < this.objs.length; i++) {
    if (this.objs[i] instanceof _f4u$t.LayoutManager) {
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
  rp.push([rp[rp.length - 1][0], rp[rp.length - 1][1] + Math.max(this.lpadding_y, this.padding)]);
  rp.push([rp[0][0], rp[0][1] - this.padding]);
  // and now X coordinates...
  rp.sort(function(a,b){return a[0] - b[0]});
  rp.push([rp[rp.length - 1][0] + this.padding, rp[rp.length - 1][1]]);
  rp.push([rp[0][0] - this.padding, rp[0][1]]);
  return rp;
}

_f4u$t.LayoutManager.prototype.compress = function(coef) {
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].compress(coef);
  }
}

_f4u$t.LayoutManager.prototype.do_spacing = function(x, y) {
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
  // use this.gravity, as object gravities will be used internally
  var running_count = padding + _f4u$t.jvalue(leftover[this.o], _f4u$t.LEFT, this.gravity[this.o]);
  for (var i = 0; i < this.objs.length; i++) {
    var obj = this.objs[i];
    var dim = obj.dims();
    // find dimensions
    var nx = _f4u$t.xy(this.o, dim[_f4u$t.X_AXIS] * ratio, x);
    var ny = _f4u$t.xy(this.o, y, dim[_f4u$t.Y_AXIS] * ratio);
    if (obj instanceof _f4u$t.LayoutManager) {
      // find offsets
      obj.x = _f4u$t.xy(this.o, running_count, this.constrain ? 0 : (dims[_f4u$t.X_AXIS] - dim[_f4u$t.X_AXIS]) / 2.0);
      obj.y = _f4u$t.xy(this.o, this.constrain ? 0 : (dims[_f4u$t.Y_AXIS] - dim[_f4u$t.Y_AXIS]) / 2.0, running_count);
      obj.do_spacing(nx, ny);
    }
    else if (obj instanceof _f4u$t.TabGroup) {
      obj.setX(_f4u$t.xy(this.o, running_count, 0));
      obj.setY(_f4u$t.xy(this.o, 0, running_count));
      obj.do_spacing(nx, ny);
    }
    else {
      xv1 = _f4u$t.xy(this.o, running_count, 0);
      xv2 = _f4u$t.xy(this.o, running_count + (dim[_f4u$t.X_AXIS] * (ratio - 1)), x - dim[_f4u$t.X_AXIS]);
      obj.x = _f4u$t.linear_combination(obj.gravity[_f4u$t.X_AXIS], xv1, xv2);
      yv1 = _f4u$t.xy(this.o, 0, running_count);
      yv2 = _f4u$t.xy(this.o, y - dim[_f4u$t.Y_AXIS], running_count + (dim[_f4u$t.Y_AXIS] * (ratio - 1)));
      obj.y = _f4u$t.linear_combination(obj.gravity[_f4u$t.Y_AXIS], yv1, yv2);
    }
    running_count += padding + (_f4u$t.xy(this.o, dim[_f4u$t.X_AXIS], dim[_f4u$t.Y_AXIS]) * ratio);
  }
  // we only want to draw boxes around content
  var my_x = this.get_x_offset();
  var my_y = this.get_y_offset();
  var realpoints = this.get_real_points().map(function(pt) {
    return _f4u$t.coord_sub(pt, [my_x, my_y]);
  });
  this.box_cache.clear(); // in case we do typesetting multiple times
  for (var i = 0; i < realpoints.length; i++) {
    this.box_cache.add_point(realpoints[i]);
  }
}

_f4u$t.LayoutManager.prototype.make_label = function(svg, parent) {
  full_id = 'faust_label_'+this.id;
  var vl = svg.text(
    parent,
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

_f4u$t.LayoutManager.prototype.make_background = function(svg, parent) {
  full_id = 'faust_background_'+this.id;
  var w = this.box_cache.x[1] - this.box_cache.x[0];
  var h = this.box_cache.y[1] - this.box_cache.y[0];
  var d = "M0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0";
  var background = svg.path(
    parent,
    d,
    {
      id : full_id,
      transform: 'translate('+this.box_cache.x[0]+','+this.box_cache.y[0]+')',
      style: 'fill:'+_f4u$t.color_to_rgb(this.fill)+';stroke:black;'
    }
  );

  return background;
}

_f4u$t.LayoutManager.prototype.make = function(svg, parent) {
  var g = this.make_group(svg, parent, this.id);

  this.make_background(svg, g);
  this.make_label(svg, g);
  
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].make(svg, g);
  }

  return g;
}

_f4u$t.TabGroup = function(options) {
  this.mom = options.mom || null;
  this.headroom = options.headroom || 40;
  this.x_padding = options.x_padding || 10;
  this.x_width = options.x_width || 80;
  this.objs= options.objs || [];
  this.def = options.def || 0;
  this.baselineSkip = options.baselineSkip || 5;
  this.constrain = options.constrain || false;
  this.x = 0;
  this.y = 0;
  this.id = _f4u$t.randString();
}

_f4u$t.extend(_f4u$t.UIObject, _f4u$t.TabGroup);

_f4u$t.TabGroup.prototype.compress = function(coef) {
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].compress(coef);
  }
}

_f4u$t.TabGroup.prototype.setX = function(x) {
  this.x = x;
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].x = x;
  }
}

_f4u$t.TabGroup.prototype.setY = function(y) {
  this.y = y;
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].y = y + this.headroom;
  }
}

_f4u$t.TabGroup.prototype.populate_objects = function() {
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].mom = this;
    if ((this.objs[i] instanceof _f4u$t.LayoutManager)
        || (this.objs[i] instanceof _f4u$t.TabGroup)) {
      this.objs[i].populate_objects();
    }
  }
}

_f4u$t.TabGroup.prototype.dims = function() {
  var x = 0;
  var y = 0;
  for (var i = 0; i < this.objs.length; i++) {
    var dim = this.objs[i].dims();
    x = Math.max(x, dim[0]);
    y = Math.max(y, dim[1]);
  }
  return [x, y + this.headroom];
}

_f4u$t.TabGroup.prototype.do_spacing = function(x,y) {
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].x = 0;
    this.objs[i].y = this.headroom;
    this.objs[i].do_spacing(x, y - this.headroom);
  }
}

_f4u$t.TabGroup.prototype.make_label = function(svg, parent, x, y, l, goodid, badidstr) {
  var vl = svg.text(
    parent,
    0,
    0,
    l,
    {
      "text-anchor" : 'middle',
      transform : 'translate('+x+','+y+')',
      onmousedown : '_f4u$t.shuffletabs('+this.x+','+(this.y + this.headroom)+',"'+goodid+'","'+badidstr+'")'
    }
  );
  
  return vl;
}

_f4u$t.TabGroup.prototype.make_tab = function(svg, parent, w, h, x, y, goodid, badidstr, fill) {
  var tab = svg.path(
    parent,
    "M 0 0L"+w+" 0L"+w+" "+h+"L0 "+h+"L0 0",
    {
      transform: 'translate('+x+','+y+')',
      style: 'fill:'+_f4u$t.color_to_rgb(fill)+';stroke:black;',
      onmousedown : '_f4u$t.shuffletabs('+this.x+','+(this.y + this.headroom)+',"'+goodid+'","'+badidstr+'")'
    }
  );
  
  return tab;
}

_f4u$t.TabGroup.prototype.make_tabs = function(svg, parent) {
  // we evenly space buttons across x axis
  var g = svg.group('faust_tabgroup_tabbar_'+this.id, parent);

  var running_count = 0;
  for (var i = 0; i < this.objs.length; i++) {
    var curobj = this.objs[i];
    var badidstr = this.objs.filter(function(obj) {return obj != curobj}).map(function(obj) {return obj.id;}).join('#');
    this.make_tab(
      svg,
      parent,
      this.x_width,
      this.headroom,
      running_count,
      0,
      curobj.id,
      badidstr,
      curobj.fill);
    this.make_label(
      svg,
      parent,
      running_count + this.x_width / 2.0,
      this.headroom / 2.0 + this.baselineSkip,
      curobj.label,
      curobj.id,
      badidstr);
    running_count += this.x_width + this.x_padding;
  }

  return g;
}

_f4u$t.TabGroup.prototype.make = function(svg, parent) {
  var g = this.make_group(svg, parent, this.id);
  this.make_tabs(svg, g);
  for (var i = 0; i < this.objs.length; i++) {
    this.objs[i].make(svg, g);
  }
  // call initiate_tab_group after objects are created
  _f4u$t.initiate_tab_group(this.def, this.objs.map(function(obj) {return obj.id;}).join('#'));

  return g;
}

// rather than extending the jQuery svg object, we just create a wrapper around it
_f4u$t.SVG = function(svg, w, h, options) {
  this.svg = svg;
  this.w = w;
  this.h = h;
  this.constrain = options.constraion || false;
  this.lm = options.lm || null;
  this.title = options.title || 'foo';
  this.lm.mom = this;
}

_f4u$t.extend(_f4u$t.UIObject, _f4u$t.SVG);

_f4u$t.SVG.prototype.get_x_offset = function() {
  return 0;
}

_f4u$t.SVG.prototype.get_y_offset = function() {
  return 0;
}

_f4u$t.SVG.prototype.make = function() {
  if (!this.constrain) {
    var dims = this.lm.dims();
    this.svg.configure(
      {
        // kludge for viewbox...not sure why this extra space is necessary
        //viewBox: '-20 -20 '+(dims[0] + 100)+' '+(dims[1] + 100),
        //viewBox: '-20 -20 '+(dims[0] - 400)+' '+(dims[1] - 400),
        viewBox: '0 0 '+dims[0]+' '+dims[1],
        width : this.w+'px',
        height: this.h+'px'
      },
      true);
  }
  _f4u$t.ROOT = this.title;
  this.lm.populate_objects();
  this.lm.do_spacing(this.w, this.h);
  this.lm.make(this.svg, this.svg);
}

