import string
import random

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
GREY = (100,100,100)
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