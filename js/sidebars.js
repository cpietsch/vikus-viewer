var detailVue = new Vue({
      el: '#detail',
      data: {
        item: null,
        structure: null,
        page: 0,
        id: null
      },
      methods: {
        displayPage: function(page){
          canvas.changePage(this.id, page)
        },
        hasData: function(entry){
          return this.getContent(entry) !== ''
        },
        getContent: function(entry) {
          if(entry.type === 'text') {
            return this.item[entry.source]
          }
          if(entry.type === 'array') {
            return this.item[entry.source].join(', ')
          }
          if(entry.type === 'keywords') {
            return this.item[entry.source].join(', ')
          }
          if(entry.type === 'markdown') {
            return marked(this.item[entry.source], { breaks: true})
          }
          if(entry.type === 'function') {
            const column = this.item
            const func = entry.source
            try {
              return eval(func)
            } catch (e) {
              return 'Error'
            }
          }
        }
      }
    })
  window.detailVue = detailVue;

  var infoVue = new Vue({
      el: '#infobar',
      data: {
        info: ""
      },
      methods: {
        marked: function(input) {
          return marked(input);
        }
      }
    })
  window.infoVue = infoVue;