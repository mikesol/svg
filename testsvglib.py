from svglib import *
# for pretty printing
import xml.dom.minidom
from xmlutilities import *

d = SVGDocument(js=gulp('faust_js.js'), css=gulp('faust_css.css'), verbose=False, w=800, h=400)

##########################
l0 = LayoutManager(mom=d,o=Y_AXIS)
d.lm = l0
##########################
l1 = LayoutManager(mom=l0)
s0 = FaustVerticalSlider(mom=l1)
s1 = FaustHorizontalSlider(mom=l1)
s2 = FaustNumericalEntry(mom=l1)
l1.objects = [s0,s1,s2]
#l1.objects = [s0]
##########################
l2 = LayoutManager(mom=l0)
s3 = FaustRotatingButton(mom=l2)
s4 = FaustButton(mom=l2)
#s5 = FaustVerticalSlider(mom=l2)
s5 = FaustCheckBox(mom=l2)
l2.objects = [s3,s4,s5]
#l2.objects = [s3]
##########################
l0.objects = [l1,l2]

doc = xml.dom.minidom.parseString(d.export_to_svg())
dt = xml.dom.minidom.getDOMImplementation('').createDocumentType('svg', '-//W3C//DTD SVG 1.1//EN', 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd')
doc = setDoctype(doc, dt)
#xml.doctype = 'svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"'
print doc.toprettyxml(indent="  ", encoding="iso-8859-1")
