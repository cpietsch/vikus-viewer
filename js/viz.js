
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
var cloud;
var list;
var search;
var c = console.log.bind(console);
var ping;
var logger = Logger().register("vis");
var feedbacked = false;

logger.log({ action: "enter vis" });

// 
// if(utils.isMobile()){
//   logger.log({ action: "mobile" }).sync();
//   //alert("come back in some weeks");
// } else {
  if (Modernizr.webgl) {
      init();
    } else {
      logger.log({ action: "noWebGL" }).sync();
      alert("sorry you need webGL") 
    }
// }

function init() {

    cloud = myTagCloud();
    list = myListView();
    search = mySearch();
    ping = utils.ping();

    logger.log({ action: "load" });

    d3.json("data/config.json", function(config) {

      utils.initConfig(config)
      
      d3.csv(config.loader.timeline, function(timeline) {
          Loader(config.loader.items).finished(function(data) {

              window.data = data;
              window.config = config

              utils.clean(data, [], []);

              cloud.init(data);
              search.init();
        
              data.forEach(function (d) {
                  imagesMap.set(d.id, PIXI.Texture.WHITE)
              })
              list.init(data, timeline);


              cloud.mouseenterCallback(function(d) {
                  list.highlight(d);
              })

              cloud.mouseclickCallback(function(d) {
                  list.project(d);
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
                })
                .load(config.loader.textures.medium.url)
         
          });
        });
    });

    d3.select(window)
        .on("resize", function() {
          if(list !== undefined && cloud !== undefined) {
            clearTimeout(window.resizedFinished);
            window.resizedFinished = setTimeout(function() {
                list.resize();
                cloud.resize();
                logger.log({
                    action: "resize",
                    target: window.innerWidth + "," + window.innerHeight
                });
            }, 250);
          }
        })

    

}


d3.select(".slidebutton")
  .on("click", function(){
    var s = !d3.select(".sidebar").classed("sneak");
    d3.select(".sidebar").classed("sneak", s);
    logger.log({ action: !s ? "open" : "close" , target: "detail" });
  })

d3.select(".infobutton")
  .on("click", function(){
    var s = !d3.select(".infobar").classed("sneak");
    d3.select(".infobar").classed("sneak", s)
    logger.log({ action: !s ? "open" : "close" , target: "info" });
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

