VERBOSE = False
#VERBOSE = True

import svglib
from utilities import *
import json
import sys

import xml.dom.minidom
from xmlutilities import *

D = svglib.SVGDocument(js=gulp('faust_ui.js'), css=gulp('faust_css.css'), verbose=VERBOSE, w=1200, h=600)
H = svglib.HTMLDocument(js="/* no js */", css="/* no css */", other=FAUST_JS)
H.nodes.append(D)

JSON = json.loads(gulp(sys.argv[1]))
# we want the UI
UI = JSON["ui"]
assert (len(UI) == 1)

def hasknob(dct) :
  if not dct.has_key('meta') :
    return False
  if not dct['meta'][0].has_key('style') :
    return False
  return dct['meta'][0]['style'] == 'knob'

def make_rbutton(dct) :
  return svglib.FaustRotatingButton(label=dct["label"],
             mn=float(dct["min"]),
             mx=float(dct["max"]),
             step=float(dct["step"]),
             address=dct["address"],
             default=float(dct["init"]))


def make_hslider(dct) :
  return make_slider(svglib.FaustHorizontalSlider, dct)

def make_vslider(dct) :
  return make_slider(svglib.FaustVerticalSlider, dct)

def make_slider(kls, dct) :
  if hasknob(dct) :
    return make_rbutton(dct)
  return kls(label=dct["label"],
             mn=float(dct["min"]),
             mx=float(dct["max"]),
             step=float(dct["step"]),
             address=dct["address"],
             default=float(dct["init"]))

def make_hbargraph(dct) :
  return make_bargraph(svglib.FaustHorizontalBarGraph, dct)

def make_vbargraph(dct) :
  return make_bargraph(svglib.FaustVerticalBarGraph, dct)

def make_bargraph(kls, dct) :
  return kls(label=dct["label"],
             mn=float(dct["min"]),
             mx=float(dct["max"]),
             address=dct["address"])

def make_button(dct) :
  return svglib.FaustButton(label=dct["label"], address=dct["address"])

def make_checkbox(dct) :
  return svglib.FaustCheckBox(label=dct["label"], address=dct["address"], default=True if dct["init"] == "1" else False)

def make_nentry(dct) :
  if hasknob(dct) :
    return make_rbutton(dct)
  return svglib.FaustNumericalEntry(label=dct["label"],
             mn=float(dct["min"]),
             mx=float(dct["max"]),
             step=float(dct["step"]),
             address=dct["address"],
             default=float(dct["init"]))

def make_vgroup(dct) :
  return make_group(Y_AXIS, dct)

def make_hgroup(dct) :
  return make_group(X_AXIS, dct)

def make_group(axis, dct) :
  lm = svglib.LayoutManager(o=axis, label=dct["label"])
  for item in dct["items"] :
    if item["type"] == "hgroup" :
      lm.objs.append(make_hgroup(item))
    elif item["type"] == "vgroup" :
      lm.objs.append(make_vgroup(item))
    elif item["type"] == "tgroup" :
      lm.objs.append(make_tgroup(item))
    elif item["type"] == "hslider" :
      lm.objs.append(make_hslider(item))
    elif item["type"] == "vslider" :
      lm.objs.append(make_vslider(item))
    elif item["type"] == "hbargraph" :
      lm.objs.append(make_hbargraph(item))
    elif item["type"] == "vbargraph" :
      lm.objs.append(make_vbargraph(item))
    elif item["type"] == "button" :
      lm.objs.append(make_button(item))
    elif item["type"] == "checkbox" :
      lm.objs.append(make_checkbox(item))
    elif item["type"] == "nentry" :
      lm.objs.append(make_nentry(item))
    else :
      print item["type"], "Cannot make SVG. Exiting gracefully."
      sys.exit(1)
  return lm

def make_tgroup(dct) :
  tg = svglib.TabGroup()
  for item in dct["items"] :
    if item["type"] == "hgroup" :
      tg.objs.append(make_hgroup(item))
    elif item["type"] == "vgroup" :
      tg.objs.append(make_vgroup(item))
    elif item["type"] == "tgroup" :
      tg.objs.append(make_tgroup(item))
    else :
      print item["type"], "Cannot make SVG. Exiting gracefully."
      sys.exit(1)
  return tg

def populate_objs(o) :
  for obj in o.objs :
    obj.mom = o
    if hasattr(obj, 'objs') :
      populate_objs(obj)

LM = 0
if UI[0]["type"] == "vgroup" :
  LM = make_vgroup(UI[0])
elif UI[0]["type"] == "hgroup" :
  LM = make_hgroup(UI[0])
elif UI[0]["type"] == "tgroup" :
  LM = make_tgroup(UI[0])
else :
  print item["type"], "Cannot make SVG. Exiting gracefully."
  sys.exit(1)

D.lm = LM
LM.mom = D

populate_objs(LM)
#doc = xml.dom.minidom.parseString(H.export())
#dt = '<!DOCTYPE html>'
#doc = setDoctype(doc, dt)
#print doc.toprettyxml(indent="  ", encoding="iso-8859-1")
print H.export()
