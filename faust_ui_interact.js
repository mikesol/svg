/*
 * look for the phrase
 * UI2DSP to see where the UI sends messages to DSP
 * obviously, the goal is to separate the two as much as possible
 */

_FAUST_NAMESPACE["NETHERWORLD"] = -100000;

_FAUST_NAMESPACE["_I"] = 0; // id
_FAUST_NAMESPACE["_N"] = 0; // id of the key sink

/*
 * SERVER INTERACTION
 */

_FAUST_NAMESPACE["PATHS_TO_IDS"] = new Array();

/*
 * OBJECT ORIENTED PROGRAMMING
 * Rather than using lots of global variables (clutters namespace)
 * or using this.attribute (dangerous depending on browser and libraries),
 * we use _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"] to hold all information for faust UI objects.
 * That way, the impact on the namespace of the global session as well
 * as the objects is minimal.
 */

_FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"] = new Array();

_FAUST_NAMESPACE["PREV"] = new Array();
_FAUST_NAMESPACE["PREV"][_FAUST_NAMESPACE["X_AXIS"]] = _FAUST_NAMESPACE["NETHERWORLD"];
_FAUST_NAMESPACE["PREV"][_FAUST_NAMESPACE["Y_AXIS"]] = _FAUST_NAMESPACE["NETHERWORLD"];

// basic utilities
_FAUST_NAMESPACE["remap"] = function(v, mn0, mx0, mn1, mx1) {
  var p = 1.0 * (v - mn0) / (mx0 - mn0);
  return (p * (mx1 - mn1)) + mn1;
}

_FAUST_NAMESPACE["bound"] = function(v,m,n) {
  var mn = Math.min(m,n);
  var mx = Math.max(m,n);
  if (mn > v) { return mn; }
  if (v > mx) { return mx; }
  return v;
}

_FAUST_NAMESPACE["remap_and_bound"] = function(v, mn0, mx0, mn1, mx1) {
  return bound(_FAUST_NAMESPACE["remap"](v, mn0, mx0, mn1, mx1), mn1, mx1);
}

_FAUST_NAMESPACE["unique"] = function(s) {
  var spl = s.split("_");
  if (spl.length == 0) {
    return s;
  }
  return spl[spl.length - 1];
}

// parser of an object's transform

_FAUST_NAMESPACE["transformToArray"] = function(transform) {
  var out = [];
  var flre = "[-+]?[0-9]*\\.?[0-9]*(?:[eE][-+]?[0-9]+)?";
  var matrix = new RegExp("^\\s*matrix\\s*\\(\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*\\)");
  var translate = new RegExp("^\\s*translate\\s*\\(\\s*("+flre+")\\s*(?:[,]\\s*("+flre+")\\s*)?\\)");
  var scale = new RegExp("^\\s*scale\\s*\\(\\s*("+flre+")\\s*(?:[,]\\s*("+flre+")\\s*)?\\)");
  var rotate = new RegExp("^\\s*rotate\\s*\\(\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*\\)");
  var skewX = new RegExp("^\\s*skewX\\s*\\(\\s*("+flre+")\\s*\\)");
  var skewY = new RegExp("^\\s*skewY\\s*\\(\\s*("+flre+")\\s*\\)");
  while(true) {
    var match = matrix.exec(transform);
    if (match != null) { 
      out.push(["matrix",parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4]), parseFloat(match[5]), parseFloat(match[6])]);
      transform = transform.substr(match[0].length,transform.length-match[0].length);
      continue;
    }
    match = translate.exec(transform);
    if (match != null) { 
      var second = 0.0;
      if (match[2] != undefined) { second = parseFloat(match[2]); }
      out.push(["translate",parseFloat(match[1]),second]);
      transform = transform.substr(match[0].length,transform.length-match[0].length);
      continue;
    }
    match = scale.exec(transform);
    if (match != null) { 
      var second = 0.0;
      if (match[2] != undefined) { second = parseFloat(match[2]); }
      out.push(["scale",parseFloat(match[1]), second]);
      transform = transform.substr(match[0].length,transform.length-match[0].length);
      continue;
    }
    match = rotate.exec(transform);
    if (match != null) { 
      var second = 0.0;
      if (match[2] != undefined) { second = parseFloat(match[2]); }
      var third = 0.0;
      if (match[2] != undefined) { third = parseFloat(match[2]); }
      out.push(["rotate",parseFloat(match[1]), second, third]);
      transform = transform.substr(match[0].length,transform.length-match[0].length);
      continue;
    }
    match = skewX.exec(transform);
    if (match != null) { 
      out.push(["skewX", parseFloat(match[1])]);
      transform = transform.substr(match[0].length,transform.length-match[0].length);
      continue;
    }
    match = skewY.exec(transform);
    if (match != null) { 
      out.push(["skewY", parseFloat(match[1])]);
      transform = transform.substr(match[0].length,transform.length-match[0].length);
      continue;
    }
    break;
  }
  return out;
}

