/*
 * look for the phrase
 * UI2DSP to see where the UI sends messages to DSP
 * obviously, the goal is to separate the two as much as possible
 */

var X_AXIS = 0;
var Y_AXIS = 1;
var NETHERWORLD = -100000;

var _I = 0; // id
var _AD = 0; // address
var _T = 0; // max graphical value of slider. min always 0
var _P = 0; // percentage of slider bulk of max value
var _MN = 0; // minimum value of slider
var _MX = 0; // maximum value of slider
var _S = 0; // quantization scale of slider
var _A = 0; // axis
var _L = 0; // label
// rotating button - document me
var _A0 = 0;
var _SW = 0;
var _RX = 0;
var _RY = 0;
var _OX = 0;
var _OY = 0;
// button - document me
var _F = 0;
// numerical entry
var _N = 0; // id of the key sink
var _D = 0; // default
var _B = 0; // buffer

/*
 *
 *
 * SERVER INTERACTION
 *
 *
 */

var _PATHS_TO_IDS = new Array();

var prev = new Array();
prev[X_AXIS] = NETHERWORLD;
prev[Y_AXIS] = NETHERWORLD;

// basic utilities
function remap(v, mn0, mx0, mn1, mx1) {
  var p = 1.0 * (v - mn0) / (mx0 - mn0);
  return (p * (mx1 - mn1)) + mn1;
}

function bound(v,m,n) {
  var mn = Math.min(m,n);
  var mx = Math.max(m,n);
  if (mn > v) { return mn; }
  if (v > mx) { return mx; }
  return v;
}

function remap_and_bound(v, mn0, mx0, mn1, mx1) {
  return bound(remap(v, mn0, mx0, mn1, mx1), mn1, mx1);
}

function unique(s) {
  var spl = s.split("_");
  return spl[spl.length - 1];
}

// parser of an object's transform

