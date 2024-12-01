// VIKUS Viewer Timeline Component
// Author: Christopher Pietsch
// Email: cpietsch@gmail.com
// 2015-2018

class TimelineComponent {
  constructor() {
    // Scale configurations
    this.fontScaleYear = d3.scale.linear()
      .domain([1, 9])
      .range([7, 20])
      .clamp(true);

    this.fontScaleTimeline = d3.scale.linear()
      .domain([40, 8])
      .range([2, 10])
      .clamp(true);

    this.timelineVisibilityScale = d3.scale.threshold()
      .domain([3, 10, 20])
      .range(["none", "small", "middle", "large"]);

    // Component state
    this.isHovered = false;
    this.container = null;
    this.timeDomainData = null;
    this.fontSize = 1;
    this.isDisabled = false;
  }

  initialize(timelineDomain) {
    this.timeDomainData = timelineDomain;
    this.cleanupExistingTimeline();
    this.createTimelineContainer();
  }

  cleanupExistingTimeline() {
    if (!d3.select(".timeline").empty()) {
      d3.select(".timeline").remove();
    }
  }

  createTimelineContainer() {
    this.container = d3.select(".viz")
      .append("div")
      .classed("timeline", true);
    
    this.container.style(
      "transform",
      `translate(0px,${canvas.height() - 30}px)`
    );
  }

  updateScale(scale) {
    this.timeDomainData.forEach(timePoint => {
      timePoint.x = canvas.x(timePoint.key);
    });
    this.fontSize = this.fontScaleTimeline(scale);
  }

  setDisabled(disabled) {
    this.isDisabled = disabled;
    this.container.style("display", disabled ? "none" : "block");
  }

  update(viewportStart, viewportEnd, scale, translate) {
    if (this.isDisabled) return;

    this.updateTimelinePositions(viewportStart, viewportEnd, scale);
    this.updateTimelineVisuals(scale, translate);
    this.renderTimelineEntries();
  }

  updateTimelinePositions(viewportStart, viewportEnd, scale) {
    this.timeDomainData.forEach(timePoint => {
      timePoint.pos = (timePoint.x - viewportStart) * scale;
      timePoint.visible = this.isTimePointVisible(timePoint, scale);
    });
  }

  isTimePointVisible(timePoint, scale) {
    return timePoint.pos > -canvas.rangeBand() * scale && 
           timePoint.pos < canvas.width() + 100;
  }

  updateTimelineVisuals(scale, translate) {
    const timelineY = this.calculateTimelineY(scale, translate);
    const timelineClass = this.timelineVisibilityScale(scale * (this.fontSize / 2));

    this.container
      .attr("class", `timeline ${timelineClass}`)
      .style("font-size", `${this.fontSize * scale}px`)
      .style("transform", `translate3d(0px,${timelineY}px, 0px)`);
  }

  calculateTimelineY(scale, translate) {
    return canvas.height() * scale - 
           -1 * translate[1] - 
           canvas.rangeBandImage() * scale;
  }

  renderTimelineEntries() {
    const timelineEntries = this.container
      .selectAll(".container")
      .data(this.timeDomainData);

    this.handleTimelineEnter(timelineEntries);
    this.updateTimelineEntries(timelineEntries);
  }

  handleTimelineEnter(timelineEntries) {
    const enterSelection = timelineEntries.enter()
      .append("div")
      .classed("container", true)
      .on("mouseenter", () => {
        this.isHovered = true;
        canvas.zoom.center(null);
      })
      .on("mouseleave", () => {
        this.isHovered = false;
      });

    this.createYearLabel(enterSelection);
    this.createTimelineContent(enterSelection);
  }

  createYearLabel(container) {
    container.append("div")
      .classed("year", true)
      .text(d => d.key);
  }

  createTimelineContent(container) {
    const entries = container.append("div")
      .classed("entries", true)
      .selectAll(".entry")
      .data(d => d.values)
      .enter()
      .append("div")
      .classed("entry", true);

    this.createSmallView(entries);
    this.createMiddleView(entries);
    this.createLargeView(entries);
  }

  createSmallView(entries) {
    entries.append("div")
      .classed("small", true)
      .append("div")
      .classed("title", true)
      .text(d => d.titel);
  }

  createMiddleView(entries) {
    const middleView = entries.append("div")
      .classed("middle", true);

    middleView.append("div")
      .classed("title", true)
      .text(d => d.titel);

    middleView.append("div")
      .classed("text", true)
      .text(d => `${d.text}.`);
  }

  createLargeView(entries) {
    const largeView = entries.append("div")
      .classed("large", true);

    largeView.append("div")
      .classed("title", true)
      .text(d => d.titel);

    largeView.append("div")
      .classed("text", true)
      .html(d => `${d.text}.<br><br>${d.extra}`);
  }

  updateTimelineEntries(timelineEntries) {
    timelineEntries
      .style("transform", d => `translate3d(${parseInt(d.pos)}px,0px,0px)`)
      .style("height", d => `${canvas.rangeBand() * scale}px`)
      .style("width", d => `${canvas.rangeBand() * scale}px`)
      .style("display", (d, i) => {
        const width = canvas.rangeBand() * scale;
        const shouldShow = width / d.key.length > 5 || i % 2 == 0;
        return shouldShow && d.visible ? "block" : "none";
      });

    timelineEntries.select(".year")
      .style("font-size", `${this.fontScaleYear(scale)}px`);
  }
}

// Initialize timeline functionality
function initializeTimeline() {
  const timelineComponent = new TimelineComponent();
  return timelineComponent;
}