// takes an array, turns it to a transform

_FAUST_NAMESPACE["arrayToTransform"] = function(array) {
  var out = "";
  while (array.length > 0)
  {
    out = out.concat(array[0][0]);
    out = out.concat("(");
    var i=1;
    var arlen = array[0].length;
    while(arlen > i) {
      out = out.concat(array[0][i]+",");
      i++;
    }
    out = out.substr(0,out.length-1);
    out = out.concat(") ");
    array.shift();
  }
  if (out.length > 0) { out = out.substr(0,out.length-1); }
  return out;
}

_FAUST_NAMESPACE["updateXY"] = function(e) {
  _FAUST_NAMESPACE["PREV"][_FAUST_NAMESPACE["X_AXIS"]] = e.clientX;
  _FAUST_NAMESPACE["PREV"][_FAUST_NAMESPACE["Y_AXIS"]] = e.clientY;
}

// main _FAUST_NAMESPACE[""] = function to move currently-selected slider
_FAUST_NAMESPACE["moveActiveObject"] = function(e) {
  if (_FAUST_NAMESPACE["_I"] == 0) {
    _FAUST_NAMESPACE["updateXY"](e);
    return true;
  }

  _FAUST_NAMESPACE["clog_key_sink"]();

  var hslider_token = "faust_hslider_knob";
  var vslider_token = "faust_vslider_knob";
  var rotating_button_token = "faust_rbutton_knob"
  var now = null;
  if (_FAUST_NAMESPACE["_I"].substring(0, hslider_token.length) == hslider_token) {
    now = _FAUST_NAMESPACE["moveActiveSlider"](e);
  }
  else if (_FAUST_NAMESPACE["_I"].substring(0, vslider_token.length) == vslider_token) {
    now = _FAUST_NAMESPACE["moveActiveSlider"](e);
  }
  else if (_FAUST_NAMESPACE["_I"].substring(0, rotating_button_token.length) == rotating_button_token) {
    now = _FAUST_NAMESPACE["moveActiveRotatingButton"](e);
  }
  
  // UI2DSP
  if (now != null) {
    var id = _FAUST_NAMESPACE["unique"](_FAUST_NAMESPACE["_I"]);
    _FAUST_NAMESPACE["fausthandler"](_FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["AD"], now);
  }
  
  // soemthing like a numerical entry...so just return 0
  return 0;
}

_FAUST_NAMESPACE["genericMovingPartUpdate"] = function(aval, pval, l, h) {
  if (l > aval) {
    if (pval != h) {
      return l;
    }
  }

  else if (aval > h) {
    if (pval != l) {
      return h;
    }
  }

  // if neither of the above are true, free to move by the difference
  else {
    return aval;
  }

  // corner case - we avoid large leaps
  return pval;
}

_FAUST_NAMESPACE["moveActiveSlider"] = function(e)
{
  var sliding_part = document.getElementById(_FAUST_NAMESPACE["_I"]);
  var id = _FAUST_NAMESPACE["unique"](_FAUST_NAMESPACE["_I"]);
  var A = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["A"];
  var P = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["P"];
  var T = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["T"];
  var pos = -1;
  // we only care about the axis of the slider
  if (A == _FAUST_NAMESPACE["X_AXIS"]) {
    pos = e.clientX;
  }
  else {
    pos = e.clientY;
  }

  var diff = pos - _FAUST_NAMESPACE["PREV"][A];
  var transform = _FAUST_NAMESPACE["transformToArray"](sliding_part.getAttribute("transform"));
  // we assume that there is only one element and that it is a transform
  // make sure to change this if things get more complicated
  // actually, just make sure not to make things more complicated...

  var aval = transform[0][A + 1] + diff;

  // minimum of the slider is to the bottom / left
  transform[0][A + 1] = _FAUST_NAMESPACE["genericMovingPartUpdate"](aval, transform[0][A + 1], 0, T - (T * P));
  var now = _FAUST_NAMESPACE["generic_label_update"](id, aval, 0, T - (T * P));
  var movetothis = _FAUST_NAMESPACE["arrayToTransform"](transform);
  sliding_part.setAttribute("transform", movetothis);
  _FAUST_NAMESPACE["updateXY"](e);
  return now;
}