function transformToArray(transform) {
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

function arrayToTransform(array) {
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

function updateXY(e) {
  prev[X_AXIS] = e.clientX;
  prev[Y_AXIS] = e.clientY;
}

// main function to move currently-selected slider
function moveActiveObject(e) {
  if (_I == 0) {
    updateXY(e);
    return true;
  }

  clog_key_sink();

  var hslider_token = "faust_hslider_knob";
  var vslider_token = "faust_vslider_knob";
  var rotating_button_token = "faust_rbutton_knob"
  var now = null;
  if (_I.substring(0, hslider_token.length) == hslider_token) {
    now = moveActiveSlider(e);
  }
  else if (_I.substring(0, vslider_token.length) == vslider_token) {
    now = moveActiveSlider(e);
  }
  else if (_I.substring(0, rotating_button_token.length) == rotating_button_token) {
    now = moveActiveRotatingButton(e);
  }
  
  // UI2DSP
  if (now != null) {
    fausthandler(_AD, now);
  }
  
  // soemthing like a numerical entry...so just return 0
  return 0;
}

function genericMovingPartUpdate(aval, pval, l, h) {
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

function moveActiveSlider(e)
{
  var sliding_part = document.getElementById(_I);
  var pos = -1;
  // we only care about the axis of the slider
  if (_A == X_AXIS) {
    pos = e.clientX;
  }
  else {
    pos = e.clientY;
  }

  var diff = pos - prev[_A];
  var transform = transformToArray(sliding_part.getAttribute("transform"));
  // we assume that there is only one element and that it is a transform
  // make sure to change this if things get more complicated
  // actually, just make sure not to make things more complicated...

  var aval = transform[0][_A + 1] + diff;

  // minimum of the slider is to the bottom / left
  transform[0][_A + 1] = genericMovingPartUpdate(aval, transform[0][_A + 1], 0, _T - (_T * _P));
  var now = generic_label_update(unique(_I), aval, 0, _T - (_T * _P));
  var movetothis = arrayToTransform(transform);
  sliding_part.setAttribute("transform", movetothis);
  updateXY(e);
  return now;
}

function moveActiveRotatingButton(e)
{
  var sliding_part = document.getElementById(_I);

  var diff = 180. * (Math.atan2(e.clientY - _OY - _RY, e.clientX - _OX - _RX) - Math.atan2(prev[Y_AXIS] - _OY - _RY, prev[X_AXIS] - _OX - _RX)) / Math.PI;
  // if diff is to great, the browser is going berzerk...
  if (-180 > diff) {
    diff += 360;
  }
  else if (diff > 180) {
    diff -= 360;
  }

  var transform = transformToArray(sliding_part.getAttribute("transform"));
  // we assume that there is only one element and that it is a transform
  // make sure to change this if things get more complicated
  // actually, just make sure not to make things more complicated...

  var aval = transform[2][1] + diff;

  transform[2][1] = genericMovingPartUpdate(aval, transform[2][1], _A0, _A0 + _SW - (_SW * _P));
  var now = generic_label_update(unique(_I), aval, _A0, _A0 + _SW - (_SW * _P));
  var movetothis = arrayToTransform(transform);
  sliding_part.setAttribute("transform", movetothis);
  updateXY(e);
  return now;
}

function generic_label_update(id, c, l, h) {
  var label = document.getElementById("faust_value_"+id);
  var now = remap_and_bound(c, l, h, _MN, _MX);
  label.textContent = now.toFixed(3);
  return now;
}

function dumb_label_update(id, c) {
  var label = document.getElementById("faust_value_"+id);
  label.textContent = c.toFixed(3);
  return c;
}

// gets rid of the current thing being dragged
function clearIdCache() {
  // we only clear the id and let other variables hold cruft
  // that means that if someone forgets to set a setter, it will
  // point to its old value
  _I = 0;
}

document.onmousemove = moveActiveObject;

function initiate_slide(A, I, T, P, MN, MX, S, L, AD) {
  // in case we haven't initialized things yet
  if (prev[X_AXIS] == NETHERWORLD) {
    updateXY(e);
  }
  _A = A;
  _I = I;
  _T = T;
  _P = P;
  _MN = MN;
  _MX = MX;
  _S = S;
  _L = L;
  _AD = AD;
}

function horizontal_slide(I, T, P, MN, MX, S, L, AD) {
  initiate_slide(X_AXIS, I, T, P, MN, MX, S, L, AD);
}

function vertical_slide(I, T, P, MN, MX, S, L, AD) {
  initiate_slide(Y_AXIS, I, T, P,MN, MX, S, L, AD);
}

function rotate_button(I,A0,SW,P,RX,RY,OX,OY,MN,MX,S,L,AD) {
  if (prev[X_AXIS] == NETHERWORLD) {
    updateXY(e);
  }
  _I = I;
  _A0 = A0;
  _SW = SW;
  _P = P;
  _L = L;
  _MN = MN;
  _MX = MX;
  _RX = RX;
  _RY = RY;
  _OX = OX;
  _OY = OY;
  _S = S;
  _AD = AD;
}

function button_color_changer(I, F) {
  // for now, this is an easier function because no dragging is involved...
  var button = document.getElementById(I);
  button.style.fill = F;
}

function button_up(I, F, AD) {
  button_color_changer(I, F);
  clearIdCache();
}

function button_down(I, F, AD) {
  clog_key_sink();
  button_color_changer(I, F);
  // UI2DSP
  fausthandler(AD, 1);
}

function change_checkbox(I, AD) {
  clog_key_sink();
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
  fausthandler(AD, opacity);
}

function clog_key_sink() {
  _N = 0;
  _D = 0;
  _B = 0;
}

// if a numerical entry is linked to an incremental object,
// actualize it

function actualize_incremental_object() {

  var hslider_id = "faust_hslider_knob_"+unique(_N);
  var vslider_id = "faust_vslider_knob_"+unique(_N);
  var rotating_button_id = "faust_rbutton_knob_"+unique(_N);
  var val = parseFloat(_B);
  var maybe_slider = document.getElementById(hslider_id);
  if (maybe_slider == null) {
    maybe_slider = document.getElementById(vslider_id);
  }
  var maybe_button = document.getElementById(rotating_button_id);
  if (maybe_slider != null) {
    // ugh...code dups
    val = remap(val, _MN, _MX, 0, _T - (_T * _P));
    var transform = transformToArray(maybe_slider.getAttribute("transform"));
    transform[0][_A + 1] = val;
    var movetothis = arrayToTransform(transform);
    maybe_slider.setAttribute("transform", movetothis);
    return 0;
  }
  else if (maybe_button != null) {
    val = remap(val, _MN, _MX, _A0, _A0 + _SW - (_SW * _P));
    var transform = transformToArray(maybe_button.getAttribute("transform"));
    transform[2][1] = val;
    var movetothis = arrayToTransform(transform);
    maybe_button.setAttribute("transform", movetothis);
    return 0;
  }
  // no corresponding incremental object
  return 0;
}

function actualize_buffer() {
  // get a valid number in there...
  if (isNaN(_B)) {
    _B = ""+_D;
  }  
  var c = parseFloat(_B);
  var label = document.getElementById(_N);
  var now = bound(c, _MN, _MX);
  _B = ""+now;
  label.textContent = _B;
  _D = _B; // prevents bad snaps of values

  // UI2DSP
  fausthandler(_AD, now);

  actualize_incremental_object();
}

function buffer_backspace() {
  if (_B.length == 0) {
    return 0;
  }
  _B = _B.substring(0, _B.length - 1);
  var label = document.getElementById(_N);
  label.textContent = _B;
}

function make_delete_key_work(e) {
  if (e.keyCode == 8) {
    buffer_backspace();
  }
}

function keys_to_sink(e) {
  if (_N == 0) {
    return 0;
  }
  if (e.keyCode == 13) {
    actualize_buffer();
  }
  else {
    var key = e.keyCode;
    var str = String.fromCharCode(key)
    _B += str;
  }
  var label = document.getElementById(_N);
  label.textContent = _B;
}

document.onkeypress = keys_to_sink;
document.onkeydown = make_delete_key_work;
document.onmouseup = clearIdCache;

function make_key_sink(I, MN, MX, S, D, AD) {
  _N = 'faust_value_'+I;
  _D = D;
  _MN = MN;
  _MX = MX;
  _S = S;
  _B = "";console.log(_MN, _MX);
  _AD = AD
}

function generic_slide_key_sink(A, I, T, P, MN, MX, S, D, L, AD) {
  initiate_slide(A, I, T, P, MN, MX, S, L, AD);
  make_key_sink(I, MN, MX, S, D, AD);
  _I = 0;
}

function horizontal_slide_key_sink(I, T, MN, MX, S, D, AD) {
  generic_slide_key_sink(X_AXIS, I, T, MN, MX, S, D, AD);
}

function vertical_slide_key_sink(I, T, MN, MX, S, D, AD) {
  generic_slide_key_sink(Y_AXIS, I, T, MN, MX, S, D, AD);
}

function rotating_button_key_sink(I,A0,SW,P,RX,RY,OX,OY,MN,MX,S,D,L,AD) {
  rotate_button(I,A0,SW,P,RX,RY,OX,OY,MN,MX,S,L,AD);
  make_key_sink(I, MN, MX, S, D, AD);
  _I = 0;
}

function move_to_ridiculous_negative(id) {
  generic_translate(id, NETHERWORLD, NETHERWORLD);
}

function generic_translate(id, x, y) {
  var elt = document.getElementById(id);
  var transform = transformToArray(elt.getAttribute("transform"));
  // we assume that there is only one element and that it is a transform
  // make sure to change this if things get more complicated
  // actually, just make sure not to make things more complicated...

  transform[0][1] = x;
  transform[0][2] = y;
  var movetothis = arrayToTransform(transform);
  elt.setAttribute("transform", movetothis);  
}

function cache_tab_group(index, id, ids) {
  var strar = ids.split('#');
  // boo svg...tags
  for (var i = 0; strar.length > i; i++) {
    if (i != index) {
      move_to_ridiculous_negative(strar[i]);
    }
  }
}

function shuffletabs(goodid, badids, x, y) {
  var strar = badids.split('#');
  for (var i = 0; strar.length > i; i++) {
    move_to_ridiculous_negative(strar[i]);
  }
  console.log(goodid);
  generic_translate(goodid, x, y);
}

function path_to_id(path, id) {
  _PATHS_TO_IDS[path] = id;
}

function devnull() { }

var mouseUpFunction = devnull;