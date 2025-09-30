function Crossfilter() {

  // multipass anyone ?

  var fontsize = d3.scale.linear().range([8, 17])
  var options;
  var container;
  var filter = { }
  var labels = { }

  var lock = false;
  var data;
  var sortArrays = {
    // columnName: ["first", "second", "third"],
  }
  var search = ""
  var searchedData = []

  function addOrRemove(array, value) {
    array = array.slice();
    var index = array.indexOf(value);
    if (index > -1) {
      array.splice(index, 1);
    } else {
      array.push(value);
    }
    return array;
  }

  function tags() { }

  tags.init = function (_data, config) {
    // console.log("init tags", _data, config)
    data = _data;
    searchedData = _data;

    options = config.filter;
    filter = options.dimensions.map(d => d.source).reduce((acc, cur) => {
      acc[cur] = [];
      return acc;
    }, {});

    if(config.sortArrays) {
      sortArrays = config.sortArrays;
    }

    container = d3.select(".page").append("div").classed("crossfilter", true)

    tags.update()
  }

  tags.setFilterWords = function(words){

  }

  tags.getSearchTerm = function(){
    return search;
  }

  tags.updateDom = function updateDom(key, filteredData) {

    // if (key === "vorbesitzerin") {
    //   console.log("updateDom", key, filteredData)
    //   fontsize.domain(d3.extent(filteredData, function (d) { return d.size; }))
    // }

    if (sortArrays[key]) {
      var sorted = sortArrays[key]
      filteredData.sort(function (a, b) {
        return sorted.indexOf(a.key) - sorted.indexOf(b.key)
      })
    }

    var classLabel = key.replace(/[^a-z0-9]/gi, '_').toLowerCase()

    var filterContainer = container.selectAll("." + classLabel).data([key])

    var filterContainerEnter = filterContainer.enter()
      .append("div")
      .classed(classLabel, true)
    
    filterContainerEnter
      .append("div")
      .classed("label", true)
      .text(() => options.dimensions.find(d => d.source === key).label)
      .on("click", function (d) {
        lock = true;
        filter[key] = [];
        tags.filter();
        tags.update();
        lock = false;
      })

    filterContainerEnter
      .append("div")
      .classed("keys", true)

    var selection = filterContainer
      .select(".keys")
      .selectAll(".item")
      .data(filteredData, function (d) { return d.key; });

    selection
      .enter()
      .append("div")
      .classed("item", true)
      .text(function (d) {
        return d.key;
      })
      .on("click", function (d) {
        lock = true;
        filter[key] = addOrRemove(filter[key], d.key);
        tags.filter();
        tags.update();
        lock = false;
      })
      .on("mouseenter", function (d) {
        if (lock) return;
        lock = true;
        // make a deep copy of the filter object
        var tempFilter = JSON.parse(JSON.stringify(filter));
        tempFilter[key] = addOrRemove(tempFilter[key], d.key);
        tags.filter(tempFilter);
        tags.update(tempFilter);
        lock = false;
      })
      .on("mouseleave", function (d) {
        if (lock) return;
        lock = true;
        tags.filter();
        tags.update();
        lock = false;
      })
      // .filter(function (d) {
      //   return key === "scale"
      // })
      // .style("font-size", function (d) {
      //   return fontsize(d.size) + "px";
      // })

    selection.exit()
      // .remove()
      .classed("active", false)
      .classed("hide", true)
      // .filter(function (d) {
      //   return key === "scale"
      // })
      // .remove()
      // .style("font-size", function (d) {
      //   return "11px";
      // })


    selection
      .classed("active", function (d) {
        return filter[key].indexOf(d.key) > -1;
      })
      .classed("hide", false)
      // .filter(function (d) {
      //   return key === "scale"
      // })
      // .style("font-size", function (d) {
      //   return fontsize(d.size) + "px";
      // })
      // .sort(function (a, b) {
      //   return b.size - a.size;
      // })
  }

  tags.resize = function resize() {

  }

  tags.update = function update(tempFilter) {

    var filters = Object.entries(tempFilter || filter) //.filter(function (d) { return d[1].length; })

    // if (key) {
    //   filters = filters.filter(function (d) { return d[0] != key; })
    // }

    console.log("update", filters)

    for (var a = 0; a < filters.length; a++) {
      var filterCur = filters[a];
      var index = {}
      var otherFilter = filters.filter(function (d) { return d !== filterCur; })
      // console.log(filter, "otherFilter", otherFilter)
      for (var i = 0; i < searchedData.length; i++) {
        var d = searchedData[i];
        var hit = otherFilter.filter(function (otherFilter) {
          return otherFilter[1].length === 0 || otherFilter[1].indexOf(d[otherFilter[0]]) > -1;
        })

        if (hit.length == otherFilter.length) {
          index[d[filterCur[0]]] = ++index[d[filterCur[0]]] || 1;
        }
      }
      var filteredData = Object.keys(index)
        .map(function (d) { return { key: d, size: index[d] }; })
        .sort(function (a, b) { return b.size - a.size; })
        .filter(function (d) { return d.key != "" && d.key != "undefined"; });

      console.log("done", filterCur[0], filteredData)

      tags.updateDom(filterCur[0], filteredData)

    }
  }

  tags.reset = function () {
    // empty each key array in filter
    Object.keys(filter).forEach(function (key) {
      filter[key] = [];
    })
    search = "";  // Clear search term
    tags.filter();
    tags.update();
    
    // Update hash when resetting
    var hash = window.location.hash.slice(1);
    var params = new URLSearchParams(hash);
    params.delete("search");
    var newHash = params.toString().replaceAll("%2C", ",");
    if(newHash !== hash){
      window.location.hash = newHash;
    }
  }

  tags.filter = function (highlight) {
    console.log("update filter", filter, highlight)

    d3.select(".infobar").classed("sneak", true);

    searchedData = []

    var filters = Object.entries(highlight || filter).filter(function (d) { return d[1].length; })
    // console.log(filters)
    data.forEach(function (d) {
      var searched = search !== "" ? d.search.indexOf(search) > -1 : true
      var active = filters.filter(function (f) {
        return f[1].indexOf(d[f[0]]) > -1;
      }).length == filters.length && searched;

      if (searched) {
        searchedData.push(d)
      }

      if (highlight) {
        d.highlight = active;
      } else {
        d.active = d.highlight = active;
      }
    })
    canvas.highlight();
    if (!highlight) canvas.project();
  }

  tags.search = function (query) {

    search = query
    
    tags.filter();
    tags.update();
    
    // Update hash with search term for crossfilter
    var hash = window.location.hash.slice(1);
    var params = new URLSearchParams(hash);
    if(search && search !== ""){
      params.set("search", search);
    } else {
      params.delete("search");
    }
    var newHash = params.toString().replaceAll("%2C", ",");
    if(newHash !== hash){
      window.location.hash = newHash;
    }
  }


  return tags;
}