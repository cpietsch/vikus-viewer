// christopher pietsch
// cpietsch@gmail.com
// tweet me @chrispiecom
// 2015-2016


function Loader(url){
  var width = 100,
      height = 100,
      twoPi = 2 * Math.PI,
      progress = 0,
      total = 1308573, // must be hard-coded if server doesn't report Content-Length
      formatPercent = d3.format(".0%");

  var arc = d3.svg.arc()
      .startAngle(0)
      .innerRadius(25)
      .outerRadius(30);

  var loader = {};
  var finished = function(){};

  loader.finished = function(value) {
    if (!arguments.length) return finished;
    finished = value;
    return loader;
  };
  loader.load = function(){
    var svg = d3.select("body").append("svg")
      .classed("loader", true)
        .attr("width", width)
        .attr("height", height)

    var container = svg
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var meter = container.append("g")
        .attr("class", "progress-meter");

    meter.append("path")
        .attr("class", "background")
        .attr("d", arc.endAngle(twoPi));

    var foreground = meter.append("path")
        .attr("class", "foreground");

    var text = meter.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em");

    d3.csv(url)
        .on("progress", function() {
          total = d3.event.total;
          if(total == 0) total = 80333701;
  
          var i = d3.interpolate(progress, d3.event.loaded / total );
          d3.transition().tween("progress", function() {
            return function(t) {
              progress = i(t);
              foreground.attr("d", arc.endAngle(twoPi * progress));
              text.text(formatPercent(progress));
            };
          });
        })
        .on("load", function(data) {
          finished(data);
          svg.remove();
        })
        .get();
  };

  loader.load(url);

  return loader;
}