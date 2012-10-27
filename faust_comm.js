
//-----------------------------------------------------------------------------
// handlers to send a faust 'set' message
// actually using a 'GET' method
//-----------------------------------------------------------------------------
function fausthandler(dest, value) {
  if (1) {
    var msg = "$.get( " + dest +"?value=" + value + ");";
    console.log(msg);
  }
  $.get("http://localhost:5510"+dest +"?value=" + value);
}

function sliderhandler(dest, value, id) {
  fausthandler (dest, value);
  $(id).val(Math.round(value*10000)/10000);
}

//-----------------------------------------------------------------------------
// poll current values from the server
//-----------------------------------------------------------------------------

function get_id_kind(id) {
  var split = id.split('_');
  if (split.length > 2) {
    return split[1];
  }
  return '';
}

function update_incremental_object_value(id, value) {
  dumb_label_update(unique(id), value);
  actualize_incremental_object(unique(id));
}

function update_hslider_value(id, value) {
  update_incremental_object_value(id, value);
}

function update_vslider_value(id, value) {
  update_incremental_object_value(id, value);
}

function update_rbutton_value(id, value) {
  update_incremental_object_value(id, value);
}

function update_nentry_value(id, value) {
  dumb_label_update(unique(id), value);
}

function update_checkbox_value(id, value) {
  // perhaps too much UI here?
  var check = document.getElementById('faust_checkbox_check_'+unique(id));  
  check.style.opacity = value;
}

function update_checkbox_value(id, value) {
  // should work...
  change_checkbox(id);
}

function dispatch (data) {
  var lines = data.split('\n');
  var limit = lines.length;
  for (i=0; i < limit; i++) {
    var values = lines[i].split(' ');
    if (values.length > 1) {
      var address = values[0];
      var value = Math.round(values[1]*10000)/10000;
      //$('[name="'+address+'"]').val(value);
      var id = _PATHS_TO_IDS[address];
      var kind = get_id_kind(id);
      if (kind == 'vslider') { update_vslider_value (id, value); }
      else if (kind == 'hslider') { update_hslider_value (id, value); }
      else if (kind == 'rbutton') { update_rbutton_value (id, value); }
      else if (kind == 'checkbox') { update_checkbox_value (id, value); }
      else if (kind == 'button') { /* do nothing */ }
      else if (kind == 'nentry') { update_nentry_value (id, value); }
      /*
      // TODO : finish stuff below
      else if (kind == 'vbargraph') { update_vertical_bar_value (id, value); }
      else if (kind == 'hbargraph)' { update_horizontal_bar_value (id, value); }
      */
      else { console.log("Unidentified Faust Object (UFO) "+id+" "+kind); }
    }
  }
}

function update (root) {
  $.get( "http://localhost:5510/UITester", function(data) { dispatch( data ); } );
  setTimeout ( function () { update(root); }, 200);
}
$(document).ready(function() { update ($('#root').val()); });
