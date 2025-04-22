class CanvasZoom {
  constructor() {
    this.zoom = d3.behavior
      .zoom()
      .scaleExtent([1, this.maxZoomLevel])
      .size([this.width, this.height])
      .on("zoom", this.zoomed.bind(this))
      .on("zoomend", this.zoomend.bind(this))
      .on("zoomstart", this.zoomstart.bind(this));

    this.maxZoomLevel = utils.isMobile() ? 5000 : 2500;
    this.zoomBarrier = 2;
  }

  zoomed() {
    this.translate = d3.event.translate;
    this.scale = d3.event.scale;
    if (!this.startTranslate) this.startTranslate = this.translate;
    this.drag = this.startTranslate && this.translate !== this.startTranslate;

    var x1 = (-1 * this.translate[0]) / this.scale;
    var x2 = x1 + this.widthOuter / this.scale;

    if (d3.event.sourceEvent != null) {
      if (x1 < 0) {
        this.translate[0] = 0;
      } else if (x2 > this.widthOuter) {
        this.translate[0] = (this.widthOuter * this.scale - this.widthOuter) * -1;
      }

      this.zoom.translate([this.translate[0], this.translate[1]]);

      x1 = (-1 * this.translate[0]) / this.scale;
      x2 = x1 + this.width / this.scale;
    }

    if (
      this.zoomedToImageScale != 0 &&
      this.scale > this.zoomedToImageScale * 0.9 &&
      !this.zoomedToImage &&
      this.selectedImage &&
      this.selectedImage.type == "image"
    ) {
      this.zoomedToImage = true;
      this.zoom.center(null);
      this.zoomedToImageScale = this.scale;
      this.hideTheRest(this.selectedImage);
      this.showDetail(this.selectedImage);
    }

    if (this.zoomedToImage && this.zoomedToImageScale * 0.8 > this.scale) {
      this.zoomedToImage = false;
      this.state.lastZoomed = 0;
      this.showAllImages();
      this.clearBigImages();
      this.detailContainer.classed("hide", true);
    }

    this.timeline.update(x1, x2, this.scale, this.translate, this.scale1);

    if (this.scale > this.zoomBarrier && !this.zoomBarrierState) {
      this.zoomBarrierState = true;
      d3.select(".tagcloud, .crossfilter").classed("hide", true);
      d3.select(".searchbar").classed("hide", true);
      d3.select(".infobar").classed("sneak", true);
    }
    if (this.scale < this.zoomBarrier && this.zoomBarrierState) {
      this.zoomBarrierState = false;
      d3.select(".tagcloud, .crossfilter").classed("hide", false);
      d3.select(".vorbesitzerinOuter").classed("hide", false);
      d3.select(".searchbar").classed("hide", false);
    }

    this.stage2.scale.x = d3.event.scale;
    this.stage2.scale.y = d3.event.scale;
    this.stage2.x = d3.event.translate[0];
    this.stage2.y = d3.event.translate[1];

    this.sleep = false;
  }

  zoomstart() {
    this.zooming = true;
    this.startTranslate = false;
    this.drag = false;
    this.startScale = this.scale;
  }

  zoomend() {
    this.drag = this.startTranslate && this.translate !== this.startTranslate;
    this.zooming = false;
    this.filterVisible();

    if (
      this.zoomedToImage &&
      this.selectedImage &&
      !this.selectedImage.big &&
      this.state.lastZoomed != this.selectedImage.id &&
      !this.state.zoomingToImage
    ) {
      this.loadBigImage(this.selectedImage, "zoom");
    }

    var center = this.toScreenPoint([window.innerWidth / 2, window.innerHeight / 2]);

    if (this.lastSourceEvent) {
      if (this.debounceHash) clearTimeout(this.debounceHash);
      this.debounceHash = setTimeout(() => {
        if (this.zooming) return;

        var hash = window.location.hash.slice(1);
        var params = new URLSearchParams(hash);

        const idsInViewport = this.getView();
        if (idsInViewport.length > 0) {
          params.set("ids", idsInViewport.join(","));
        } else if (params.has("ids") && params.get("ids").split(",").length <= 1) {
          return;
        } else {
          params.delete("ids");
        }
        window.location.hash = params.toString().replaceAll("%2C", ",");
        this.userInteraction = true;
      }, this.debounceHashTime);
    }
  }
}