_FAUST_NAMESPACE["moveActiveRotatingButton"] = function(e)
{
  var sliding_part = document.getElementById(_FAUST_NAMESPACE["_I"]);
  var id = _FAUST_NAMESPACE["unique"](_FAUST_NAMESPACE["_I"]);
  var OX = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["OX"];
  var OY = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["OY"];
  var RX = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["RX"];
  var RY = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["RY"];
  var A0 = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["A0"];
  var SW = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["SW"];
  var P = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["P"];

  var diff = 180. * (Math.atan2(e.clientY - OY - RY, e.clientX - OX - RX) - Math.atan2(_FAUST_NAMESPACE["PREV"][_FAUST_NAMESPACE["Y_AXIS"]] - OY - RY, _FAUST_NAMESPACE["PREV"][_FAUST_NAMESPACE["X_AXIS"]] - OX - RX)) / Math.PI;
  // if diff is to great, the browser is going berzerk...
  if (-180 > diff) {
    diff += 360;
  }
  else if (diff > 180) {
    diff -= 360;
  }

  var transform = _FAUST_NAMESPACE["transformToArray"](sliding_part.getAttribute("transform"));
  // we assume that there is only one element and that it is a transform
  // make sure to change this if things get more complicated
  // actually, just make sure not to make things more complicated...

  var aval = transform[2][1] + diff;

  transform[2][1] = _FAUST_NAMESPACE["genericMovingPartUpdate"](aval, transform[2][1], A0, A0 + SW - (SW * P));
  var now = _FAUST_NAMESPACE["generic_label_update"](_FAUST_NAMESPACE["unique"](_FAUST_NAMESPACE["_I"]), aval, A0, A0 + SW - (SW * P));
  var movetothis = _FAUST_NAMESPACE["arrayToTransform"](transform);
  sliding_part.setAttribute("transform", movetothis);
  _FAUST_NAMESPACE["updateXY"](e);
  return now;
}

_FAUST_NAMESPACE["generic_label_update"] = function(id, c, l, h) {
  var now = _FAUST_NAMESPACE["remap_and_bound"](c, l, h, _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MN"], _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MX"]);
  return _FAUST_NAMESPACE["dumb_label_update"](id, now);
}

_FAUST_NAMESPACE["dumb_label_update"] = function(id, c) {
  var label = document.getElementById("faust_value_value_"+id);
  label.textContent = c.toFixed(3);
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"] = c;
  return c;
}

// gets rid of the current thing being dragged
_FAUST_NAMESPACE["clearIdCache"] = function() {
  // we only clear the id and let other variables hold cruft
  // that means that if someone forgets to set a setter, it will
  // point to its old value
  _FAUST_NAMESPACE["_I"] = 0;
}

_FAUST_NAMESPACE["initiate_slider"] = function(A, I, T, P, MN, MX, S, L, AD) {
  // in case we haven't initialized things yet
  /*
  if (_FAUST_NAMESPACE["PREV"][_FAUST_NAMESPACE["X_AXIS"]] == _FAUST_NAMESPACE["NETHERWORLD"]) {
    _FAUST_NAMESPACE["updateXY"](e);
  }
  */
  var id = _FAUST_NAMESPACE["unique"](I);
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id] = new Array();
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["I"] = I;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["A"] = A;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["T"] = T;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["P"] = P;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MN"] = MN;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MX"] = MX;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["S"] = S;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["L"] = L;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["AD"] = AD;
  _FAUST_NAMESPACE["path_to_id"](AD, I);
}

_FAUST_NAMESPACE["initiate_nentry"] = function(I, MN, MX, S, D, L, AD) {
  // in case we haven't initialized things yet
  /*
  if (_FAUST_NAMESPACE["PREV"][_FAUST_NAMESPACE["X_AXIS"]] == _FAUST_NAMESPACE["NETHERWORLD"]) {
    _FAUST_NAMESPACE["updateXY"](e);
  }
  */
  var id = _FAUST_NAMESPACE["unique"](I);
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id] = new Array();
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["I"] = I;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MN"] = MN;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MX"] = MX;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["S"] = S;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"] = D;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["L"] = L;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["AD"] = AD;
  _FAUST_NAMESPACE["path_to_id"](AD, I);
}

