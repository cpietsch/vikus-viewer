// copyright christopher pietsch
// cpietsch@gmail.com
// @chrispiecom
// 2015-2018


window.utils = {};

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

utils.clean = function (data, separator) {

	data.forEach(function (d, i) {
		d.search = Object.keys(d).map(function (e) { return d[e] }).join(' - ').toUpperCase()
		d.i = i;
		d.keywords = _(d.keywords || "None")
			.chain()
			.split(separator || ",")
			.map(_.trim)
			.uniq()
			.filter(function (d) { return d !== "" })
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

