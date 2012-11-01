
//-----------------------------------------------------------------------------
// handlers to send a faust 'set' message
// actually using a 'GET' method
//-----------------------------------------------------------------------------
_f4u$t.fausthandler = function(dest, value) {
  if (1) {
    var msg = "$.get( " + dest +"?value=" + value + ");";
    console.log(msg);
  }
  $.get("http://localhost:5510"+dest +"?value=" + value);
}

//-----------------------------------------------------------------------------
// poll current values from the server
//-----------------------------------------------------------------------------

_f4u$t.get_id_kind = function(id) {
  var split = id.split('_');
  if (split.length > 2) {
    return split[1];
  }
  return '';
}

_f4u$t.update_incremental_object_value = function(id, value) {
  _f4u$t.dumb_label_update(_f4u$t.unique(id), value);
  _f4u$t.actualize_incremental_object(_f4u$t.unique(id));
}

_f4u$t.update_hslider_value = function(id, value) {
  _f4u$t.update_incremental_object_value(id, value);
}

_f4u$t.update_vslider_value = function(id, value) {
  _f4u$t.update_incremental_object_value(id, value);
}

_f4u$t.update_rbutton_value = function(id, value) {
  _f4u$t.update_incremental_object_value(id, value);
}

_f4u$t.update_nentry_value = function(id, value) {
  _f4u$t.dumb_label_update(unique(id), value);
}

_f4u$t.update_checkbox_value = function(id, value) {
  // perhaps too much UI here?
  var check = document.getElementById('faust_checkbox_check_'+unique(id));  
  check.style.opacity = value;
}

_f4u$t.update_checkbox_value = function(id, value) {
  // should work...
  _f4u$t.change_checkbox(id);
}

_f4u$t.dispatch = function(data) {
  var lines = data.split('\n');
  var limit = lines.length;
  for (i=0; i < limit; i++) {
    var values = lines[i].split(' ');
    if (values.length > 1) {
      var address = values[0];
      var value = Math.round(values[1]*10000)/10000;
      //$('[name="'+address+'"]').val(value);
      var id = _f4u$t.PATHS_TO_IDS[address];
      var kind = _f4u$t.get_id_kind(id);
      if (kind == 'vslider') { _f4u$t.update_vslider_value(id, value); }
      else if (kind == 'hslider') { _f4u$t.update_hslider_value(id, value); }
      else if (kind == 'rbutton') { _f4u$t.update_rbutton_value(id, value); }
      else if (kind == 'checkbox') { _f4u$t.update_checkbox_value(id, value); }
      else if (kind == 'button') { /* do nothing */ }
      else if (kind == 'nentry') { _f4u$t.update_nentry_value(id, value); }
      /*
      // TODO : finish stuff below
      else if (kind == 'vbargraph') { _f4u$t.update_vertical_bar_value(id, value); }
      else if (kind == 'hbargraph)' { _f4u$t.update_horizontal_bar_value(id, value); }
      */
      else { console.log("Unidentified Faust Object (UFO) "+id+" "+kind); }
    }
  }
}

_f4u$t.update = function() {
  $.get( "http://localhost:5510/"+_f4u$t.ROOT, function(data) { dispatch( data ); } );
  setTimeout ( function() { _f4u$t.update(); }, 200);
}
// uncomment this once stuff is up and running.
//otherwise there'll be tons of error messages all the time!
//$(document).ready(function() { _f4u$t.update(); });
