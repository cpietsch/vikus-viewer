class CanvasLayout {
  constructor() {
    this.columns = 4;
    this.rangeBand = 0;
    this.rangeBandImage = 0;
  }

  initGroupLayout() {
    const groupKey = state.mode.groupKey;
    console.log("initGroupLayout", groupKey);
    canvasDomain = d3
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

    timeDomain = canvasDomain.map(function (d) {
      return {
        key: d,
        values: timelineData
          .filter(function (e) {
            return d == e[groupKey];
          })
          .map(function (e) {
            e.type = "timeline";
            return e;
          }),
      };
    });

    timeline.init(timeDomain);

    x.domain(canvasDomain);
  }

  stackLayout(data, invert) {
    const groupKey = state.mode.groupKey;
    const years = d3
      .nest()
      .key(function (d) {
        return d[groupKey];
      })
      .entries(data);

    years.forEach(function (year) {
      const startX = x(year.key);
      const total = year.values.length;
      year.values.sort(function (a, b) {
        return b.keywords.length - a.keywords.length;
      });

      year.values.forEach(function (d, i) {
        const row = Math.floor(i / columns) + 2;
        d.ii = i;

        d.x = startX + (i % columns) * (rangeBand / columns);
        d.y = (invert ? 1 : -1) * (row * (rangeBand / columns));

        d.x1 = d.x * scale1 + imageSize / 2;
        d.y1 = d.y * scale1 + imageSize / 2;

        if (d.sprite.position.x == 0) {
          d.sprite.position.x = d.x1;
          d.sprite.position.y = d.y1;
        }

        if (d.sprite2) {
          d.sprite2.position.x = d.x * scale2 + imageSize2 / 2;
          d.sprite2.position.y = d.y * scale2 + imageSize2 / 2;
        }

        d.order = (invert ? 1 : 1) * (total - i);
      });
    });
  }

  stackYLayout(data, invert) {
    if (data.length == 0) return;
    const groupKey = state.mode.groupKey;
    const years = d3
      .nest()
      .key(function (d) {
        return d[groupKey];
      })
      .entries(data);

    const yExtent = d3.extent(data, function (d) {
      return +d[state.mode.y];
    });
    const yRange = [2 * (rangeBand / columns), height * 0.7];

    yExtent[0] = 0;

    const yscale = d3.scale
      .linear()
      .domain(yExtent)
      .range(yRange);

    years.forEach(function (year) {
      const startX = x(year.key);

      year.values.sort(function (a, b) {
        return b[state.mode.y] - a[state.mode.y];
      });

      year.values.forEach(function (d, i) {
        d.ii = i;

        d.x = startX + (i % columns) * (rangeBand / columns);
        d.y = (invert ? 1 : -1) * yscale(d[state.mode.y]);

        d.x1 = d.x * scale1 + imageSize / 2;
        d.y1 = d.y * scale1 + imageSize / 2;

        if (d.sprite.position.x == 0) {
          d.sprite.position.x = d.x1;
          d.sprite.position.y = d.y1;
        }

        if (d.sprite2) {
          d.sprite2.position.x = d.x * scale2 + imageSize2 / 2;
          d.sprite2.position.y = d.y * scale2 + imageSize2 / 2;
        }
      });
    });
  }

  projectTSNE() {
    const marginBottom = -height / 2.5;

    const inactive = data.filter(function (d) {
      return !d.active;
    });
    const inactiveSize = inactive.length;

    const active = data.filter(function (d) {
      return d.active;
    });

    const dimension = Math.min(width, height) * 0.8;

    inactive.forEach(function (d, i) {
      const r = dimension / 1.4 + Math.random() * 40;
      const a = -Math.PI / 2 + (i / inactiveSize) * 2 * Math.PI;

      d.x = r * Math.cos(a) + width / 2 + margin.left;
      d.y = r * Math.sin(a) + marginBottom;
    });

    active.forEach(function (d) {
      const factor = height / 2;
      const tsneEntry = tsneIndex[state.mode.title][d.id];
      if (tsneEntry) {
        d.x =
          tsneEntry[0] * dimension + width / 2 - dimension / 2 + margin.left;
        d.y = -1 * tsneEntry[1] * dimension;
      } else {
        d.alpha = 0;
        d.x = 0;
        d.y = 0;
        d.active = false;
      }
    });

    data.forEach(function (d) {
      d.x1 = d.x * scale1 + imageSize / 2;
      d.y1 = d.y * scale1 + imageSize / 2;

      if (d.sprite.position.x == 0) {
        d.sprite.position.x = d.x1;
        d.sprite.position.y = d.y1;
      }

      if (d.sprite2) {
        d.sprite2.position.x = d.x * scale2 + imageSize2 / 2;
        d.sprite2.position.y = d.y * scale2 + imageSize2 / 2;
      }
    });

    quadtree = Quadtree(data);
  }
}
