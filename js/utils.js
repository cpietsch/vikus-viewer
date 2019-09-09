// copyright christopher pietsch
// cpietsch@gmail.com
// @chrispiecom
// 2015-2018


window.utils = {};

utils.isMobile = function(){
  return (window.innerWidth
  || document.documentElement.clientWidth
  || document.body.clientWidth) < 500;
}

utils.isSafari = function(){
	return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

utils.welcome = function(){
	// who needs this fancy console styles
    if (window.console)
    {
        window.console.log('\n _   ________ ____  ______ \n| | / /  _/ //_/ / / / __/ \n| |/ // // ,< / /_/ /\ \ \n|___/___/_/|_|\____/___/_______ \n| | / /  _/ __/ | /| / / __/ _ \ \n| |/ // // _/ | |/ |/ / _// , _/ \n|___/___/___/ |__/|__/___/_/|_| \n')
    }	
}

utils.initConfig = function(config){

	// load infosidebar info.md
	d3.text(config.loader.info, function(text){ if(text) infoVue.info = text })

	// set window title
	document.title = config.project.name

	// puh thats kind of nasty, lets call it oldschool...
	var length = document.styleSheets[0].cssRules.length
	document.styleSheets[0].insertRule('.close::before { background-color: ' + config.style.fontColorActive + '}', length);
	document.styleSheets[0].insertRule('.close::after { background-color: ' + config.style.fontColorActive + '}', length);
	document.styleSheets[0].insertRule('.tag.active { color: ' + config.style.fontColorActive + '}', length);
	document.styleSheets[0].insertRule('.tag.active { background: ' + config.style.fontBackground + '}', length);
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
utils.ping = function(){
	var time = +new Date();
	var timeout = 2 * 60 * 1000;
	var interval = setInterval(function() {
		if(new Date() - time > timeout ){
			//location.reload();
		}
	}, 1000);

	return function(){
		time = +new Date();
	}
}

utils.printkeywords = function(data){
	var keywords = {};
	data.forEach(function(d){
		d.keywords.forEach(function(d){
		  keywords[d] = 0;
		})
	})
	d3.keys(keywords).forEach(function(d){
		console.log(d);
	})
}

utils.fullscreen = function(){
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

utils.clean = function(data) {

	data.forEach(function(d,i){
		d.search = Object.keys(d).map(function(e) { return d[e] }).join(' - ').toUpperCase()
		d.i = i;
		d.id = d._id;
		d.keywords = _(d._keywords)
		  .chain()
		  .split(",")
		  .map(_.trim)
		  .uniq()
		  .filter(function(d) { return d !== "" })
		  .map(function(d) {
				if(d.indexOf(":") === -1) return d
				else {
					var split = d.split(":")
					return split.map(function(d,i) { 
						return split.slice(0,i+1).join(":")
					})
				}
			})
			.flatten()
			.map(function(d){ 
				// for sorting
				return d.charAt(0).toUpperCase() + d.slice(1);
			})
			.value()


		d._year = d.year
		//d._keywords = d.keywords

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
		d.tsne = JSON.parse(d.tsne)
	});

	utils.initTsne(data)

}

utils.initTsne = function(clean){
	var xExtent = d3.extent(clean, function (d) {
		return d.tsne[0]
	})
	var yExtent = d3.extent(clean, function (d) {
		return d.tsne[1]
	})

	var x = d3.scale.linear().range([0, 1]).domain(xExtent)
	var y = d3.scale.linear().range([0, 1]).domain(yExtent)

	var colorScale = d3.scale.category10()

	clean.forEach(function (d) {
		d.tsne = [
			x(d.tsne[0]),
			y(d.tsne[1]),
			d.tsne[2],
			colorScale(d.tsne[2])
		]
	})

	// data.forEach(function(d){
	// 	var tsne = tsneIndex[d.id]
	// 	var color = tsne[3] || "#FFFFFF"
	// 	var intcolor =  parseInt(color.substring(1), 16)
	// 	// console.log(color, intcolor)
	// 	d.clusterSprite.tint = intcolor
	// })
}


utils.simulateLargeDatasets = function(data){
	Array.prototype.push.apply(data, _.clone(data, true))
	Array.prototype.push.apply(data, _.clone(data, true))
	Array.prototype.push.apply(data, _.clone(data, true).slice(0,1036))
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