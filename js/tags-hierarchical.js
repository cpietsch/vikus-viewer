// christopher pietsch
// cpietsch@gmail.com
// 2015-2018


function TagsHierarchical() {
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

    console.log("tags init", data, config)

    // data.forEach(function(d) {
    //   d.keywordsOriginal = ""+d.keywords;
    //   d.keywords = d.keywords
    //     .map(function(d) {
    //       if(d.indexOf(":") === -1) return d
    //       else {
    //         var split = d.split(":")
    //         return split.map(function(d,i) { 
    //           return split.slice(0,i+1).join(":")
    //         })
    //       }
    //     })
    // });

    console.log("tags init", data)


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
        return d.keywords.filter(d => d == word).length;
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

    var filterWordsReverse = filterWords.map(d => d).reverse()

  keywordsNestGlobal =  d3.nest()
      .key(function(d) { return d.keyword; })
      .rollup(function(d){
        return d.map(function(d){ return d.data; });
      })
      .entries(keywords)
      .sort(function(a,b){
        return b.values.length - a.values.length;
      })
      .filter(d => {
        if(filterWords.length === 0){ return d.key.indexOf(":") === -1 }
        else {
          if(filterWords.map(f => d.key === f).length == filterWords.length) return true
          else if(d.key.indexOf(":") === -1) return true 
          else return false
        }
      })
      .map(d => {

        var out = d.key
        filterWordsReverse.forEach(f => {
          if(f != out) out = out.replace(f + ":", "")
        })
        d.display = out
        // console.log(filterWordsReverse, d.key, out)

        return d
      })
      .filter(d => d.display.indexOf(":") == -1 || filterWords.length == 0)

  console.log("filterWordsReverse", filterWordsReverse, keywordsNestGlobal)

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

    if (keywordsExtent[0] == keywordsExtent[1] || !filterWords.length) keywordsScale.range([15, 15]);

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
    console.log("draw", words);

    var select = container
      .selectAll(".tag")
        .data(words, function(d){ return d.display; })

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
        .classed("active", function(d){ return filterWords.indexOf(d.key) > -1; })


    e.append("span")
        .text(function(d) { return d.display; })
    
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
    state.search = "";  // Clear search term
    tags.update();
    tags.highlightWords(filterWords);
    tags.updateHash();  // Update hash when resetting
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

  tags.getSearchTerm = function(){
    return state.search;
  }

  tags.mouseclick = function (d) {
    lock = true;

    if(filterWords.indexOf(d.key)>-1){
      _.remove(filterWords,function(d2){ return d2 == d.key; });
      // if hierarchical keywords, could turn those into an array instead of strings
      if(d.key.indexOf(":") > -1){
        filterWords = filterWords.filter(f => !f.startsWith(d.key))
      }
    } else {
      filterWords.push(d.key);
    }
    // c(filterWords);
    tags.updateAll(true);

    lock = false
  }



  tags.updateHash = function(clear){
    var hash = window.location.hash.slice(1);
    var params = new URLSearchParams(hash);
    params.set("filter", filterWords);
    if(filterWords.length === 0) params.delete("filter");
    
    // Add search term to hash
    if(state.search && state.search !== ""){
      params.set("search", state.search);
    } else {
      params.delete("search");
    }
    
    if(clear){
      params.delete("ids");
    }
    
    var newHash = params.toString().replaceAll("%2C", ",")

    console.log("updateHashtags tags", clear, newHash, hash)

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
    canvas.project();
    
    // Update hash with search term
    tags.updateHash();
  }

  return tags;

}

