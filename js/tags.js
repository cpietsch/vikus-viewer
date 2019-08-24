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
      .slice(0,sliceNum)
      .sort(function(a,b){
        return d3.ascending(a.key[0], b.key[0]);
      })

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


    e.transition()
      .delay(400)
      .duration(0)
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

  tags.reset = function(){
    filterWords = []
    tags.update();
    tags.highlightWords(filterWords);
    // canvas.highlight();
    // canvas.project()
  }

  tags.mouseclick = function (d) {
    lock = true;

    if(filterWords.indexOf(d.key)>-1){
      _.remove(filterWords,function(d2){ return d2 == d.key; });
    } else {
      filterWords.push(d.key);
    }
    // c(filterWords);

    tags.update();
    tags.highlightWords(filterWords);

    setTimeout(function(){
      canvas.project(d);
    },300);

    lock = false
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