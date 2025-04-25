// christopher pietsch
// cpietsch@gmail.com
// 2015-2018


function Tags() {
  var margin = {top: 10, right: 20, bottom: 20, left: 10},
      width = window.innerWidth - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

  var container;
  var keywordsScale = d3.scale.linear();
  var keywordsOpacityScale = d3.scale.linear();
  var keywords = [];
  var wordBackground;
  var keywordsNestGlobal;
  var sortKeywords = "alphabetical";

  // var filterWords = ["Potsdam"];
  var filterWords = [];
  var data, filteredData;
  var activeWord;

  var x = d3.scale.ordinal()
    .rangeBands([0, width]);

  var sliceScale = d3.scale.linear().domain([1200,5000]).range([50, 200])

  var lock = false;
  var state = { init: false, search: '' };

  function tags(){ }

  tags.state = state

  tags.init = function(_data, config) {
    data = _data;

    container = d3.select(".page").append("div")
      .style("width", width + margin.left + margin.right)
      .style("height", height + margin.top + margin.bottom)
      .classed("tagcloud", true)
      .style("color", config.style.fontColor)
      .append("div")
      //.attr("transform", "translate("+ margin.left +","+ margin.top +")")
      
    if (config.sortKeywords != undefined) {
      sortKeywords = config.sortKeywords;
    }

    tags.update();
  }

  tags.resize = function(){
    if(!state.init) return;
    
    width = window.innerWidth - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    container
      .style("width", width + margin.left + margin.right)
      .style("height", height + margin.top + margin.bottom)

    x.rangeBands([0, width]);

    tags.update();
  }

  tags.filter = function(filterWords,highlight){
    data.forEach(function(d) {
      var search = state.search !== "" ? d.search.indexOf(state.search) > -1 : true
      var matches = filterWords.filter(function(word){
        return d.keywords.indexOf(word) > -1;
      });
      if(highlight) d.highlight = (matches.length == filterWords.length && search);
      else d.active = (matches.length == filterWords.length && search);
    });

    // var anzahl = data.filter(function(d){ return d.active; }).length;
    // c("anzahl", anzahl)

    if(!highlight){
      console.log("filter", filterWords)
    }
    
  }

  tags.update = function() {

    tags.filter(filterWords);

    var keywords = [];
    // var topographisch = [];
    data.forEach(function(d) {
      if(d.active){
        d.keywords.forEach(function(keyword) {
          keywords.push({ keyword: keyword, data: d });
        })
      }
    });

  keywordsNestGlobal =  d3.nest()
      .key(function(d) { return d.keyword; })
      .rollup(function(d){
        return d.map(function(d){ return d.data; });
      })
      .entries(keywords)
      .sort(function(a,b){
        return b.values.length - a.values.length;
      })

  var sliceNum = parseInt(sliceScale(width));

  // c("num",sliceNum)

   var keywordsNest = keywordsNestGlobal
      .slice(0,sliceNum);

    if (sortKeywords == "alphabetical") {
      keywordsNest = keywordsNest.sort(function(a,b){
        return d3.ascending(a.key[0], b.key[0]);
      });
    } else if (sortKeywords == "alfabetical-reverse") {
      keywordsNest = keywordsNest.sort(function(a,b){
        return d3.descending(a.key[0], b.key[0]);
      });
    } else if (sortKeywords == "count") {
      keywordsNest = keywordsNest.sort(function(a,b){
        return d3.descending(a.values.length, b.values.length);
      });
    } else if (sortKeywords == "count-reverse") {
      keywordsNest = keywordsNest.sort(function(a,b){
        return d3.ascending(a.values.length, b.values.length);
      });
    } else if (Array.isArray(sortKeywords)) {
      // compare keywords as lower case in case of mismatch
      sortKeywords = sortKeywords.map(function (d) {
			  return d.toLowerCase();
      });
      keywordsNest = keywordsNest.sort(function(a,b){
        var indexA = sortKeywords.indexOf(a.key.toLowerCase());
        var indexB = sortKeywords.indexOf(b.key.toLowerCase());
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    // c("keywordsNest", keywordsNest);

    var keywordsExtent = d3.extent(keywordsNest, function (d) {
      return d.values.length;
    });


    keywordsScale
      .domain(keywordsExtent)
      .range([10,20]);

    if(keywordsExtent[0]==keywordsExtent[1]) keywordsScale.range([15,15])


    keywordsOpacityScale
      .domain(keywordsExtent)
      .range([0.2,1]);

    layout(keywordsNest);
    tags.draw(keywordsNest);
   
  }

  function layout(data){
    var p = 1.8;
    var p2 = 1;
    var x0 = 0;

    data.forEach(function(d){
      d.x = x0 + keywordsScale(d.values.length)*p +p2;
      x0 += keywordsScale(d.values.length)*p;
    })
  };

  function getTranslateForList(data){
    var w = _.last(data).x + 100;
    return width/2 - w/2;
  }

  tags.draw = function(words) {
    // c(words)   

    var select = container
      .selectAll(".tag")
        .data(words, function(d){ return d.key; })

    select
      .classed("active", function(d){ return filterWords.indexOf(d.key) > -1; })
      // .transition()
      // .duration(1000)
      .style("transform", function(d,i){ return "translate(" + d.x + "px,0px) rotate(45deg)"; })
      .style("font-size", function(d) { return keywordsScale(d.values.length) + "px"; })
      .style("opacity", 1)
      // .filter(function(d){ return filterWords.indexOf(d.key) > -1; })
      //   .style("color", config.style.fontColorActive)
      //   .style("background", config.style.fontBackground)
        // .selectAll(".close div")
        //   .style("background-color", config.style.fontColorActive)
      //.text(function(d) { return d.key; })

    // select.select("div")
    //   .text(function(d) { return d.key; })
      // .style("opacity", function(d){ return keywordsOpacityScale(d.values.length); })

    var e = select.enter().append("div")
        .classed("tag", true)
        .on("mouseenter", tags.mouseenter)
        .on("mouseleave", tags.mouseleave)
        .on("click", tags.mouseclick)
        .style("transform", function(d,i){ return "translate(" + d.x + "px,0px) rotate(45deg)"; })
        .style("font-size", function(d) { return keywordsScale(d.values.length) + "px"; })
        .style("opacity", 0)

    e.append("span")
        .text(function(d) { return d.key; })
    
    e.append("div")
      .classed("close", true)
      // .attr("data-attr", config.style.fontColorActive)
    // e.append("div")
    //   .text(function(d) { return d.key; })
      // .style("transform", function(d,i){ return "rotate(90deg)"; })
      // .attr("dx", 25)
      // .attr("dy", 5)
      // .style("opacity", function(d){ return keywordsOpacityScale(d.values.length); })


    e
      // .transition()
      // .delay(400)
      // .duration(0)
      .style("transform", function(d,i){ return "translate(" + d.x + "px,0px) rotate(45deg)"; })
      .style("font-size", function(d) { return keywordsScale(d.values.length) + "px"; })
      .style("opacity", 1)

    select.exit()
      // .transition()
      // .duration(500)
      .style("opacity", 0)
      // .transition()
      // .duration(500)
      .remove();

    if(words.length === 0) return

    var w = getTranslateForList(words);

    container
      .style("transform", function(d,i){ return "translate(" + w + "px,0px)"; })

  }

  tags.updateAll = function(clear){
    tags.update();
    tags.highlightWords(filterWords);

    setTimeout(function(){
      canvas.project();
      tags.updateHash(clear);
    },50);

  }

  tags.reset = function(){
    filterWords = []
    tags.update();
    tags.highlightWords(filterWords);
    // canvas.highlight();
    // canvas.project()
  }

  tags.setFilterWords = function(words){
    // compare words with filterWords and olny update if different
    if(_.isEqual(words, filterWords)) return;

    filterWords = words;
    tags.updateAll();
  }

  tags.getFilterWords = function(){
    return filterWords;
  }

  tags.mouseclick = function (d) {
    lock = true;

    if(filterWords.indexOf(d.key)>-1){
      _.remove(filterWords,function(d2){ return d2 == d.key; });
    } else {
      filterWords.push(d.key);
    }
    // c(filterWords);
    tags.updateAll(true);

    lock = false
  }



  tags.updateHash = function(clear){
    console.log("updateHashtags")
    var hash = window.location.hash.slice(1);
    var params = new URLSearchParams(hash);
    params.set("filter", filterWords);
    if(filterWords.length === 0) params.delete("filter");
    if(clear){
      params.delete("ids");
    }
    
    var newHash = params.toString().replaceAll("%2C", ",")

    if(newHash !== hash){
      window.location.hash = params.toString().replaceAll("%2C", ",")
    }
  }

  tags.mouseleave = function (d) {
    if(lock) return;

    container
      .selectAll(".tag")
      .style("opacity", 1)

    data.forEach(function(d){ d.highlight = d.active; })

    canvas.highlight();
  }

  tags.mouseenter = function (d1) {
    if(lock) return;


    var tempFilterWords = _.clone(filterWords);
    tempFilterWords.push(d1.key)

    tags.highlightWords(tempFilterWords);
  }

  tags.filterWords = function(words){
    
    tags.filter(words,1);

    container
      .selectAll(".tag")
      .style("opacity", function(d){
        return d.values.some(function(d){ return d.active; }) ? 1 : 0.2;
      })

    canvas.highlight();
  }

  tags.highlightWords = function(words){
    
    tags.filter(words,1);

    container
      .selectAll(".tag")
      .style("opacity", function(d){
        return d.values.some(function(d){ return d.highlight; }) ? 1 : 0.2;
      })

      canvas.highlight();
  }

  tags.search = function(query){

    state.search = query
    
    tags.filter(filterWords, true);
    tags.update();
    canvas.highlight();
    canvas.project()
  }

  return tags;

}



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
    tags.filter();
    tags.update();
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
  }


  return tags;
}