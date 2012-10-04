var X_AXIS = 0;
var Y_AXIS = 1;

var _I = 0; // id
var _T = 0; // max graphical value of slider. min always 0
var _P = 0; // percentage of slider bulk of max value
var _MN = 0; // minimum value of slider
var _MX = 0; // maximum value of slider
var _S = 0; // quantization scale of slider
var _A = 0; // axis

var DEVNULL = -5000;

var prev = new Array();
prev[X_AXIS] = DEVNULL;
prev[Y_AXIS] = DEVNULL;

// parser of an object's transform

function transformToArray(transform) {
  var out = [];
  var flre = "[-+]?[0-9]*\\.?[0-9]*(?:[eE][-+]?[0-9]+)?";
  var matrix = new RegExp("^\\s*matrix\\s*\\(\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*[,]\\s*("+flre+")\\s*\\)");
  var translate = new RegExp("^\\s*translate\\s*\\(\\s*("+flre+")\\s*(?:[,]\\s*("+flre+")\\s*)?\\)");
  var scale = new RegExp("^\\s*scale\\s*\\(\\s*("+flre+")\\s*(?:[,]\\s*("+flre+")\\s*)?\\)");
  var rotate = new RegExp("^\\s*rotate\\s*\\(\\s*("+flre+")\\s*\\)");
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
      out.push(["rotate",parseFloat(match[1])]);
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
function moveActiveSlider(e) {
  if (_I == 0) {
    updateXY(e);
    return true;
  }
  var pos = -1;
  // we only care about the axis of the slider
  if (_A == X_AXIS) {
    pos = e.clientX;
  }
  else {
    pos = e.clientY;
  }

  var diff = pos - prev[_A];
  var sliding_part_inside = document.getElementById(_I+"_inside");
  var sliding_part_border = document.getElementById(_I+"_border");
  var transform = transformToArray(sliding_part_inside.getAttribute("transform"));
  // we assume that there is only one element and that it is a transform
  // make sure to change this if things get more complicated
  // actually, just make sure not to make things more complicated...

  // minimum of the slider is to the bottom / left
  if (0 > transform[0][_A + 1] + diff) {
    transform[0][_A + 1] = 0;
  }
  // maximum is to the top / right
  else if (transform[0][_A + 1] + diff > _T - (_T * _P)) {
    transform[0][_A + 1] = _T - (_T * _P);
  }
  // if neither of the above are true, free to move by the difference
  else {
    transform[0][_A + 1] = transform[0][_A + 1] + diff;
  }
  var movetothis = arrayToTransform(transform);
  sliding_part_inside.setAttribute("transform", movetothis);
  sliding_part_border.setAttribute("transform", movetothis);
  updateXY(e);
  return true;
}

// gets rid of the current thing being dragged
function clearIdCache() {
  _A = 0;
  _I = 0;
  _T = 0;
  _P = 0;
  _MN = 0;
  _MX = 0;
  _S = 0;
}

document.onmousemove = moveActiveSlider;
document.onmouseup = clearIdCache;

function initiate_slide(A, I, T, P, MN, MX, S) {
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
}

function horizontal_slide(I, T, P, MN, MX, S) {
  initiate_slide(X_AXIS, I, T,P,MN, MX, S);
}

function vertical_slide(I, T, P, MN, MX, S) {
  initiate_slide(Y_AXIS, I, T, P,MN, MX, S);
}