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

	d3.json("data/config.json", function (config) {

		utils.initConfig(config)

		Loader(config.loader.timeline).finished(function (timelinedata) {
			Loader(config.loader.items).finished(function (data) {

				utils.clean(data);

				tags.init(data, config);
				search.init();
				canvas.init(data, timelinedata, config);

				if (config.loader.layouts) {
					d3.select(".navi").classed("hide", false)

					config.loader.layouts.forEach(d => {
						d3.csv(d.url, function (tsne) {
							canvas.addTsneData(d.name, tsne)
						})
					})

					var layouts = config.loader.layouts
					layouts.unshift({ name: "time", title: "zeit" })
					
					d3.select(".navi")
						.selectAll('.button')
						.data(config.loader.layouts)
						.enter()
						.append('div')
						.classed("button", true)
						.classed("active", d => d.name == canvas.getMode())
						.text(d => d.title)
						.attr("data", d => d.name)
						.on("click", function (d) {
							canvas.setMode(d.name);
							timeline.setDisabled(d.name != "time");
							d3.selectAll(".navi .button")
								.classed("active", d => d.name == canvas.getMode())
						})
				}

				LoaderSprites()
					.progress(function (textures) {
						Object.keys(textures).forEach(function (id) {
							data
								.filter(function (d) {
									return d.id === id
								})
								.forEach(function (d) {
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
		.on("resize", function () {
			if (canvas !== undefined && tags !== undefined) {
				clearTimeout(window.resizedFinished);
				window.resizedFinished = setTimeout(function () {
					canvas.resize();
					tags.resize();
				}, 250);
			}
		})
		.on("keydown", function (e) {
			if (d3.event.keyCode != 27) return
			search.reset();
			tags.reset();
			canvas.split();
		})

	d3.select(".slidebutton")
		.on("click", function () {
			var s = !d3.select(".sidebar").classed("sneak");
			d3.select(".sidebar").classed("sneak", s);
		})

	d3.select(".infobutton")
		.on("click", function () {
			var s = !d3.select(".infobar").classed("sneak");
			d3.select(".infobar").classed("sneak", s)
		})

	
}

d3.select(".browserInfo").classed("show", utils.isMobile());