import string
import random
import cmath

FAUST_JS = '''
<script src='jquery-1.7.1.min.js' language='javascript'></script>
<script src='faust_comm.js' language='javascript'></script>
'''

X_AXIS = 0
Y_AXIS = 1
NO_AXES = 2

# 0,0 in svg space is left,up, thus this convention
LEFT = -1
RIGHT = 1
UP = -1
DOWN = 1
CENTER = 0

BLACK = (0,0,0)
CYAN = (0,255,255)
#CYAN = None
GREY = (100,100,100)
PINK = (233,150,122)
GREEN = (173,255,47)
KERMIT = (47,243,160)

def magic_color() :
  r = random.randint(0,255)  
  g = random.randint(0,255)
  b = 430 - r - g
  v = [r,g,b]
  random.shuffle(v)
  return tuple(v)

INF = 1e21

def other_axis(axis) :
  return (axis + 1) % NO_AXES

def remap(v, mn0, mx0, mn1, mx1) :
  p = 1.0 * (v - mn0) / (mx0 - mn0)
  return p * (mx1 - mn1) + mn1

def jvalue(val, requested, actual) :
  if requested == 0 :
    raise ValueError('have no clue how to handle this')
  if actual == CENTER :
    return val / 2.0
  if actual * requested == 1 :
    return val
  return 0

def linear_combination(dir, v1, v2) :
  if dir == LEFT :
    return v1
  if dir == RIGHT :
    return v2
  return (v1 + v2) / 2.0

def xy(a,x,y) :
  return x if a == X_AXIS else y

def color_to_rgb(rgb) :
  if not rgb :
    return "none"
  return "rgb"+str(rgb)

def comment(foo) :
  return "<!-- "+str(foo)+" -->"

def gulp(fn) :
  f = file(fn,'r')
  out = f.read()
  f.close()
  return out

# goes up ancestry to see if verbose is set
def isverbose(i) :
  if not hasattr(i, 'mom') :
    if not hasattr(i, 'verbose') :
      return False
    return i.verbose
  else :
    if i.mom == None :
      if not hasattr(i, 'verbose') :
        return False
      return i.verbose
    else :
      return isverbose(i.mom)

def log(i, c) :
  if isverbose(i) : print comment(c)

# i <3 you, _randString !
def randString(length=7, chars=string.letters):
  first = random.choice(string.letters[26:])
  return first+''.join([random.choice(chars) for i in range(length-1)])

def sign(x) :
  return x if x == 0 else int(abs(x) / x)

# starting at a0, find all points between a0 and a0+sweep inclusive that are
# multiples of 90
# assumes that sweep is positive
def find_all_90s(a0, sweep) :
  total = 0
  out = []
  while a0 > total :
    total += 90
  while total <= a0 + sweep :
    out.append(total)
    total += 90
  return out

class Box(object) :
  def __init__(self) :
    self.x = (+INF,-INF)
    self.y = (+INF,-INF)
  def add_points(self, pts) :
    for pt in pts :
      self.add_point(pt)
  def add_point(self, pt) :
    self.x = (min(self.x[0], pt[0]), max(self.x[1], pt[0]))
    self.y = (min(self.y[0], pt[1]), max(self.y[1], pt[1]))
  def lens(self) :
    assert(self.x[1] >= self.x[0])
    assert(self.y[1] >= self.y[0])
    return self.x[1] - self.x[0], self.y[1] - self.y[0]
  def corners(self) :
    return (self.x[0], self.y[0]), (self.x[1], self.y[1])
  def __str__(self) :
    return "{0} {1}".format(self.x, self.y)

def rect_to_coord(r) :
  return r.real, r.imag

def coord_add(c0, c1) :
  return c0[0] + c1[0], c0[1] + c1[1]

def coord_sub(c0, c1) :
  return c0[0] - c1[0], c0[1] - c1[1]

def r2d(a) :
  return a * 180. / cmath.pi

def d2r(a) :
  return a * cmath.pi / 180.

def bound(v,m,n) :
  mn = min(m,n)
  mx = max(m,n)
  if v < mn : return mn
  if v > mx : return mx
  return v

