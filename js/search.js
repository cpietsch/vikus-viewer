function Search() {

	var container = d3.select(".searchbar");
	var state = {
		open: false
	}
	
	function search() { }

	search.init = function(){
		container.select(".openbutton")
		  .on("click", function(){
		    state.open = !state.open
        container.classed("open", state.open)
		    d3.select(".tagcloud").classed("open", state.open)
        if(state.open){
          container.select("input").node().focus()
        } else {
          cloud.search("")
          container.select("input").node().value = ""
        }
		  })

    var debounced = _.debounce(function(value) {
      cloud.search(value.toUpperCase())
    },300)

    container.select("input")
      .on("keyup", function(s){
        var value = container.select("input").node().value
        // if(value === ""){

        // }
        // if(value.length < 3) return
        debounced(value)
      })
	}

  search.search = function (value) {
    
  }

	return search;
}