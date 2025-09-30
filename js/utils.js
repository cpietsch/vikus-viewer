// copyright christopher pietsch
// cpietsch@gmail.com
// @chrispiecom
// 2015-2018


window.utils = { config: {} };

utils.setMode = function (mode) {
	console.log("set mode", mode)
}

utils.getDataBaseUrl = function () {
	var params = new URLSearchParams(window.location.search)
	var config = params.get('config')
	var path = ""
	if (config) {
		path = config.split("/")
		path.pop()
		path = path.join("/") + "/"
		console.log("url", path)
	}
	return { path, config }
}
utils.makeUrl = function makeUrl(path, url) {
	// console.log("make", path, url);
	if (url && url.startsWith("http")) {
		return url;
	}
	return path + url;
}
utils.isMobile = function () {
	return (window.innerWidth
		|| document.documentElement.clientWidth
		|| document.body.clientWidth) < 500;
}

utils.isSafari = function () {
	return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

utils.welcome = function () {
	// who needs this fancy console styles
	if (window.console) {
		window.console.log('\n _   ________ ____  ______ \n| | / /  _/ //_/ / / / __/ \n| |/ // // ,< / /_/ /\ \ \n|___/___/_/|_|\____/___/_______ \n| | / /  _/ __/ | /| / / __/ _ \ \n| |/ // // _/ | |/ |/ / _// , _/ \n|___/___/___/ |__/|__/___/_/|_| \n')
	}
}

utils.initConfig = function (config) {

	this.config = config;

	// load infosidebar info.md
	d3.text(utils.makeUrl(config.baseUrl.path, config.loader.info), function (error, text) {
		// console.log(error, text)
		if (text) infoVue.info = text
	})

	// d3.text(config.loader.info, function (text) { if (text) infoVue.info = text })

	// set window title
	document.title = config.project.name

	if (config.searchEnabled !== undefined) {
		!config.searchEnabled ? document.querySelector('.searchbar').style.display = 'none' : null;
	}

	// puh thats kind of nasty, lets call it oldschool...
	var length = document.styleSheets[0].cssRules.length
	document.styleSheets[0].insertRule('.close::before { background-color: ' + config.style.fontColorActive + '}', length);
	document.styleSheets[0].insertRule('.close::after { background-color: ' + config.style.fontColorActive + '}', length);
	document.styleSheets[0].insertRule('.tag.active { color: ' + config.style.fontColorActive + '}', length);
	document.styleSheets[0].insertRule('.tag.active { background: ' + config.style.fontBackground + '}', length);
	document.styleSheets[0].insertRule('.crossfilter .keys .item.active { color: ' + config.style.fontColorActive + '}', length);
	document.styleSheets[0].insertRule('.crossfilter .keys .item.active { background: ' + config.style.fontBackground + '}', length);
	document.styleSheets[0].insertRule('.crossfilter .keys .item:hover { color: ' + config.style.fontColorActive + '}', length);
	document.styleSheets[0].insertRule('.crossfilter .keys .item:hover { background: ' + config.style.fontBackground + '}', length);
	document.styleSheets[0].insertRule('.crossfilter .keys .item { background: ' + config.style.textShadow + '}', length);
	document.styleSheets[0].insertRule('.timeline .entry { background: ' + config.style.timelineBackground + '}', length);
	document.styleSheets[0].insertRule('.timeline .entry { color: ' + config.style.timelineFontColor + '}', length);
	document.styleSheets[0].insertRule('.timeline .year { color: ' + config.style.fontColor + '}', length);
	document.styleSheets[0].insertRule('.tagcloud .tag { text-shadow: ' + config.style.textShadow + '}', length);
	document.styleSheets[0].insertRule('.infobar .outer { background: ' + config.style.infoBackground + '}', length);
	document.styleSheets[0].insertRule('.infobar .outer { color: ' + config.style.infoFontColor + '}', length);
	document.styleSheets[0].insertRule('.infobar a { color: ' + config.style.infoFontColor + '}', length);
	document.styleSheets[0].insertRule('.infobar .infobutton path { stroke: ' + config.style.infoFontColor + '}', length);
	document.styleSheets[0].insertRule('.infobar.sneak .infobutton path { stroke: ' + config.style.fontColor + '}', length);
	document.styleSheets[0].insertRule('.sidebar .outer { background: ' + config.style.detailBackground + '}', length);
	document.styleSheets[0].insertRule('.searchbar input { background: ' + config.style.searchbarBackground + '}', length);
}

// exhibition installations, will reinitialize the vis after x seconds
utils.ping = function () {
	var time = +new Date();
	var timeout = 2 * 60 * 1000;
	var interval = setInterval(function () {
		if (new Date() - time > timeout) {
			//location.reload();
		}
	}, 1000);

	return function () {
		time = +new Date();
	}
}

utils.printkeywords = function (data) {
	var keywords = {};
	data.forEach(function (d) {
		d.keywords.forEach(function (d) {
			keywords[d] = 0;
		})
	})
	d3.keys(keywords).forEach(function (d) {
		console.log(d);
	})
}

utils.fullscreen = function () {
	document.fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.documentElement.webkitRequestFullScreen;

	function requestFullscreen(element) {
		if (element.requestFullscreen) {
			element.requestFullscreen();
		} else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if (element.webkitRequestFullScreen) {
			element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	}

	if (document.fullscreenEnabled) {
		requestFullscreen(document.documentElement);
	}
}

utils.clean = function (data, config) {

	data.forEach(function (d, i) {
		d.search = Object.keys(d).map(function (e) { return d[e] }).join(' - ').toUpperCase()
		d.i = i;
		d.keywords = _(d.keywords || "None")
			.chain()
			.split(config.delimiter || ",")
			.map(_.trim)
			.uniq()
			.filter(function (d) { return d !== "" })
			.map(function(d) {
				if(config.filter && config.filter.type === "hierarchical") {
					var split = d.split(":")
					return split.map(function(d,i) { 
						return split.slice(0,i+1).join(":")
					})
				} else {
					return d
				}
			})
			.flatten()
			.value()

		// for proper sorting
		d.keywords = d.keywords.map(function (d) {
			return d.charAt(0).toUpperCase() + d.slice(1);
		});

		d._year = d.year
		d._keywords = d.keywords

		// internal vars
		d.alpha = 1;
		d.active = 1;
		d.loaded = false;
		d.type = "image";
		d.page = 0
		d.scaleFactor = 0.9
		d.x = i;
		d.y = i;
		d.order = i;
	});

}

utils.simulateLargeDatasets = function (data) {
	Array.prototype.push.apply(data, _.clone(data, true))
	Array.prototype.push.apply(data, _.clone(data, true))
	Array.prototype.push.apply(data, _.clone(data, true).slice(0, 1036))
}

utils.nearest = function(x, y, best, node) {
    // mike bostock https://bl.ocks.org/mbostock/4343214
    var x1 = node.x1,
      y1 = node.y1,
      x2 = node.x2,
      y2 = node.y2;
    node.visited = true;
    //console.log(node, x , x1 , best.d);
    //return;
    // exclude node if point is farther away than best distance in either axis
    if (
      x < x1 - best.d ||
      x > x2 + best.d ||
      y < y1 - best.d ||
      y > y2 + best.d
    ) {
      return best;
    }
    // test point if there is one, potentially updating best
    var p = node.point;
    if (p) {
      p.scanned = true;
      var dx = p.x - x,
        dy = p.y - y,
        d = Math.sqrt(dx * dx + dy * dy);
      if (d < best.d) {
        best.d = d;
        best.p = p;
      }
    }
    // check if kid is on the right or left, and top or bottom
    // and then recurse on most likely kids first, so we quickly find a
    // nearby point and then exclude many larger rectangles later
    var kids = node.nodes;
    var rl = 2 * x > x1 + x2,
      bt = 2 * y > y1 + y2;
    if (kids[bt * 2 + rl]) best = utils.nearest(x, y, best, kids[bt * 2 + rl]);
    if (kids[bt * 2 + (1 - rl)])
      best = utils.nearest(x, y, best, kids[bt * 2 + (1 - rl)]);
    if (kids[(1 - bt) * 2 + rl])
      best = utils.nearest(x, y, best, kids[(1 - bt) * 2 + rl]);
    if (kids[(1 - bt) * 2 + (1 - rl)])
      best = utils.nearest(x, y, best, kids[(1 - bt) * 2 + (1 - rl)]);

    return best;
  }



  

if (!String.prototype.startsWith) {
	(function() {
		'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
		var defineProperty = (function() {
			// IE 8 only supports `Object.defineProperty` on DOM elements
			try {
				var object = {};
				var $defineProperty = Object.defineProperty;
				var result = $defineProperty(object, object, object) && $defineProperty;
			} catch(error) {}
			return result;
		}());
		var toString = {}.toString;
		var startsWith = function(search) {
			if (this == null) {
				throw TypeError();
			}
			var string = String(this);
			if (search && toString.call(search) == '[object RegExp]') {
				throw TypeError();
			}
			var stringLength = string.length;
			var searchString = String(search);
			var searchLength = searchString.length;
			var position = arguments.length > 1 ? arguments[1] : undefined;
			// `ToInteger`
			var pos = position ? Number(position) : 0;
			if (pos != pos) { // better `isNaN`
				pos = 0;
			}
			var start = Math.min(Math.max(pos, 0), stringLength);
			// Avoid the `indexOf` call if no match is possible
			if (searchLength + start > stringLength) {
				return false;
			}
			var index = -1;
			while (++index < searchLength) {
				if (string.charCodeAt(start + index) != searchString.charCodeAt(index)) {
					return false;
				}
			}
			return true;
		};
		if (defineProperty) {
			defineProperty(String.prototype, 'startsWith', {
				'value': startsWith,
				'configurable': true,
				'writable': true
			});
		} else {
			String.prototype.startsWith = startsWith;
		}
	}());
}