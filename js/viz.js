
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
var imagesMap = d3.map([]);;
var imagesMap2 = d3.map([]);
var tags;
var canvas;
var search;
var c = console.log.bind(console);
var ping;
var feedbacked = false;


if (Modernizr.webgl) {
  init();
} else {
  alert("sorry you need webGL") 
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

              window.data = data;
              window.config = config

              utils.clean(data);

              tags.init(data);
              search.init();
        
              data.forEach(function (d) {
                  imagesMap.set(d.id, PIXI.Texture.WHITE)
              })
              canvas.init(data, timeline);


              tags.mouseenterCallback(function(d) {
                  canvas.highlight(d);
              })

              tags.mouseclickCallback(function(d) {
                  canvas.project(d);
              })

              LoaderSprites()
                .progress(function(textures){
                  for(var id in textures) {
                    data
                      .filter(function (d) { return d.id === id })
                      .forEach(function(d) { 
                        var texture = textures[id]
                        d.sprite.texture = texture

                      })
                  }
                  canvas.wakeup()
                })
                .load(config.loader.textures.medium.url)
         
          });
        });
    });

    d3.select(window)
        .on("resize", function() {
          if(canvas !== undefined && tags !== undefined) {
            clearTimeout(window.resizedFinished);
            window.resizedFinished = setTimeout(function() {
                canvas.resize();
                tags.resize();
            }, 250);
          }
        })
        .on("keydown", function(e) {
          if(d3.event.keyCode != 27) return
          search.reset();
          tags.reset();
          canvas.split();
        })
}


d3.select(".slidebutton")
  .on("click", function(){
    var s = !d3.select(".sidebar").classed("sneak");
    d3.select(".sidebar").classed("sneak", s);
  })

d3.select(".infobutton")
  .on("click", function(){
    var s = !d3.select(".infobar").classed("sneak");
    d3.select(".infobar").classed("sneak", s)
  })



var browserInfo = d3.select(".browserInfo");

if(utils.isMobile()){
    browserInfo
      .text("This visualization is not optimized for mobiles. Please come back on a Computer.")
      .on("click", function(){ browserInfo.remove(); })
      .transition()
      .delay(7000)
      .each("end", function(){
        d3.select(this).classed("show", false).remove();
      })
      
}

var infoscroll = d3.select('.infobar .outer').node();
Ps.initialize(infoscroll);

