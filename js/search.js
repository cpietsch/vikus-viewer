function Search() {

	var container = d3.select(".searchbar");
	var state = {
		open: false,
		userOpened: false  // Track if user manually opened the search
	}
	
	function search() { }

	search.init = function(){
		container.select(".openbutton")
		  .on("click", function(){
		    state.open = !state.open
		    state.userOpened = state.open  // Track manual open/close
        container.classed("open", state.open)
		    d3.select(".tagcloud").classed("open", state.open)
        if(state.open){
          container.select("input").node().focus()
        } else {
          tags.search("")
          container.select("input").node().value = ""
          state.userOpened = false
        }
		  })

    var debounced = _.debounce(function(value) {
      tags.search(value.toUpperCase())
    },300)

    container.select("input")
      .on("keyup", function(s){
        var value = container.select("input").node().value
        debounced(value)
      })
	}

  search.reset = function (value) {
    // if input is still focused, do not close the search
    // this allows the user to clear the input without closing the search
    if (document.activeElement === container.select("input").node()) {
      
    } else {
      state.open = false
      state.userOpened = false
      d3.select(".tagcloud").classed("open", state.open)
    }
    container
      .classed("open", state.open)
      .select("input").node().value = ""
    
    tags.search("")
  }

  search.setSearchTerm = function(searchTerm) {
    if (searchTerm && searchTerm !== "") {
      state.open = true;
      state.userOpened = true;  // Mark as user opened when setting term
      container.classed("open", state.open);
      d3.select(".tagcloud").classed("open", state.open);
      container.select("input").node().value = searchTerm;
    } 
  }

	return search;
}