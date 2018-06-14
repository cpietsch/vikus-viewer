// christopher pietsch
// cpietsch@gmail.com
// 2015-2018

function myTagCloud() {
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

  var mouseenterCallback = function(){};

  function chart(){ }

  chart.state = state

  chart.init = function(_data) {
    data = _data;

    container = d3.select(".page").append("div")
      .style("width", width + margin.left + margin.right)
      .style("height", height + margin.top + margin.bottom)
      .classed("tagcloud", true)
      .style("color", config.style.fontColor)
      .append("div")
      //.attr("transform", "translate("+ margin.left +","+ margin.top +")")
      
    chart.update();
  }

  chart.resize = function(){
    if(!state.init) return;
    
    width = window.innerWidth - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    container
      .style("width", width + margin.left + margin.right)
      .style("height", height + margin.top + margin.bottom)

    x.rangeBands([0, width]);

    chart.update();
  }

  chart.filter = function(filterWords,highlight){
    data.forEach(function(d) {
      var search = state.search !== "" ? d.search.indexOf(state.search) > -1 : true
      var matches = filterWords.filter(function(word){
        return d.keywords.indexOf(word) > -1;
      });
      if(highlight) d.highlight = (matches.length == filterWords.length && search);
      else d.active = (matches.length == filterWords.length && search);
    });

    var anzahl = data.filter(function(d){ return d.active; }).length;
    // c("anzahl", anzahl)
  }

  chart.update = function() {

    chart.filter(filterWords);

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


    // var p = 1.8;
    // var p2 = 1;
    // var x0 = 0;
    // keywordsNest.forEach(function(d){
    //   d.x = x0 + keywordsScale(d.values.length)*p +p2;
    //   x0 += keywordsScale(d.values.length)*p;
    // })

    listLayout(keywordsNest);
    
    // x.domain(keywordsNest.map(function(d,i){ return i; }))

    chart.draw(keywordsNest);
   
  }

  function listLayout(data){
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

  chart.draw = function(words) {
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
        .on("mouseenter", chart.mouseenter)
        .on("mouseleave", chart.mouseleave)
        .on("click", chart.mouseclick)
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
      .transition()
      .duration(500)
      .remove();

    if(words.length === 0) return

    var w = getTranslateForList(words);

    container
      .style("transform", function(d,i){ return "translate(" + w + "px,0px)"; })

  }

  chart.mouseclick = function (d) {
    lock = true;

    if(filterWords.indexOf(d.key)>-1){
      _.remove(filterWords,function(d2){ return d2 == d.key; });
    } else {
      filterWords.push(d.key);
    }
    // c(filterWords);

    chart.update();

    logger.log({ action: "click" , target: d.key });

    chart.highlightWords(filterWords);

    setTimeout(function(){
      mouseclickCallback(d);
    },300);

    lock = false
    
  }

  chart.mouseleave = function (d) {
    if(lock) return;

    container
      .selectAll(".tag")
      .style("opacity", 1)

    data.forEach(function(d){ d.highlight = d.active; })

    mouseenterCallback();
  }

  chart.mouseenter = function (d1) {
    if(lock) return;


    var tempFilterWords = _.clone(filterWords);
    tempFilterWords.push(d1.key)

    chart.highlightWords(tempFilterWords);
  }

  chart.filterWords = function(words){
    
    chart.filter(words,1);

    container
      .selectAll(".tag")
      .style("opacity", function(d){
        return d.values.some(function(d){ return d.active; }) ? 1 : 0.2;
      })

    mouseenterCallback();
  }

  chart.highlightWords = function(words){
    
    chart.filter(words,1);

    container
      .selectAll(".tag")
      .style("opacity", function(d){
        return d.values.some(function(d){ return d.highlight; }) ? 1 : 0.2;
      })

      mouseenterCallback();
  }

  chart.search = function(query){

    state.search = query

    if(query === "") {
      console.log("reset")
      chart.filter(filterWords, true);
      chart.update();
      list.highlight();
      list.project()
      return
    }

    console.log(query)

    var sliceNum = parseInt(sliceScale(width));

    var keywords2 = [];

    data.forEach(function(d) {
      var active = d.search.toUpperCase().indexOf(query) > -1
      d.active = active
      d.highlight = active

      if(active){
        d.keywords.forEach(function(keyword) {
          keywords2.push({ keyword: keyword, data: d });
        })
        
      }
    });

    var result = d3.nest()
      .key(function(d) { return d.keyword; })
      .rollup(function(d){
        return d.map(function(d){ return d.data; });
      })
      .entries(keywords2)
      .sort(function(a,b){
        return b.values.length - a.values.length;
      })
      .slice(0,sliceNum)
      .sort(function(a,b){
        return d3.ascending(a.key[0], b.key[0]);
      })

     // var result = keywordsNestGlobal
     //  .filter(function(d){
     //    return d.key.toUpperCase().indexOf(query) > -1;
     //  })
     //  .slice(0,sliceNum)
     //  .sort(function(a,b){
     //    return d3.ascending(a.key[0], b.key[0]);
     //  })

    // console.log(result)


    // c("num",sliceNum)        
    
    var keywordsExtent = d3.extent(result, function (d) {
      return d.values.length;
    })
    keywordsScale
      .domain(keywordsExtent)
      .range([10,20]);

    if(keywordsExtent[0]==keywordsExtent[1]) keywordsScale.range([15,15])


    keywordsOpacityScale
      .domain(keywordsExtent)
      .range([0.2,1]);

    listLayout(result);
     
    // var p = 10;
    // var x0 = 0;
    // result.forEach(function(d){
    //   d.x = x0;
    //   x0 += keywordsScale(d.values.length) + p;
    // })

    chart.draw(result)

    // var words = result.map(function(d){ return d.key; });

    // data.forEach(function(d) {
    //   var matches = words.filter(function(word){
    //     return d.keywords.indexOf(word) > -1;
    //   });
    //   d.active = matches.length > 0;
    //   d.highlight = matches.length > 0;
    // });

    // c(words);

    // list.highlight();
    list.highlight();
    // list.split();
    list.project()
    
  }

  chart.mouseenterCallback = function(callback){
 
      mouseenterCallback = callback;

  }

  chart.mouseclickCallback = function(callback){
    mouseclickCallback = callback;
  }



  return chart;

}