var detailVue = new Vue({
  el: '#detail',
  data: {
    item: null,  // item을 null로 초기화
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
      console.log("Processing entry:", entry); // entry 객체 출력
      console.log("Item data:", this.item); // this.item 데이터 출력

      if (entry.type === 'text') {
        const value = this.item ? this.item[entry.source] : undefined;
        console.log("Text value:", value);
        return value || '';
      }

      if (entry.type === 'array') {
        const value = this.item ? this.item[entry.source] : undefined;
        console.log("Array value:", value);
        return Array.isArray(value) ? value.join(', ') : '';
      }

      if (entry.type === 'keywords') {
        const value = this.item ? this.item[entry.source] : undefined;
        console.log("Keywords value:", value);
        return Array.isArray(value) ? value.join(', ') : '';
      }

      if (entry.type === 'markdown') {
        const value = this.item ? this.item[entry.source] : undefined;
        console.log("Markdown value:", value);
        return value ? marked(value, { breaks: true }) : '';
      }

      if (entry.type === 'function') {
        const column = this.item ? this.item : {};
        const func = entry.source;
        console.log("Function value:", func);
        try {
          return eval(func);
        } catch (e) {
          console.error("Function evaluation error:", e);
          return 'Error';
        }
      }

      return '';
    }
  }
});
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