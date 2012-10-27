/*
 * look for the phrase
 * UI2DSP to see where the UI sends messages to DSP
 * obviously, the goal is to separate the two as much as possible
 */

var _X_AXIS = 0;
var _Y_AXIS = 1;
var _NETHERWORLD = -100000;

var _I = 0; // id
var _N = 0; // id of the key sink

/*
 * SERVER INTERACTION
 */

var _PATHS_TO_IDS = new Array();

/*
 * OBJECT ORIENTED PROGRAMMING
 * Rather than using lots of global variables (clutters namespace)
 * or using this.attribute (dangerous depending on browser and libraries),
 * we use _IDS_TO_ATTRIBUTES to hold all information for faust UI objects.
 * That way, the impact on the namespace of the global session as well
 * as the objects is minimal.
 */

var _IDS_TO_ATTRIBUTES = new Array();

var _PREV = new Array();
_PREV[_X_AXIS] = _NETHERWORLD;
_PREV[_Y_AXIS] = _NETHERWORLD;

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
  if (spl.length == 0) {
    return s;
  }
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
  _PREV[_X_AXIS] = e.clientX;
  _PREV[_Y_AXIS] = e.clientY;
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
    var id = unique(_I);
    fausthandler(_IDS_TO_ATTRIBUTES[id]["AD"], now);
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
  var id = unique(_I);
  var A = _IDS_TO_ATTRIBUTES[id]["A"];
  var P = _IDS_TO_ATTRIBUTES[id]["P"];
  var T = _IDS_TO_ATTRIBUTES[id]["T"];
  var pos = -1;
  // we only care about the axis of the slider
  if (A == _X_AXIS) {
    pos = e.clientX;
  }
  else {
    pos = e.clientY;
  }

  var diff = pos - _PREV[A];
  var transform = transformToArray(sliding_part.getAttribute("transform"));
  // we assume that there is only one element and that it is a transform
  // make sure to change this if things get more complicated
  // actually, just make sure not to make things more complicated...

  var aval = transform[0][A + 1] + diff;

  // minimum of the slider is to the bottom / left
  transform[0][A + 1] = genericMovingPartUpdate(aval, transform[0][A + 1], 0, T - (T * P));
  var now = generic_label_update(id, aval, 0, T - (T * P));
  var movetothis = arrayToTransform(transform);
  sliding_part.setAttribute("transform", movetothis);
  updateXY(e);
  return now;
}

function moveActiveRotatingButton(e)
{
  var sliding_part = document.getElementById(_I);
  var id = unique(_I);
  var OX = _IDS_TO_ATTRIBUTES[id]["OX"];
  var OY = _IDS_TO_ATTRIBUTES[id]["OY"];
  var RX = _IDS_TO_ATTRIBUTES[id]["RX"];
  var RY = _IDS_TO_ATTRIBUTES[id]["RY"];
  var A0 = _IDS_TO_ATTRIBUTES[id]["A0"];
  var SW = _IDS_TO_ATTRIBUTES[id]["SW"];
  var P = _IDS_TO_ATTRIBUTES[id]["P"];

  var diff = 180. * (Math.atan2(e.clientY - OY - RY, e.clientX - OX - RX) - Math.atan2(_PREV[_Y_AXIS] - OY - RY, _PREV[_X_AXIS] - OX - RX)) / Math.PI;
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

  transform[2][1] = genericMovingPartUpdate(aval, transform[2][1], A0, A0 + SW - (SW * P));
  var now = generic_label_update(unique(_I), aval, A0, A0 + SW - (SW * P));
  var movetothis = arrayToTransform(transform);
  sliding_part.setAttribute("transform", movetothis);
  updateXY(e);
  return now;
}

function generic_label_update(id, c, l, h) {
  var now = remap_and_bound(c, l, h, _IDS_TO_ATTRIBUTES[id]["MN"], _IDS_TO_ATTRIBUTES[id]["MX"]);
  return dumb_label_update(id, now);
}

