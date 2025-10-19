// canvas-layout.js
// Layout calculations and projections for Canvas module

function CanvasLayout(canvasConfig, canvasState, canvasData) {
  var x = d3.scale
    .ordinal()
    .rangeBands([canvasConfig.margin.left, canvasConfig.width + canvasConfig.margin.left], 0.2);

  var yscale = d3.scale.linear();

  function initGroupLayout(config, timeline) {
    var groupKey = canvasState.getMode().groupKey;
    console.log("initGroupLayout", groupKey);
    
    var data = canvasData.getData();
    var timelineData = canvasData.getTimelineData();
    
    var canvasDomain = d3
      .nest()
      .key(function (d) {
        return d[groupKey];
      })
      .entries(data.concat(timelineData))
      .sort(function (a, b) {
        return a.key - b.key;
      })
      .map(function (d) {
        return d.key;
      });

    var timeDomain = canvasDomain.map(function (d) {
      return {
        key: d,
        values: timelineData
          .filter(function (e) {
            return d == e[groupKey];
          }).map(function (e) {
            e.type = "timeline";
            return e;
          })
      };
    });

    canvasData.setCanvasDomain(canvasDomain);
    canvasData.setTimeDomain(timeDomain);

    timeline.init(timeDomain);
    x.domain(canvasDomain);
  }

  function stackLayout(data, invert) {
    var groupKey = canvasState.getMode().groupKey;
    var years = d3
      .nest()
      .key(function (d) {
        return d[groupKey];
      })
      .entries(data);

    years.forEach(function (year) {
      var startX = x(year.key);
      var total = year.values.length;
      year.values.sort(function (a, b) {
        return b.keywords.length - a.keywords.length;
      });

      year.values.forEach(function (d, i) {
        var row = Math.floor(i / canvasConfig.columns) + 2;
        d.ii = i;

        d.x = startX + (i % canvasConfig.columns) * (canvasConfig.rangeBand / canvasConfig.columns);
        d.y = (invert ? 1 : -1) * (row * (canvasConfig.rangeBand / canvasConfig.columns));

        d.x1 = d.x * canvasConfig.scale1 + canvasConfig.imageSize / 2;
        d.y1 = d.y * canvasConfig.scale1 + canvasConfig.imageSize / 2;

        if (d.sprite.position.x == 0) {
          d.sprite.position.x = d.x1;
          d.sprite.position.y = d.y1;
        }

        if (d.sprite2) {
          d.sprite2.position.x = d.x * canvasConfig.scale2 + canvasConfig.imageSize2 / 2;
          d.sprite2.position.y = d.y * canvasConfig.scale2 + canvasConfig.imageSize2 / 2;
        }

        d.order = (invert ? 1 : 1) * (total - i);
      });
    });
  }

  function stackYLayout(data, invert) {
    if (data.length == 0) return;
    
    var mode = canvasState.getMode();
    var groupKey = mode.groupKey;
    var years = d3
      .nest()
      .key(function (d) {
        return d[groupKey];
      })
      .entries(data);

    // y scale for state.mode.y (e.g. "kaufpreis")
    var yExtent = d3.extent(data, function (d) { return +d[mode.y]; });
    var yRange = [2 * (canvasConfig.rangeBand / canvasConfig.columns), canvasConfig.height * 0.7];

    yExtent[0] = 0;

    var yscale = d3.scale.linear()
      .domain(yExtent)
      .range(yRange);

    years.forEach(function (year) {
      var startX = x(year.key);

      year.values.sort(function (a, b) {
        return b[mode.y] - a[mode.y];
      });

      year.values.forEach(function (d, i) {
        d.ii = i;

        d.x = startX + (i % canvasConfig.columns) * (canvasConfig.rangeBand / canvasConfig.columns);
        d.y = (invert ? 1 : -1) * yscale(d[mode.y]);

        d.x1 = d.x * canvasConfig.scale1 + canvasConfig.imageSize / 2;
        d.y1 = d.y * canvasConfig.scale1 + canvasConfig.imageSize / 2;

        if (d.sprite.position.x == 0) {
          d.sprite.position.x = d.x1;
          d.sprite.position.y = d.y1;
        }

        if (d.sprite2) {
          d.sprite2.position.x = d.x * canvasConfig.scale2 + canvasConfig.imageSize2 / 2;
          d.sprite2.position.y = d.y * canvasConfig.scale2 + canvasConfig.imageSize2 / 2;
        }
      });
    });
  }

  function projectTSNE() {
    var data = canvasData.getData();
    var mode = canvasState.getMode();
    var tsneIndex = canvasData.getTsneIndex(mode.title);
    
    var marginBottom = -canvasConfig.height / 2.5;

    var inactive = data.filter(function (d) {
      return !d.active;
    });
    var inactiveSize = inactive.length;

    var active = data.filter(function (d) {
      return d.active;
    });

    var dimension = Math.min(canvasConfig.width, canvasConfig.height) * 0.8;

    inactive.forEach(function (d, i) {
      var r = dimension / 1.4 + Math.random() * 40;
      var a = -Math.PI / 2 + (i / inactiveSize) * 2 * Math.PI;

      d.x = r * Math.cos(a) + canvasConfig.width / 2 + canvasConfig.margin.left;
      d.y = r * Math.sin(a) + marginBottom;
    });

    active.forEach(function (d) {
      var tsneEntry = tsneIndex[d.id];
      if (tsneEntry) {
        d.x = tsneEntry[0] * dimension + canvasConfig.width / 2 - dimension / 2 + canvasConfig.margin.left;
        d.y = -1 * tsneEntry[1] * dimension;
      } else {
        d.alpha = 0;
        d.x = 0;
        d.y = 0;
        d.active = false;
      }
    });

    data.forEach(function (d) {
      d.x1 = d.x * canvasConfig.scale1 + canvasConfig.imageSize / 2;
      d.y1 = d.y * canvasConfig.scale1 + canvasConfig.imageSize / 2;

      if (d.sprite.position.x == 0) {
        d.sprite.position.x = d.x1;
        d.sprite.position.y = d.y1;
      }

      if (d.sprite2) {
        d.sprite2.position.x = d.x * canvasConfig.scale2 + canvasConfig.imageSize2 / 2;
        d.sprite2.position.y = d.y * canvasConfig.scale2 + canvasConfig.imageSize2 / 2;
      }
    });

    canvasData.updateQuadtree(data);
  }

  function split() {
    var data = canvasData.getData();
    var mode = canvasState.getMode();
    var layout = mode.y ? stackYLayout : stackLayout;
    
    var active = data.filter(function (d) {
      return d.active;
    });
    layout(active, false);
    
    var inactive = data.filter(function (d) {
      return !d.active;
    });
    layout(inactive, true);
    
    canvasData.updateQuadtree(data);
  }

  function makeScales(timeline) {
    x.rangeBands([canvasConfig.margin.left, canvasConfig.width + canvasConfig.margin.left], 0.2);
    canvasConfig.updateScales(x);
    timeline.rescale(canvasConfig.scale1);
  }

  function getX() {
    return x;
  }

  function getYScale() {
    return yscale;
  }

  return {
    initGroupLayout: initGroupLayout,
    stackLayout: stackLayout,
    stackYLayout: stackYLayout,
    projectTSNE: projectTSNE,
    split: split,
    makeScales: makeScales,
    getX: getX,
    getYScale: getYScale,
  };
}
