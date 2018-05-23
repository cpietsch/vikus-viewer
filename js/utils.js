// copyright christopher pietsch
// cpietsch@gmail.com
// @chrispiecom
// 2015-2018


window.utils = {};

utils.isMobile = function(){
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

utils.isSafari = function(){
	return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

utils.welcome = function(){

    if (window.console)
    {
        window.console.log('\n _   ________ ____  ______ \n| | / /  _/ //_/ / / / __/ \n| |/ // // ,< / /_/ /\ \ \n|___/___/_/|_|\____/___/_______ \n| | / /  _/ __/ | /| / / __/ _ \ \n| |/ // // _/ | |/ |/ / _// , _/ \n|___/___/___/ |__/|__/___/_/|_| \n')
    }	
}

utils.initConfig = function(config){

	// load infosidebar info.md
	d3.text(config.loader.info, function(text){ if(text) infoVue.info = text })

	document.title = config.project.name

	// puh thats nasty, lets call it oldschool...
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
	document.styleSheets[0].insertRule('.infobar a { color: ' + config.style.linkColor + '}', length);
	document.styleSheets[0].insertRule('.infobar .infobutton path { stroke: ' + config.style.fontColor + '}', length);
	document.styleSheets[0].insertRule('.sidebar .outer { background: ' + config.style.detailBackground + '}', length);
	document.styleSheets[0].insertRule('.searchbar input { background: ' + config.style.searchbarBackground + '}', length);
}

// stationary exhibition installations, will reinitialize the vis after x seconds
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

utils.clean = function(data,texte) {

	data.forEach(function(d,i){
		d.search = Object.keys(d).map(function(e) { return d[e] }).join(' - ').toUpperCase()
		d.i = i;
		d.id = d.imageid;
		d.alpha = 1;
		d.jahr = d.year;
		d.active = 1;
		d.loaded = false;
		d.type = "image";
		d.page = 0
		d.keywords = _(d.keywords)
		  .chain()
		  .split(",")
		  .map(_.trim)
		  .uniq()
		  .filter(function(d) { return d !== "" })
		  .value()

		// for sorting
		d.keywords = d.keywords.map(function(d){ 
			return d.charAt(0).toUpperCase() + d.slice(1);
		});

		d._year = d.year
		d._keywords = d.keywords

		d.scaleFactor = 0.9

		d.x = i;
		d.y = i;

		// d.tsne = d.tsne.split(" ").map(function(d){ return +d; });
		// d.grid = d.grid.split(" ").map(function(d){ return +d; });
		// d.rTSNE = -1* Math.atan2(d.tsne[0], d.tsne[1]);

		d.order = i;
	});

}

utils.simulateLargeDatasets = function(data){
	Array.prototype.push.apply(data, _.clone(data, true))
	Array.prototype.push.apply(data, _.clone(data, true))
	Array.prototype.push.apply(data, _.clone(data, true).slice(0,1036))
}