function dumb_label_update(id, c) {
  var label = document.getElementById("faust_value_"+id);
  label.textContent = c.toFixed(3);
  _IDS_TO_ATTRIBUTES[id]["B"] = c;
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

function initiate_slider(A, I, T, P, MN, MX, S, L, AD) {
  // in case we haven't initialized things yet
  /*
  if (_PREV[_X_AXIS] == _NETHERWORLD) {
    updateXY(e);
  }
  */
  var id = unique(I);
  _IDS_TO_ATTRIBUTES[id] = new Array();
  _IDS_TO_ATTRIBUTES[id]["I"] = I;
  _IDS_TO_ATTRIBUTES[id]["A"] = A;
  _IDS_TO_ATTRIBUTES[id]["T"] = T;
  _IDS_TO_ATTRIBUTES[id]["P"] = P;
  _IDS_TO_ATTRIBUTES[id]["MN"] = MN;
  _IDS_TO_ATTRIBUTES[id]["MX"] = MX;
  _IDS_TO_ATTRIBUTES[id]["S"] = S;
  _IDS_TO_ATTRIBUTES[id]["L"] = L;
  _IDS_TO_ATTRIBUTES[id]["AD"] = AD;
  path_to_id(AD, I);
}

function initiate_hslider(I, T, P, MN, MX, S, L, AD) {
  initiate_slider(_X_AXIS, I, T, P, MN, MX, S, L, AD);
}

function initiate_vslider(I, T, P, MN, MX, S, L, AD) {
  initiate_slider(_Y_AXIS, I, T, P,MN, MX, S, L, AD);
}

function activate_slider(I) {
  // in case we haven't initialized things yet
  /*
  if (_PREV[_X_AXIS] == _NETHERWORLD) {
    updateXY(e);
  }
  */
  _I = I;
}

function activate_hslider(I) {
  activate_slider(I);
}

function activate_vslider(I) {
  activate_slider(I);
}

function initiate_rbutton(I,A0,SW,P,RX,RY,OX,OY,MN,MX,S,L,AD) {
  /*
  if (_PREV[_X_AXIS] == _NETHERWORLD) {
    updateXY(e);
  }
  */
  var id = unique(I);
  _IDS_TO_ATTRIBUTES[id] = new Array();
  _IDS_TO_ATTRIBUTES[id]["I"] = I;
  _IDS_TO_ATTRIBUTES[id]["A0"] = A0;
  _IDS_TO_ATTRIBUTES[id]["SW"] = SW;
  _IDS_TO_ATTRIBUTES[id]["P"] = P;
  _IDS_TO_ATTRIBUTES[id]["L"] = L;
  _IDS_TO_ATTRIBUTES[id]["MN"] = MN;
  _IDS_TO_ATTRIBUTES[id]["MX"] = MX;
  _IDS_TO_ATTRIBUTES[id]["RX"] = RX;
  _IDS_TO_ATTRIBUTES[id]["RY"] = RY;
  _IDS_TO_ATTRIBUTES[id]["OX"] = OX;
  _IDS_TO_ATTRIBUTES[id]["OY"] = OY;
  _IDS_TO_ATTRIBUTES[id]["S"] = S;
  _IDS_TO_ATTRIBUTES[id]["AD"] = AD;
  path_to_id(AD, I);
}

function activate_rbutton(I) {
  _I = I;
}

function button_color_changer(I, F) {
  // for now, this is an easier function because no dragging is involved...
  var button = document.getElementById(I);
  button.style.fill = F;
}

function button_up(I) {
  button_color_changer(I, _IDS_TO_ATTRIBUTES[unique(I)]["UF"]);
  fausthandler(_IDS_TO_ATTRIBUTES[unique(I)]["AD"], 0);
  clearIdCache();
}

function button_down(I) {
  clog_key_sink();
  button_color_changer(I, _IDS_TO_ATTRIBUTES[unique(I)]["DF"]);
  // UI2DSP
  fausthandler(_IDS_TO_ATTRIBUTES[unique(I)]["AD"], 1);
}

function initiate_button(I, UF, DF, AD) {
  var id = unique(I);
  _IDS_TO_ATTRIBUTES[id] = new Array();
  _IDS_TO_ATTRIBUTES[id]["I"] = I;
  _IDS_TO_ATTRIBUTES[id]["UF"] = UF;
  _IDS_TO_ATTRIBUTES[id]["DF"] = DF;
  _IDS_TO_ATTRIBUTES[id]["AD"] = AD;
  path_to_id(AD, I);
}

function change_checkbox(I) {
  clog_key_sink();
  var AD = _IDS_TO_ATTRIBUTES[unique(I)]["AD"];
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

function initiate_checkbox(I, AD) {
  var id = unique(I);
  _IDS_TO_ATTRIBUTES[id] = new Array();
  _IDS_TO_ATTRIBUTES[id]["I"] = I;
  _IDS_TO_ATTRIBUTES[id]["AD"] = AD;
  path_to_id(AD, I);
}

function clog_key_sink() {
  _N = 0;
}

// if a numerical entry is linked to an incremental object,
// actualize it

function actualize_incremental_object(id) {
  var hslider_id = "faust_hslider_knob_"+id;
  var vslider_id = "faust_vslider_knob_"+id;
  var rotating_button_id = "faust_rbutton_knob_"+id;
  var val = parseFloat(_IDS_TO_ATTRIBUTES[id]["B"]);
  var maybe_slider = document.getElementById(hslider_id);
  if (maybe_slider == null) {
    maybe_slider = document.getElementById(vslider_id);
  }
  var maybe_button = document.getElementById(rotating_button_id);
  if (maybe_slider != null) {
    // ugh...code dups
    var MN = _IDS_TO_ATTRIBUTES[id]["MN"];
    var MX = _IDS_TO_ATTRIBUTES[id]["MX"];
    var T = _IDS_TO_ATTRIBUTES[id]["T"];
    var P = _IDS_TO_ATTRIBUTES[id]["P"];
    var A = _IDS_TO_ATTRIBUTES[id]["A"];
    val = remap(val, MN, MX, 0, T - (T * P));
    var transform = transformToArray(maybe_slider.getAttribute("transform"));
    transform[0][A + 1] = val;
    var movetothis = arrayToTransform(transform);
    maybe_slider.setAttribute("transform", movetothis);
    return 0;
  }
  else if (maybe_button != null) {
    var MN = _IDS_TO_ATTRIBUTES[id]["MN"];
    var MX = _IDS_TO_ATTRIBUTES[id]["MX"];
    var A0 = _IDS_TO_ATTRIBUTES[id]["A0"];
    var P = _IDS_TO_ATTRIBUTES[id]["P"];
    var SW = _IDS_TO_ATTRIBUTES[id]["SW"];
    val = remap(val, MN, MX, A0, A0 + SW - (SW * P));
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
  var id = unique(_N);

  var MN = _IDS_TO_ATTRIBUTES[id]["MN"];
  var MX = _IDS_TO_ATTRIBUTES[id]["MX"];
  var AD = _IDS_TO_ATTRIBUTES[id]["AD"];

  if (isNaN(_IDS_TO_ATTRIBUTES[id]["B"])) {
    _IDS_TO_ATTRIBUTES[id]["B"] = ""+_IDS_TO_ATTRIBUTES[id]["D"];
  }
  var c = parseFloat(_IDS_TO_ATTRIBUTES[id]["B"]);
  var label = document.getElementById(_N);
  var now = bound(c, MN, MX);
  _IDS_TO_ATTRIBUTES[id]["B"] = ""+now;
  label.textContent = _IDS_TO_ATTRIBUTES[id]["B"];
  _IDS_TO_ATTRIBUTES[id]["D"] = _IDS_TO_ATTRIBUTES[id]["B"]; // prevents bad snaps of values

  // UI2DSP
  fausthandler(AD, now);

  actualize_incremental_object(id);
}

function buffer_backspace() {
  var id = unique(_N);
  if (_IDS_TO_ATTRIBUTES[id]["B"].length == 0) {
    return 0;
  }
  _IDS_TO_ATTRIBUTES[id]["B"] = _IDS_TO_ATTRIBUTES[id]["B"].substring(0, _IDS_TO_ATTRIBUTES[id]["B"].length - 1);
  var label = document.getElementById(_N);
  label.textContent = _IDS_TO_ATTRIBUTES[id]["B"];
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
  var id = unique(_N);
  if (e.keyCode == 13) {
    actualize_buffer();
  }
  else {
    var key = e.keyCode;
    var str = String.fromCharCode(key)
    _IDS_TO_ATTRIBUTES[id]["B"] += str;
  }
  var label = document.getElementById(_N);
  label.textContent = _IDS_TO_ATTRIBUTES[id]["B"];
}

document.onkeypress = keys_to_sink;
document.onkeydown = make_delete_key_work;
document.onmouseup = clearIdCache;

function make_key_sink(I) {
  _N = 'faust_value_'+I;
  _IDS_TO_ATTRIBUTES[id]["B"] = "";
}

function generic_key_sink(I) {
  var id = unique(I);
  make_key_sink(id);
  _I = 0;
}

function hslider_key_sink(I) {
  generic_key_sink(I);
}

function vslider_key_sink(I) {
  generic_key_sink(I);
}

function rotating_button_key_sink(I) {
  generic_key_sink(I);
}

function move_to_ridiculous_negative(id) {
  generic_translate(id, _NETHERWORLD, _NETHERWORLD);
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
  generic_translate(goodid, x, y);
}

function path_to_id(path, id) {
  _PATHS_TO_IDS[path] = id;
}

function devnull() { }

var mouseUpFunction = devnull;