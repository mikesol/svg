_FAUST_NAMESPACE["has_knob"] = function(dct) {
  if (!dct['meta']) {
    return false;
  }
  if (!dct['meta'][0]['style']) {
    return false;
  }
  return dct['meta'][0]['style'] == 'knob';
}

_FAUST_NAMESPACE["make_rbutton"] = function(dct) {
  return _FAUST_NAMESPACE["RotatingButton"]({
    label : dct["label"],
    mn : parseFloat(dct["min"]),
    mx : parseFloat(dct["max"]),
    step : parseFloat(dct["step"]),
    address : dct["address"],
    def : parseFloat(dct["init"])
  });
}

_FAUST_NAMESPACE["make_hslider"] = function(dct) {
  return _FAUST_NAMESPACE["make_slider"](_FAUST_NAMESPACE["HorizontalSlider"], dct);
}

_FAUST_NAMESPACE["make_vslider"] = function(dct) {
  return _FAUST_NAMESPACE["make_slider"](_FAUST_NAMESPACE["VerticalSlider"], dct);
}

_FAUST_NAMESPACE["make_slider"] = function(kls, dct) {
  if (_FAUST_NAMESPACE["has_knob"](dct)) {
    return _FAUST_NAMESPACE["make_rbutton"](dct);
  }
  return kls({
    label : dct["label"],
    mn : parseFloat(dct["min"]),
    mx : parseFloat(dct["max"]),
    step : parseFloat(dct["step"]),
    address : dct["address"],
    def : parseFloat(dct["init"])
  });
}

_FAUST_NAMESPACE["make_hbargraph"] = function(dct) {
  return _FAUST_NAMESPACE["make_bargraph"](_FAUST_NAMESPACE["HorizontalBarGraph"], dct);
}

_FAUST_NAMESPACE["make_vbargraph"] = function(dct) {
  return _FAUST_NAMESPACE["make_bargraph"](_FAUST_NAMESPACE["VerticalBarGraph"], dct);
}

_FAUST_NAMESPACE["make_bargraph"] = function(kls, dct) {
  return kls({
    label : dct["label"],
    mn : parseFloat(dct["min"]),
    mx : parseFloat(dct["max"]),
    address : dct["address"]
  });
}


_FAUST_NAMESPACE["make_button"] = function(dct) {
  return _FAUST_NAMESPACE["Button"]({
    label : dct["label"],
    address : dct["address"]
  });
}

_FAUST_NAMESPACE["make_checkbox"] = function(dct) {
  return _FAUST_NAMESPACE["CheckBox"]({
    label : dct["label"],
    address : dct["address"],
    def : (dct["init"] == "1" ? true : false)
  });
}

_FAUST_NAMESPACE["make_nentry"] = function(dct) {
  if (_FAUST_NAMESPACE["has_knob"](dct)) {
    return _FAUST_NAMESPACE["make_rbutton"](dct);
  }
  return _FAUST_NAMESPACE["NumericalEntry"]({
    label : dct["label"],
    mn : parseFloat(dct["min"]),
    mx : parseFloat(dct["max"]),
    step : parseFloat(dct["step"]),
    address : dct["address"],
    def : parseFloat(dct["init"]
  });
)

_FAUST_NAMESPACE["make_hgroup"] = function(dct) {
  return _FAUST_NAMESPACE["make_group"](_FAUST_NAMESPACE["X_AXIS"], dct);
}

_FAUST_NAMESPACE["make_vgroup"] = function(dct) {
  return _FAUST_NAMESPACE["make_group"](_FAUST_NAMESPACE["Y_AXIS"], dct);
}

_FAUST_NAMESPACE["make_group"] = function(axis, dct) {
  var lm = _FAUST_NAMESPACE["LayoutManager"]({
    o : axis,
    label : dct["label"]
  });

  for (var i = 0; i < dct["items"].length; i++) {
    if (dct["items"][i]["type"] == "hgroup") {
      lm.objs.push(_FAUST_NAMESPACE["make_hgroup"](dct["items"][i]));
    }
    else if (dct["items"][i]["type"] == "vgroup") {
      lm.objs.push(_FAUST_NAMESPACE["make_vgroup"](dct["items"][i]));
    }
    else if (dct["items"][i]["type"] == "tgroup") {
      lm.objs.push(_FAUST_NAMESPACE["make_tgroup"](dct["items"][i]));
    }
    else if (dct["items"][i]["type"] == "hslider") {
      lm.objs.push(_FAUST_NAMESPACE["make_hslider"](dct["items"][i]));
    }
    else if (dct["items"][i]["type"] == "vslider") {
      lm.objs.push(_FAUST_NAMESPACE["make_vslider"](dct["items"][i]));
    }
    else if (dct["items"][i]["type"] == "hbargraph") {
      lm.objs.push(_FAUST_NAMESPACE["make_hbargraph"](dct["items"][i]));
    }
    else if (dct["items"][i]["type"] == "vbargraph") {
      lm.objs.push(_FAUST_NAMESPACE["make_vbargraph"](dct["items"][i]));
    }
    else if (dct["items"][i]["type"] == "button") {
      lm.objs.push(_FAUST_NAMESPACE["make_button"](dct["items"][i]));
    }
    else if (dct["items"][i]["type"] == "checkbox") {
      lm.objs.push(_FAUST_NAMESPACE["make_checkbox"](dct["items"][i]));
    }
    else if (dct["items"][i]["type"] == "nentry") {
      lm.objs.push(_FAUST_NAMESPACE["make_nentry"](dct["items"][i]));
    else {
      console.log("UFO: Unidentified Faust Object");
  }

  return lm;
}

_FAUST_NAMESPACE["make_tgroup"] = function(dct) {
  var tg = _FAUST_NAMESPACE["TabGroup"]({});

  for (var i = 0; i < dct["items"].length; i++) {
    if (dct["items"][i]["type"] == "hgroup") {
      tg.objs.push(_FAUST_NAMESPACE["make_hgroup"](dct["items"][i]));
    }
    else if (dct["items"][i]["type"] == "vgroup") {
      tg.objs.push(_FAUST_NAMESPACE["make_vgroup"](dct["items"][i]));
    }
    else if (dct["items"][i]["type"] == "tgroup") {
      tg.objs.push(_FAUST_NAMESPACE["make_tgroup"](dct["items"][i]));
    }
    else {
      console.log("UFO: Unidentified Faust Object");
    }
  }

  return tg;
}

_FAUST_NAMESPACE["json_to_ui"] = function(json) {
  if (json["ui"][0]["type"] == "vgroup") {
    return _FAUST_NAMESPACE["make_vgroup"](json["ui"][0]);
  }
  else if (json["ui"][0]["type"] == "hgroup") {
    return _FAUST_NAMESPACE["make_hgroup"](json["ui"][0]);
  }
  else if (json["ui"][0]["type"] == "tgroup" {
    return _FAUST_NAMESPACE["make_tgroup"](json["ui"][0]);
  }
  else {
    console.log("UFO: Unidentified Faust Object");
  }
}
