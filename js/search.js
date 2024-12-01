// VIKUS Viewer Search Component
// Author: Christopher Pietsch
// Email: cpietsch@gmail.com
// 2015-2018

class SearchComponent {
  constructor() {
    this.container = d3.select(".searchbar");
    this.state = {
      isOpen: false
    };
    this.searchDebounceDelay = 300;
  }

  initialize() {
    this.setupSearchToggle();
    this.setupSearchInput();
  }

  setupSearchToggle() {
    this.container.select(".openbutton")
      .on("click", () => {
        this.toggleSearch();
      });
  }

  setupSearchInput() {
    const debouncedSearch = _.debounce(searchTerm => {
      tags.search(searchTerm.toUpperCase());
    }, this.searchDebounceDelay);

    this.container.select("input")
      .on("keyup", () => {
        const searchTerm = this.container.select("input").node().value;
        debouncedSearch(searchTerm);
      });
  }

  toggleSearch() {
    this.state.isOpen = !this.state.isOpen;
    this.container.classed("open", this.state.isOpen);
    d3.select(".tagcloud").classed("open", this.state.isOpen);

    if (this.state.isOpen) {
      this.container.select("input").node().focus();
    } else {
      this.resetSearch();
    }
  }

  resetSearch() {
    this.state.isOpen = false;
    this.container
      .classed("open", false)
      .select("input")
      .node().value = "";
    d3.select(".tagcloud").classed("open", false);
    tags.search("");
  }
}

// Initialize search functionality
function initializeSearch() {
  const searchComponent = new SearchComponent();
  return searchComponent;
}
