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

        utils.clean(data, config.delimiter);

        tags.init(data, config);
        search.init();
        canvas.init(data, timeline, config);

        if (config.loader.layouts) {
          initLayouts(config);
        } else {
          canvas.setMode("time");
        }

        LoaderSprites()
          .progress(function (textures) {
            Object.keys(textures).forEach(function (id) {
              data
                .filter(function (d) {
                  return d.id === id;
                })
                .forEach(function (d) {
                  d.sprite.texture = textures[id];
                });
            });
            canvas.wakeup();
          })
          //.finished() recalculate sizes
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
    });

  d3.select(".slidebutton").on("click", function () {
    var s = !d3.select(".sidebar").classed("sneak");
    d3.select(".sidebar").classed("sneak", s);
  });

  d3.select(".infobutton").on("click", function () {
    var s = !d3.select(".infobar").classed("sneak");
    d3.select(".infobar").classed("sneak", s);
  });

  d3.selectAll(".navi .button").on("click", function () {
    var that = this;
    var mode = d3.select(this).attr("data");
    canvas.setMode(mode);
    timeline.setDisabled(mode != "time");

    d3.selectAll(".navi .button").classed("active", function () {
      return that === this;
    });
  });

  function initLayouts(config) {
    d3.select(".navi").classed("hide", false);

    console.log(config.loader.layouts);

    config.loader.layouts.forEach((d, i) => {
      d.title = d.title.toLowerCase();
      if (d.title === "time") {
        canvas.setMode(d.title);
      } else {
        d3.csv(utils.makeUrl(baseUrl.path, d.url), function (tsne) {
          canvas.addTsneData(d.title, tsne, d.scale);
          if (i == 0) canvas.setMode(d.title);
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

    s.on("click", function (d) {
      canvas.setMode(d.title);
      d3.selectAll(".navi .button").classed(
        "active",
        (d) => d.title == canvas.getMode()
      );
    });
    d3.selectAll(".navi .button").classed(
      "active",
      (d) => d.title == config.loader.layouts[0].title
    );
  }
}

d3.select(".browserInfo").classed("show", utils.isMobile());
