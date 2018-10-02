//                            ,--.                                     
//                ,---,   ,--/  /|               .--.--.               
//        ,---.,`--.' |,---,': / '         ,--, /  /    '.             
//       /__./||   :  ::   : '/ /        ,'_ /||  :  /`. /             
//  ,---.;  ; |:   |  '|   '   ,    .--. |  | :;  |  |--`              
// /___/ \  | ||   :  |'   |  /   ,'_ /| :  . ||  :  ;_                
// \   ;  \ ' |'   '  ;|   ;  ;   |  ' | |  . . \  \    `.             
//  \   \  \: ||   |  |:   '   \  |  | ' |  | |  `----.   \            
//   ;   \  ' .'   :  ;|   |    ' :  | | :  ' ;  __ \  \  |            
//    \   \   '|   |  ''   : |.  \|  ; ' |  | ' /  /`--'  /            
//     \   `  ;'   :  ||   | '_\.':  | : ;  ; |'--'.     /             
//      :   \ |;   |.' '   : |    '  :  `--'   \ `--'---'              
//       '---" '---'   ;   |,'    :  ,      .-./                       
//                     '---'       `--`----'                           
//                ,---,    ,---,.           .---.    ,---,.,-.----.    
//        ,---.,`--.' |  ,'  .' |          /. ./|  ,'  .' |\    /  \   
//       /__./||   :  :,---.'   |      .--'.  ' ;,---.'   |;   :    \  
//  ,---.;  ; |:   |  '|   |   .'     /__./ \ : ||   |   .'|   | .\ :  
// /___/ \  | ||   :  |:   :  |-, .--'.  '   \' .:   :  |-,.   : |: |  
// \   ;  \ ' |'   '  ;:   |  ;/|/___/ \ |    ' ':   |  ;/||   |  \ :  
//  \   \  \: ||   |  ||   :   .';   \  \;      :|   :   .'|   : .  /  
//   ;   \  ' .'   :  ;|   |  |-, \   ;  `      ||   |  |-,;   | |  \  
//    \   \   '|   |  ''   :  ;/|  .   \    .\  ;'   :  ;/||   | ;\  \ 
//     \   `  ;'   :  ||   |    \   \   \   ' \ ||   |    \:   ' | \.' 
//      :   \ |;   |.' |   :   .'    :   '  |--" |   :   .':   : :-'   
//       '---" '---'   |   | ,'       \   \ ;    |   | ,'  |   |.'     
//                     `----'          '---"     `----'    `---'       


// christopher pietsch
// @chrispiecom
// 2015-2018


utils.welcome();

var data;
var tags;
var canvas;
var search;
var ping;

if (Modernizr.webgl && !utils.isMobile()) {
		init();
}


function init() {

		tags = Tags();
		canvas = Canvas();
		search = Search();
		timeline = Timeline()
		ping = utils.ping();

		d3.json("data/config.json", function(config) {

				utils.initConfig(config)

				d3.csv(config.loader.timeline, function(timeline) {
						Loader(config.loader.items).finished(function(data) {

								utils.clean(data);

								tags.init(data, config);
								search.init();
								canvas.init(data, timeline, config);

								LoaderSprites()
										.progress(function(textures) {
												Object.keys(textures).forEach(function(id) {
														data
																.filter(function(d) { return d.id === id })
																.forEach(function(d) {
																		d.sprite.texture = textures[id]
																})
												})
												canvas.wakeup()
										})
										.load(config.loader.textures.medium.url)
						});
				});
		});

		d3.select(window)
				.on("resize", function() {
						if (canvas !== undefined && tags !== undefined) {
								clearTimeout(window.resizedFinished);
								window.resizedFinished = setTimeout(function() {
										canvas.resize();
										tags.resize();
								}, 250);
						}
				})
				.on("keydown", function(e) {
						if (d3.event.keyCode != 27) return
						search.reset();
						tags.reset();
						canvas.split();
				})

		d3.select(".slidebutton")
				.on("click", function() {
						var s = !d3.select(".sidebar").classed("sneak");
						d3.select(".sidebar").classed("sneak", s);
				})

		d3.select(".infobutton")
				.on("click", function() {
						var s = !d3.select(".infobar").classed("sneak");
						d3.select(".infobar").classed("sneak", s)
				})
}

d3.select(".browserInfo").classed("show", utils.isMobile());