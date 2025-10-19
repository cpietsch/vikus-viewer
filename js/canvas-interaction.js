// canvas-interaction.js
// User interactions (mouse, touch, keyboard) for Canvas module

function CanvasInteraction(canvasConfig, canvasState, canvasData) {
  var isInIframe = window.self !== window.top;

  function toScreenPoint(p) {
    var translate = canvasState.getTranslate();
    var scale = canvasState.getScale();
    var p2 = [0, 0];

    p2[0] = p[0] / scale - translate[0] / scale;
    p2[1] = p[1] / scale - canvasConfig.height - translate[1] / scale;

    return p2;
  }

  function mousemove(vizContainer, zoom, container, d) {
    if (canvasState.isTimelineHover()) return;

    var mouse = d3.mouse(vizContainer.node());
    var p = toScreenPoint(mouse);

    var distance = 200;

    var best = utils.nearest(
      p[0] - canvasConfig.imgPadding,
      p[1] - canvasConfig.imgPadding,
      {
        d: distance,
        p: null,
      },
      canvasData.getQuadtree()
    );

    var selectedImageDistance = best && best.d || 1000;
    canvasState.setSelectedImageDistance(selectedImageDistance);

    if (best && best.p && !canvasState.isZoomedToImage()) {
      var d = best.p;
      var translate = canvasState.getTranslate();
      var scale = canvasState.getScale();
      var center = [
        (d.x + canvasConfig.imgPadding) * scale + translate[0],
        (canvasConfig.height + d.y + canvasConfig.imgPadding) * scale + translate[1],
      ];
      zoom.center(center);
      canvasState.setSelectedImage(d);
    }

    container.style("cursor", function () {
      var selectedImage = canvasState.getSelectedImage();
      return selectedImageDistance < canvasConfig.cursorCutoff && selectedImage && selectedImage.active
        ? "pointer"
        : "default";
    });

    if (d3.event.shiftKey) {
      container.style("cursor", "copy");
    }
    if (d3.event.ctrlKey || d3.event.metaKey) {
      container.style("cursor", "crosshair");
      if(d3.event.altKey) {
        container.style("cursor", "cell");
      }
    }
  }

  function setupTouchEvents(vizContainer) {
    vizContainer.on("touchstart", function (d) {
      canvasState.setTouchstart(new Date() * 1);
    });
  }

  function setupClickEvent(vizContainer, addVector, addBorderToImage, resetZoom, zoomToImage) {
    var lastClick = 0;

    vizContainer.on("click", function () {
      var selectedImage = canvasState.getSelectedImage();
      var selectedImageDistance = canvasState.getSelectedImageDistance();

      if (d3.event.shiftKey) {
        console.log("shift click", selectedImage);
        addBorderToImage(selectedImage);
        return;
      }
      if (d3.event.ctrlKey || d3.event.metaKey) {
        console.log("ctrl/cmd click");
        var startNew = d3.event.altKey;
        addVector(startNew);
        return;
      }

      var clicktime = new Date() * 1 - lastClick;
      if (clicktime < 250) return;
      lastClick = new Date() * 1;

      console.log("click");
      if (canvasState.getSpriteClick()) {
        canvasState.setSpriteClick(false);
        return;
      }

      if (selectedImage && !selectedImage.id) return;
      if (canvasState.isDragging()) return;
      if (selectedImageDistance > canvasConfig.cursorCutoff) return;
      if (selectedImage && !selectedImage.active) return;
      if (canvasState.isTimelineHover()) return;

      canvasState.setUserInteraction(true);

      if (Math.abs(canvasConfig.zoomedToImageScale - canvasState.getScale()) < 0.1) {
        resetZoom();
      } else {
        zoomToImage(selectedImage, 1400 / Math.sqrt(Math.sqrt(canvasState.getScale())));
      }
    });
  }

  function setupContextMenu(vizContainer) {
    vizContainer.on("contextmenu", function () {
      if (window.top == window.self) d3.event.preventDefault();
    });
  }

  return {
    toScreenPoint: toScreenPoint,
    mousemove: mousemove,
    setupTouchEvents: setupTouchEvents,
    setupClickEvent: setupClickEvent,
    setupContextMenu: setupContextMenu,
  };
}