_FAUST_NAMESPACE["initiate_hslider"] = function(I, T, P, MN, MX, S, L, AD) {
  _FAUST_NAMESPACE["initiate_slider"](_FAUST_NAMESPACE["X_AXIS"], I, T, P, MN, MX, S, L, AD);
}

_FAUST_NAMESPACE["initiate_vslider"] = function(I, T, P, MN, MX, S, L, AD) {
  _FAUST_NAMESPACE["initiate_slider"](_FAUST_NAMESPACE["Y_AXIS"], I, T, P,MN, MX, S, L, AD);
}

_FAUST_NAMESPACE["activate_slider"] = function(I) {
  // in case we haven't initialized things yet
  /*
  if (_FAUST_NAMESPACE["PREV"][_FAUST_NAMESPACE["X_AXIS"]] == _FAUST_NAMESPACE["NETHERWORLD"]) {
    _FAUST_NAMESPACE["updateXY"](e);
  }
  */
  _FAUST_NAMESPACE["_I"] = I;
  
}

_FAUST_NAMESPACE["activate_nentry"] = function(I,dir) {
  // in case we haven't initialized things yet
  /*
  if (_FAUST_NAMESPACE["PREV"][_FAUST_NAMESPACE["X_AXIS"]] == _FAUST_NAMESPACE["NETHERWORLD"]) {
    _FAUST_NAMESPACE["updateXY"](e);
  }
  */
  _FAUST_NAMESPACE["_I"] = I;
  var id = _FAUST_NAMESPACE["unique"](_FAUST_NAMESPACE["_I"]);

  var now = parseFloat(_FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"]);
  if (dir == 1) {
    now += _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["S"];
  }
  else {
    now -= _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["S"];
  }
  
  now = bound(now, _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MN"], _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MX"]);
  now = _FAUST_NAMESPACE["dumb_label_update"](_FAUST_NAMESPACE["unique"](_FAUST_NAMESPACE["_I"]), now);
  return now;
}

_FAUST_NAMESPACE["activate_hslider"] = function(I) {
  _FAUST_NAMESPACE["activate_slider"](I);
}

_FAUST_NAMESPACE["activate_vslider"] = function(I) {
  _FAUST_NAMESPACE["activate_slider"](I);
}

_FAUST_NAMESPACE["initiate_rbutton"] = function(I,A0,SW,P,RX,RY,OX,OY,MN,MX,S,L,AD) {
  /*
  if (_FAUST_NAMESPACE["PREV"][_FAUST_NAMESPACE["X_AXIS"]] == _FAUST_NAMESPACE["NETHERWORLD"]) {
    _FAUST_NAMESPACE["updateXY"](e);
  }
  */
  var id = _FAUST_NAMESPACE["unique"](I);
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id] = new Array();
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["I"] = I;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["A0"] = A0;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["SW"] = SW;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["P"] = P;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["L"] = L;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MN"] = MN;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MX"] = MX;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["RX"] = RX;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["RY"] = RY;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["OX"] = OX;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["OY"] = OY;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["S"] = S;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["AD"] = AD;
  _FAUST_NAMESPACE["path_to_id"](AD, I);
}

_FAUST_NAMESPACE["activate_rbutton"] = function(I) {
  _FAUST_NAMESPACE["_I"] = I;
}

_FAUST_NAMESPACE["button_color_changer"] = function(I, F) {
  // for now, this is an easier _FAUST_NAMESPACE[""] = function because no dragging is involved...
  var button = document.getElementById('faust_button_box_'+_FAUST_NAMESPACE["unique"](I));
  button.style.fill = F;
}

_FAUST_NAMESPACE["button_up"] = function(I) {
  _FAUST_NAMESPACE["button_color_changer"](I, _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][_FAUST_NAMESPACE["unique"](I)]["UF"]);
  _FAUST_NAMESPACE["fausthandler"](_FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][_FAUST_NAMESPACE["unique"](I)]["AD"], 0);
  _FAUST_NAMESPACE["clearIdCache"]();
}

_FAUST_NAMESPACE["button_down"] = function(I) {
  _FAUST_NAMESPACE["clog_key_sink"]();
  _FAUST_NAMESPACE["button_color_changer"](I, _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][_FAUST_NAMESPACE["unique"](I)]["DF"]);
  // UI2DSP
  _FAUST_NAMESPACE["fausthandler"](_FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][_FAUST_NAMESPACE["unique"](I)]["AD"], 1);
}

