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
var timeline;
var config;

if (Modernizr.webgl && !utils.isMobile()) {
  init();
}


function init() {
  canvas = Canvas();
  search = Search();
  timeline = Timeline();
  ping = utils.ping();

  var baseUrl = utils.getDataBaseUrl();
  var makeUrl = utils.makeUrl;

  console.log(baseUrl);

  d3.json(baseUrl.config || "data/config.json", function (config) {
    config.baseUrl = baseUrl;
    utils.initConfig(config);

    Loader(makeUrl(baseUrl.path, config.loader.timeline)).finished(function (timeline) {
      Loader(makeUrl(baseUrl.path, config.loader.items)).finished(function (data) {
        console.log(data);

        utils.clean(data, config);
        
        if(config.filter && config.filter.type === "crossfilter") {
          tags = Crossfilter();
        } else if(config.filter && config.filter.type === "hierarchical") {
          tags = TagsHierarchical();
        } else {
          tags = Tags();
        }
        tags.init(data, config);
        search.init();
        canvas.init(data, timeline, config);

        if (config.loader.layouts) {
          initLayouts(config);
        } else {
          canvas.setMode({
            title: "Time",
            type: "group",
            groupKey: "year"
          })
        }

        const params = new URLSearchParams(window.location.hash.slice(1));
        if (params.get('ui') === '0') deactivateUI();      

        window.onhashchange = function () {
          var hash = window.location.hash.slice(1);
          var params = new URLSearchParams(hash);
          if(params.get('ui') === '0') deactivateUI();
          canvas.onhashchange();
        }
        
		if (params.has("filter")) {
		  var filter = params.get("filter").split(",")
		  tags.setFilterWords(filter)
		}
		
        //setTimeout(function () {
          // canvas.setView("[GS_2000_28_GM,VII_59_777_x]");
          // canvas.setView("['GS_98_2_GM', 'VII_60_527_x', 'SM_2012-0158', 'VII_59_483_x', 'VII_60_411_x', 'VII_60_230_x']");
          //canvas.setView("['GEM_88_4', 'GS_08_5_GM', 'GEM_89_24', 'VII_59_433_x', 'VII_59_749_x', 'VII_60_111_x', 'VII_60_286_x', 'GEM_89_11', 'GS_2000_28_GM', 'VII_59_777_x']")
        //}, 200);

        // debug zoom to image
        // setTimeout(function () {
        //   var idx = 102
        //   canvas.zoomToImage(data[idx], 100)
        // }, 100);

        // Create a lookup map to handle multiple entries with same ID

        const idToItemsMap = new Map();
        data.forEach(d => {
          if (d.sprite) { // Ensure sprite exists
            if (!idToItemsMap.has(d.id)) {
              idToItemsMap.set(d.id, []);
            }
            idToItemsMap.get(d.id).push(d);
          }
        });

        LoaderSprites()
          .progress(function (textures) {      
            Object.keys(textures).forEach(id => {
              const items = idToItemsMap.get(id);
              if (items) {
                items.forEach(item => {
                  item.sprite.texture = textures[id];
                });
              }
            });
            canvas.wakeup();
          })
          .finished(function () {
            canvas.onhashchange();
          })
          .load(makeUrl(baseUrl.path, config.loader.textures.medium.url));
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
      if (d3.event.keyCode != 27) return;
      search.reset();
      tags.reset();
      canvas.split();
      window.location.hash = "";
    });

  d3.select(".filterReset").on("click", function () {
    canvas.resetZoom(function () {
      tags.reset();
      //canvas.split();
    })
  });
  d3.select(".filterReset").on("dblclick", function () {
    console.log("dblclick");
    //location.reload();
  });

  d3.select(".slidebutton").on("click", function () {
    var s = !d3.select(".sidebar").classed("sneak");
    d3.select(".sidebar").classed("sneak", s);
  });

  d3.select(".infobutton").on("click", function () {
    var s = !d3.select(".infobar").classed("sneak");
    d3.select(".infobar").classed("sneak", s);
  });

  // d3.selectAll(".navi .button").on("click", function () {
  //   var that = this;
  //   var mode = d3.select(this).attr("data");
  //   canvas.setMode(mode);
  //   timeline.setDisabled(mode != "time");

  //   d3.selectAll(".navi .button").classed("active", function () {
  //     return that === this;
  //   });
  // });

  function deactivateUI() {
    d3.selectAll(".navi").style("display", "none");
    d3.selectAll(".searchbar").style("display", "none");
    d3.selectAll(".infobar").style("display", "none");
  }

  function initLayouts(config) {
    d3.select(".navi").classed("hide", false);

    //console.log(config.loader.layouts);
    config.loader.layouts.forEach((d, i) => {
      // d.title = d.title.toLowerCase();
      // legacy fix for time scales
      if (!d.type && !d.url) {
        d.type = "group"
        d.groupKey = "year"
      }
      if (d.type === "group" && i == 0) {
        canvas.setMode(d);
      } else if (d.url) {
        d3.csv(utils.makeUrl(baseUrl.path, d.url), function (tsne) {
          canvas.addTsneData(d.title, tsne, d.scale);
          if (i == 0) canvas.setMode(d);
        });
      }
    });

    if (config.loader.layouts.length == 1) {
      d3.select(".navi").classed("hide", true);
    }

    var s = d3.select(".navi").selectAll(".button").data(config.loader.layouts);
    s.enter()
      .append("div")
      .classed("button", true)
      .classed("space", (d) => d.space)
      .text((d) => d.title);

    s.on("click", function (d) { utils.setMode(d.title, interaction=true) });
    d3.selectAll(".navi .button").classed(
      "active",
      (d) => d.title == config.loader.layouts[0].title
    );
  }
}

utils.setMode = function(title, interaction = false) {
  console.log("setMode", title);
  if(utils.config.loader.layouts === undefined) return;
  var currentMode = canvas.getMode().title;
  if(title === undefined){
    title = utils.config.loader.layouts[0].title;
  }
  if(currentMode === title) return;
  var layout = utils.config.loader.layouts.find((d) => d.title == title);
  canvas.setMode(layout);
  d3.selectAll(".navi .button").classed(
    "active",
    (d) => d.title == title
  );
  updateHash("mode", layout.title, interaction ? ["ids"] : undefined);
}

function updateHash(name, value, clear = undefined) {
  console.log("updateHashtags", name, value);
  var hash = window.location.hash.slice(1);
  if(clear && clear.length === 0) hash = "";
  var params = new URLSearchParams(hash);
  if(clear && clear.length > 0) {
    clear.forEach((d) => params.delete(d));
  }

  params.set(name, value);
  // if value is am array and is empty remove the filter
  if(typeof value === "object" && value.length === 0) params.delete(name);
  if(typeof value === "string" && value === "") params.delete(name);
  
  var newHash = params.toString().replaceAll("%2C", ",")

  if(newHash !== hash){
    window.location.hash = params.toString().replaceAll("%2C", ",")
    // window.history.pushState({}, "", `#${params.toString().replaceAll("%2C", ",")}`);
  }
}

utils.updateHash = updateHash;

