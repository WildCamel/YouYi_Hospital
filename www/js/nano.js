/* Nano Templates (Tomasz Mazur, Jacek Becela) */

function nano(template, data) {
  return template.replace(/\{([\w\.]*)\}/g, function(str, key) {
	var v;
	if (typeof(data) != 'undefined') {
		var keys = key.split(".");
		v = data[keys[0]];
		for (var i = 1, l = keys.length; i < l; i++) v = v[keys[i]];
		if (typeof(v) != 'undefined' && v != null) {
			switch (keys[keys.length - 1]) {
				case 'src':
				case 'href':
				case 'icon':
					v = nano(v, $.app);
					break;
			}
		}
	}
	if (typeof(v) == 'undefined' && typeof($.app[key]) != 'undefined') {
		v = $.app[key];
	}
	if (typeof(v) == 'undefined') {
		return str;
	}else {
	    return (v !== null) ? v : "";
	}
  });
}
