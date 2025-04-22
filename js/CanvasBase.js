class CanvasBase {
  constructor() {
    this.margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
    this.width = window.innerWidth - this.margin.left - this.margin.right;
    this.height = window.innerHeight;
    this.scale = 1;
    this.translate = [0, 0];
    this.data = [];
  }

  getView() {
    const visibleItems = [];
    const invScale = 1 / this.scale;
    const viewLeft = -this.translate[0] * invScale;
    const viewTop = (-this.translate[1] * invScale) - this.height;
    const viewRight = viewLeft + this.width * invScale;
    const viewBottom = viewTop + this.height * invScale;

    this.data.forEach((d) => {
      const px = d.x;
      const py = d.y;
      const halfH = halfW = 0;

      const left = px - halfW;
      const right = px + halfW;
      const top = py - halfH;
      const bottom = py + halfH;

      if (
        left >= viewLeft &&
        right <= viewRight &&
        top >= viewTop &&
        bottom <= viewBottom
      ) {
        visibleItems.push(d);
      }
    });

    if (visibleItems.length === 0 || visibleItems.length == this.data.length) {
      return [];
    }

    const unique = new Set([
      mostLeft?.id,
      mostRight?.id,
      mostTop?.id,
      mostBottom?.id,
    ]);

    return Array.from(unique).filter((id) => id !== undefined && id !== null);
  }

  setView(ids, duration = 1000) {
    const items = this.data.filter((d) => ids.includes(d.id));
    if (!items.length) return;

    vizContainer.style("pointer-events", "none");
    zoom.center(null);
    state.zoomingToImage = true;

    const xs = items.map((d) => d.x);
    const ys = items.map((d) => d.y);

    const minX = d3.min(xs);
    const maxX = d3.max(xs);
    const minY = d3.min(ys);
    const maxY = d3.max(ys);

    const width = this.width;
    const height = this.height;

    const padding = rangeBandImage / 2;
    const boxWidth = maxX - minX + padding * 2;
    const boxHeight = maxY - minY + padding * 2;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const scale = 0.9 / Math.max(boxWidth / width, boxHeight / height);

    const translateTarget = [
      width / 2 - scale * (centerX + padding),
      height / 2 - scale * (height + centerY + padding),
    ];

    vizContainer
      .call(zoom.translate(this.translate).event)
      .transition()
      .duration(duration)
      .call(zoom.scale(scale).translate(translateTarget).event)
      .each("end", () => {
        state.zoomingToImage = false;
        vizContainer.style("pointer-events", "auto");
      });
  }

  resize() {
    if (!state.init) return;
    this.width = window.innerWidth - this.margin.left - this.margin.right;
    this.height = window.innerHeight;
    this.widthOuter = window.innerWidth;
    renderer.resize(this.width + this.margin.left + this.margin.right, this.height);
    zoom.size([this.width, this.height]);
    this.makeScales();
    this.project();
    this.resetZoom();
  }

  makeScales() {
    x.rangeBands([this.margin.left, this.width + this.margin.left], 0.2);

    rangeBand = x.rangeBand();
    rangeBandImage = rangeBand / columns;

    imgPadding = rangeBand / columns / 2;

    scale1 = imageSize / rangeBandImage;
    scale2 = imageSize2 / rangeBandImage;
    scale3 = imageSize3 / rangeBandImage;

    stage3.scale.x = 1 / scale1;
    stage3.scale.y = 1 / scale1;
    stage3.y = this.height;

    stage4.scale.x = 1 / scale2;
    stage4.scale.y = 1 / scale2;
    stage4.y = this.height;

    stage5.scale.x = 1 / scale3;
    stage5.scale.y = 1 / scale3;
    stage5.y = this.height;

    timeline.rescale(scale1);

    cursorCutoff = (1 / scale1) * imageSize * 0.48;
    zoomedToImageScale =
      (0.8 / (rangeBand / columns / this.width)) *
      (state.mode.type === "group" ? 1 : 0.5);
  }
}
