VERBOSE = False
#VERBOSE = True

import svglib
from utilities import *
import json
import sys

import xml.dom.minidom
from xmlutilities import *

D = svglib.SVGDocument(js=gulp('faust_ui.js'), css=gulp('faust_css.css'), verbose=VERBOSE, w=1200, h=600)

JSON = json.loads(gulp(sys.argv[1]))
# we want the UI
UI = JSON["ui"]
assert (len(UI) == 1)

def make_hslider(dct) :
  return make_slider(svglib.FaustHorizontalSlider, dct)

def make_vslider(dct) :
  return make_slider(svglib.FaustVerticalSlider, dct)

def make_slider(kls, dct) :
  return kls(label=dct["label"],
             mn=float(dct["min"]),
             mx=float(dct["max"]),
             step=float(dct["step"]),
             address=dct["address"],
             default=float(dct["init"]))

def make_button(dct) :
  return svglib.FaustButton(label=dct["label"], address=dct["address"])

def make_checkbox(dct) :
  return svglib.FaustCheckBox(label=dct["label"], address=dct["address"], default=True if dict["init"] == "1" else False)

def make_vgroup(dct) :
  return make_group(Y_AXIS, dct)

def make_hgroup(dct) :
  return make_group(X_AXIS, dct)

def make_group(axis, dct) :
  lm = svglib.LayoutManager(o=axis, label=dct["label"])
  for item in dct["items"] :
    if item["type"] == "hgroup" :
      lm.objects.append(make_hgroup(item))
    elif item["type"] == "vgroup" :
      lm.objects.append(make_vgroup(item))
    elif item["type"] == "hslider" :
      lm.objects.append(make_hslider(item))
    elif item["type"] == "vslider" :
      lm.objects.append(make_vslider(item))
    elif item["type"] == "button" :
      lm.objects.append(make_button(item))
    elif item["type"] == "button" :
      lm.objects.append(make_checkbox(item))
    else :
      "Cannot make SVG. Exiting gracefully."
      sys.exit(1)
  return lm

def make_tgroup(dct) :
  tg = svglib.TabGroup()
  for item in dct["items"] :
    if item["type"] == "hgroup" :
      tg.objects.append(make_hgroup(item))
    elif item["type"] == "vgroup" :
      tg.objects.append(make_vgroup(item))
    else :
      "Cannot make SVG. Exiting gracefully."
      sys.exit(1)
  return tg

def populate_kids(o) :
  for kid in o.objects :
    kid.mom = o
    if hasattr(kid, 'objects') :
      populate_kids(kid)

LM = 0
if UI[0]["type"] == "vgroup" :
  LM = make_vgroup(UI[0])
elif UI[0]["type"] == "hgroup" :
  LM = make_hgroup(UI[0])
elif UI[0]["type"] == "tgroup" :
  LM = make_tgroup(UI[0])
else :
  "Cannot make SVG. Exiting gracefully."
  sys.exit(1)

D.lm = LM
LM.mom = D

populate_kids(LM)
doc = xml.dom.minidom.parseString(D.export_to_svg())
dt = xml.dom.minidom.getDOMImplementation('').createDocumentType('svg', '-//W3C//DTD SVG 1.1//EN', 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd')
doc = setDoctype(doc, dt)
#xml.doctype = 'svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"'
print doc.toprettyxml(indent="  ", encoding="iso-8859-1")
