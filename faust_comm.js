
//-----------------------------------------------------------------------------
// handlers to send a faust 'set' message
// actually using a 'GET' method
//-----------------------------------------------------------------------------
function fausthandler(dest, value) {
  if (0) {
    var msg = "$.get( " + dest +"?value=" + value + ");";
    $("#trace").html(msg);
  }
  else $.get("http://localhost:5510"+dest +"?value=" + value);
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

function update_slider_value(id, value) {
  dumb_label_update(unique(id), value);
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
      /*
      var id = _PATHS_TO_IDS[address];
      var kind = get_id_kind(id);
      if (kind == 'vslider') { update_vertical_slider_value (id, value); }
      else if (kind == 'hslider') { update_horizontal_slider_value (id, value); }
      else if (kind == 'checkbox') { update_faust_checkbox (id, value); }
      else if (kind == 'button') { update_faust_button (id, value); }
      //else if (kind == 'faust_numerical_entry') { update_numerical_entry (id, value); }
      else if (kind == 'faust_rbutton') { update_rotating_button_value (id, value); }
      else if (kind == 'faust_vbargraph') { update_vertical_bar_value (id, value); }
      else if (kind == 'faust_hbargraph)' { update_horizontal_bar_value (id, value); }
      else { alert("Unidentified Faust Object (UFO)"); }
      */
    }
  }
}

function update (root) {
  $.get( "http://localhost:5510/karplus", function(data) { dispatch( data ); } );
  setTimeout ( function () { update(root); }, 200);
}
$(document).ready(function() { update ($('#root').val()); });