_FAUST_NAMESPACE["initiate_button"] = function(I, UF, DF, AD) {
  var id = _FAUST_NAMESPACE["unique"](I);
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id] = new Array();
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["I"] = I;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["UF"] = UF;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["DF"] = DF;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["AD"] = AD;
  _FAUST_NAMESPACE["path_to_id"](AD, I);
}

_FAUST_NAMESPACE["change_checkbox"] = function(I) {
  _FAUST_NAMESPACE["clog_key_sink"]();
  var AD = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][_FAUST_NAMESPACE["unique"](I)]["AD"];
  var box = document.getElementById(I);
  var opacity = 0;
  if (box.style.opacity == 1.0) {
    opacity = 0;
  }
  else if (box.style.opacity == 0.0) {
    opacity = 1;
  }
  else {
    alert("malfunctional checkbox");
  }
  box.style.opacity = opacity;
  // UI2DSP
  _FAUST_NAMESPACE["fausthandler"](AD, opacity);
}

_FAUST_NAMESPACE["initiate_checkbox"] = function(I, AD) {
  var id = _FAUST_NAMESPACE["unique"](I);
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id] = new Array();
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["I"] = I;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["AD"] = AD;
  _FAUST_NAMESPACE["path_to_id"](AD, I);
}

_FAUST_NAMESPACE["clog_key_sink"] = function() {
  if (_FAUST_NAMESPACE["_N"] != 0) {
    var box = document.getElementById("faust_value_box_"+_FAUST_NAMESPACE["unique"](_FAUST_NAMESPACE["_N"]));
    box.style.stroke = "black";
  }
  _FAUST_NAMESPACE["_N"] = 0;  
}

// if a numerical entry is linked to an incremental object,
// actualize it

