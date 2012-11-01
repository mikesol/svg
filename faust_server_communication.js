
//-----------------------------------------------------------------------------
// handlers to send a faust 'set' message
// actually using a 'GET' method
//-----------------------------------------------------------------------------
_FAUST_NAMESPACE["fausthandler"] = function(dest, value) {
  if (1) {
    var msg = "$.get( " + dest +"?value=" + value + ");";
    console.log(msg);
  }
  $.get("http://localhost:5510"+dest +"?value=" + value);
}

//-----------------------------------------------------------------------------
// poll current values from the server
//-----------------------------------------------------------------------------

_FAUST_NAMESPACE["get_id_kind"] = function(id) {
  var split = id.split('_');
  if (split.length > 2) {
    return split[1];
  }
  return '';
}

_FAUST_NAMESPACE["update_incremental_object_value"] = function(id, value) {
  _FAUST_NAMESPACE["dumb_label_update"](_FAUST_NAMESPACE["unique"](id), value);
  _FAUST_NAMESPACE["actualize_incremental_object"](_FAUST_NAMESPACE["unique"](id));
}

_FAUST_NAMESPACE["update_hslider_value"] = function(id, value) {
  _FAUST_NAMESPACE["update_incremental_object_value"](id, value);
}

_FAUST_NAMESPACE["update_vslider_value"] = function(id, value) {
  _FAUST_NAMESPACE["update_incremental_object_value"](id, value);
}

_FAUST_NAMESPACE["update_rbutton_value"] = function(id, value) {
  _FAUST_NAMESPACE["update_incremental_object_value"](id, value);
}

_FAUST_NAMESPACE["update_nentry_value"] = function(id, value) {
  _FAUST_NAMESPACE["dumb_label_update"](unique(id), value);
}

_FAUST_NAMESPACE["update_checkbox_value"] = function(id, value) {
  // perhaps too much UI here?
  var check = document.getElementById('faust_checkbox_check_'+unique(id));  
  check.style.opacity = value;
}

_FAUST_NAMESPACE["update_checkbox_value"] = function(id, value) {
  // should work...
  _FAUST_NAMESPACE["change_checkbox"](id);
}

_FAUST_NAMESPACE["dispatch"] = function(data) {
  var lines = data.split('\n');
  var limit = lines.length;
  for (i=0; i < limit; i++) {
    var values = lines[i].split(' ');
    if (values.length > 1) {
      var address = values[0];
      var value = Math.round(values[1]*10000)/10000;
      //$('[name="'+address+'"]').val(value);
      var id = _FAUST_NAMESPACE["PATHS_TO_IDS"][address];
      var kind = _FAUST_NAMESPACE["get_id_kind"](id);
      if (kind == 'vslider') { _FAUST_NAMESPACE["update_vslider_value"](id, value); }
      else if (kind == 'hslider') { _FAUST_NAMESPACE["update_hslider_value"](id, value); }
      else if (kind == 'rbutton') { _FAUST_NAMESPACE["update_rbutton_value"](id, value); }
      else if (kind == 'checkbox') { _FAUST_NAMESPACE["update_checkbox_value"](id, value); }
      else if (kind == 'button') { /* do nothing */ }
      else if (kind == 'nentry') { _FAUST_NAMESPACE["update_nentry_value"](id, value); }
      /*
      // TODO : finish stuff below
      else if (kind == 'vbargraph') { _FAUST_NAMESPACE["update_vertical_bar_value"](id, value); }
      else if (kind == 'hbargraph)' { _FAUST_NAMESPACE["update_horizontal_bar_value"](id, value); }
      */
      else { console.log("Unidentified Faust Object (UFO) "+id+" "+kind); }
    }
  }
}

_FAUST_NAMESPACE["update"] = function() {
  $.get( "http://localhost:5510/"+_FAUST_NAMESPACE["ROOT"], function(data) { dispatch( data ); } );
  setTimeout ( function() { _FAUST_NAMESPACE["update"](); }, 200);
}
// uncomment this once stuff is up and running.
//otherwise there'll be tons of error messages all the time!
//$(document).ready(function() { _FAUST_NAMESPACE["update"](); });
