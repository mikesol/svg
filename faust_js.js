var X_AXIS = 0;
var Y_AXIS = 1;

var _I = 0; // id
var _T = 0; // max graphical value of slider. min always 0
var _P = 0; // percentage of slider bulk of max value
var _MN = 0; // minimum value of slider
var _MX = 0; // maximum value of slider
var _S = 0; // quantization scale of slider
var _A = 0; // axis
var _L = 0;
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

var DEVNULL = -5000;

var prev = new Array();
prev[X_AXIS] = DEVNULL;
prev[Y_AXIS] = DEVNULL;

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

  var slider_token = "faust_slider_sliding_part";
  var rotating_button_token = "faust_rotating_button_sliding_part"
  if (_I.substring(0, slider_token.length) == slider_token) {
    moveActiveSlider(e);
    return 0;
  }
  else if (_I.substring(0, rotating_button_token.length) == rotating_button_token) {
    moveActiveRotatingButton(e);
    return 0;
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
  generic_label_update(unique(_I), aval, 0, _T - (_T * _P));
  var movetothis = arrayToTransform(transform);
  sliding_part.setAttribute("transform", movetothis);
  updateXY(e);
  return true;
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
  generic_label_update(unique(_I), aval, _A0, _A0 + _SW - (_SW * _P));
  var movetothis = arrayToTransform(transform);
  sliding_part.setAttribute("transform", movetothis);
  updateXY(e);
  return true;
}

function generic_label_update(id, c, l, h) {
  var label = document.getElementById("faust_value_"+id);
  var now = remap_and_bound(c, l, h, _MN, _MX);
  label.textContent = now.toFixed(3);
}

// gets rid of the current thing being dragged
function clearIdCache() {
  // we only clear the id and let other variables hold cruft
  // that means that if someone forgets to set a setter, it will
  // point to its old value
  _I = 0;
}

document.onmousemove = moveActiveObject;

function initiate_slide(A, I, T, P, MN, MX, S, L) {
  // in case we haven't initialized things yet
  if (prev[X_AXIS] == DEVNULL) {
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
}

function horizontal_slide(I, T, P, MN, MX, S, L) {
  initiate_slide(X_AXIS, I, T, P, MN, MX, S, L);
}

function vertical_slide(I, T, P, MN, MX, S, L) {
  initiate_slide(Y_AXIS, I, T, P,MN, MX, S, L);
}

function rotate_button(I,A0,SW,P,RX,RY,OX,OY,MN,MX,S, L) {
  if (prev[X_AXIS] == DEVNULL) {
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
}

function button_color_changer(I, F) {
  // for now, this is an easier function because no dragging is involved...
  var button = document.getElementById(I);
  button.style.fill = F;
}

function button_up(I, F) {
  button_color_changer(I, F);
  clearIdCache();
}

function button_down(I, F) {
  clog_key_sink();
  button_color_changer(I, F);
}

function change_checkbox(I) {
  clog_key_sink();
  var box = document.getElementById(I);

  if (box.style.opacity == 1.0) {
    box.style.opacity = 0.0;
  }
  else if (box.style.opacity == 0.0) {
    box.style.opacity = 1.0;
  }
  else {
    alert("malfunctional checkbox");
  }
}

function clog_key_sink() {
  _N = 0;
  _D = 0;
  _B = 0;
}

// if a numerical entry is linked to an incremental object,
// actualize it

function actualize_incremental_object() {

  var slider_id = "faust_slider_sliding_part_"+unique(_N);
  var rotating_button_id = "faust_rotating_button_sliding_part_"+unique(_N);
  var val = parseFloat(_B);
console.log(rotating_button_id);
  var maybe_slider = document.getElementById(slider_id);
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
  console.log(c, _MN, _MX, now);
  console.log(label);
  _B = ""+now;
  label.textContent = _B;
  _D = _B; // prevents bad snaps of values
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

function make_key_sink(I, MN, MX, S, D) {
  _N = 'faust_value_'+I;
  _D = D;
  _MN = MN;
  _MX = MX;
  _S = S;
  _B = "";console.log(_MN, _MX);
}

function generic_slide_key_sink(A, I, T, P, MN, MX, S, D, L) {
  initiate_slide(A, I, T, P, MN, MX, S, L);
  make_key_sink(I, MN, MX, S, D);
  _I = 0;
}

function horizontal_slide_key_sink(I, T, MN, MX, S, D) {
  generic_slide_key_sink(X_AXIS, I, T, MN, MX, S, D);
}

function vertical_slide_key_sink(I, T, MN, MX, S, D) {
  generic_slide_key_sink(Y_AXIS, I, T, MN, MX, S, D);
}

function rotating_button_key_sink(I,A0,SW,P,RX,RY,OX,OY,MN,MX,S,D,L) {
  rotate_button(I,A0,SW,P,RX,RY,OX,OY,MN,MX,S,L);
  make_key_sink(I, MN, MX, S, D);
  _I = 0;
}

function devnull() { }

var mouseUpFunction = devnull;