_FAUST_NAMESPACE["actualize_incremental_object"] = function(id) {
  var hslider_id = "faust_hslider_knob_"+id;
  var vslider_id = "faust_vslider_knob_"+id;
  var rotating_button_id = "faust_rbutton_knob_"+id;
  var val = parseFloat(_FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"]);
  var maybe_slider = document.getElementById(hslider_id);
  if (maybe_slider == null) {
    maybe_slider = document.getElementById(vslider_id);
  }
  var maybe_button = document.getElementById(rotating_button_id);
  if (maybe_slider != null) {
    // ugh...code dups
    var MN = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MN"];
    var MX = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MX"];
    var T = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["T"];
    var P = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["P"];
    var A = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["A"];
    val = _FAUST_NAMESPACE["remap"](val, MN, MX, 0, T - (T * P));
    var transform = _FAUST_NAMESPACE["transformToArray"](maybe_slider.getAttribute("transform"));
    transform[0][A + 1] = val;
    var movetothis = _FAUST_NAMESPACE["arrayToTransform"](transform);
    maybe_slider.setAttribute("transform", movetothis);
    return 0;
  }
  else if (maybe_button != null) {
    var MN = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MN"];
    var MX = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MX"];
    var A0 = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["A0"];
    var P = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["P"];
    var SW = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["SW"];
    val = _FAUST_NAMESPACE["remap"](val, MN, MX, A0, A0 + SW - (SW * P));
    var transform = _FAUST_NAMESPACE["transformToArray"](maybe_button.getAttribute("transform"));
    transform[2][1] = val;
    var movetothis = _FAUST_NAMESPACE["arrayToTransform"](transform);
    maybe_button.setAttribute("transform", movetothis);
    return 0;
  }
  // no corresponding incremental object
  return 0;
}

_FAUST_NAMESPACE["actualize_buffer"] = function() {
  // get a valid number in there...
  var id = _FAUST_NAMESPACE["unique"](_FAUST_NAMESPACE["_N"]);

  var MN = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MN"];
  var MX = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["MX"];
  var AD = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["AD"];

  if (isNaN(_FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"])) {
    _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"] = ""+_FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["D"];
  }
  var c = parseFloat(_FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"]);
  var label = document.getElementById(_FAUST_NAMESPACE["_N"]);
  var now = bound(c, MN, MX);
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"] = ""+now;
  label.textContent = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"];
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["D"] = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"]; // prevents bad snaps of values

  // UI2DSP
  _FAUST_NAMESPACE["fausthandler"](AD, now);

  _FAUST_NAMESPACE["actualize_incremental_object"](id);
}

_FAUST_NAMESPACE["buffer_backspace"] = function() {
  var id = _FAUST_NAMESPACE["unique"](_FAUST_NAMESPACE["_N"]);
  if (_FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"].length == 0) {
    return 0;
  }
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"] = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"].substring(0, _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"].length - 1);
  var label = document.getElementById(_FAUST_NAMESPACE["_N"]);
  label.textContent = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"];
}

_FAUST_NAMESPACE["make_delete_key_work"] = function(e) {
  if (e.keyCode == 8) {
    _FAUST_NAMESPACE["buffer_backspace"]();
  }
}

_FAUST_NAMESPACE["keys_to_sink"] = function(e) {
  if (_FAUST_NAMESPACE["_N"] == 0) {
    return 0;
  }
  var id = _FAUST_NAMESPACE["unique"](_FAUST_NAMESPACE["_N"]);
  if (e.keyCode == 13) {
    _FAUST_NAMESPACE["actualize_buffer"]();
  }
  else {
    var key = e.keyCode;
    var str = String.fromCharCode(key)
    _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"] += str;
  }
  var label = document.getElementById(_FAUST_NAMESPACE["_N"]);
  label.textContent = _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][id]["B"];
}

_FAUST_NAMESPACE["make_key_sink"] = function(I) {
  _FAUST_NAMESPACE["_N"] = 'faust_value_value_'+I;
  _FAUST_NAMESPACE["IDS_TO_ATTRIBUTES"][I]["B"] = "";
  var box = document.getElementById("faust_value_box_"+I);
  box.style.stroke = "red";
}

_FAUST_NAMESPACE["generic_key_sink"] = function(I) {
  var id = _FAUST_NAMESPACE["unique"](I);
  _FAUST_NAMESPACE["make_key_sink"](id);
  _FAUST_NAMESPACE["_I"] = 0;
}

_FAUST_NAMESPACE["hslider_key_sink"] = function(I) {
  _FAUST_NAMESPACE["generic_key_sink"](I);
}

_FAUST_NAMESPACE["vslider_key_sink"] = function(I) {
  _FAUST_NAMESPACE["generic_key_sink"](I);
}

_FAUST_NAMESPACE["rotating_button_key_sink"] = function(I) {
  _FAUST_NAMESPACE["generic_key_sink"](I);
}

_FAUST_NAMESPACE["move_to_ridiculous_negative"] = function(id) {
  _FAUST_NAMESPACE["generic_translate"](id, _FAUST_NAMESPACE["NETHERWORLD"], _FAUST_NAMESPACE["NETHERWORLD"]);
}

_FAUST_NAMESPACE["generic_translate"] = function(id, x, y) {
  var elt = document.getElementById(id);
  var transform = _FAUST_NAMESPACE["transformToArray"](elt.getAttribute("transform"));
  // we assume that there is only one element and that it is a transform
  // make sure to change this if things get more complicated
  // actually, just make sure not to make things more complicated...

  transform[0][1] = x;
  transform[0][2] = y;
  var movetothis = _FAUST_NAMESPACE["arrayToTransform"](transform);
  elt.setAttribute("transform", movetothis);  
}

_FAUST_NAMESPACE["cache_tab_group"] = function(index, id, ids) {
  var strar = ids.split('#');
  // boo svg...tags
  for (var i = 0; strar.length > i; i++) {
    if (i != index) {
      _FAUST_NAMESPACE["move_to_ridiculous_negative"](strar[i]);
    }
  }
}

_FAUST_NAMESPACE["shuffletabs"] = function(goodid, badids, x, y) {
  var strar = badids.split('#');
  for (var i = 0; strar.length > i; i++) {
    _FAUST_NAMESPACE["move_to_ridiculous_negative"](strar[i]);
  }
  _FAUST_NAMESPACE["generic_translate"](goodid, x, y);
}

_FAUST_NAMESPACE["path_to_id"] = function (path, id) {
  _FAUST_NAMESPACE["PATHS_TO_IDS"][path] = id;
}

_FAUST_NAMESPACE["devnull"] = function devnull() { }

document.onkeypress = _FAUST_NAMESPACE["keys_to_sink"];
document.onkeydown = _FAUST_NAMESPACE["make_delete_key_work"];
document.onmouseup = _FAUST_NAMESPACE["clearIdCache"];
document.onmousemove = _FAUST_NAMESPACE["moveActiveObject"];
