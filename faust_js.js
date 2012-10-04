// Temporary variables to hold mouse x-y pos.s

var X_AXIS = 0;
var Y_AXIS = 1;

var _I = 0;
var _X = 0;
var _Y = 0;
var _MN = 0;
var _MX = 0;
var _S = 0;
var _A = 0;

// Main function to move currently-selected slider
function moveActiveSlider(e) {
  if (_I == 0) {
    return true;
  }
  var pos = -1;
  if (_D == X_AXIS) {
    pos = e.pageX;
  }
  else {
    pos = e.pageY;
  }
  return true;
}

// gets rid of the current thing being dragged
function clearIdCache() {
  _A = 0;
  _I = 0;
  _X = 0;
  _Y = 0;
  _MN = 0;
  _MX = 0;
  _S = 0;
}

document.onmousemove = moveActiveSlider;
document.onmouseup = clearIdCache;

function initiate_slide(A, I, X, Y, MN, MX, S) {
  _A = A;
  _I = I;
  _X = X;
  _Y = Y;
  _MN = MN;
  _MX = MX;
  _S = S;
}

function horizontal_slide(I,X,Y,MN,MX,S) {
  initiate_slide(X_AXIS, I, X, Y, MN, MX, S);
}

function vertical_slide(I,X,Y,MN,MX,S) {
  initiate_slide(Y_AXIS, I, X, Y, MN, MX, S);
}