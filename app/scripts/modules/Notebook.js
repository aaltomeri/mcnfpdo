// Notebook module
define([
  // Application.
  "app",

  "css!../../styles/notebook.css"

],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Notebook = app.module();

  Notebook.init = function() {

    console.log('Notebook INIT');

    var layout
    ,   days = new Notebook.Days();

    days.on('reset', function() {
      layout = new Notebook.Views.Layout({collection: this});
    });

    days.fetchData();

  }

  // Default Model.
  Notebook.Day = Backbone.Model.extend({
  
  });

  // Default Collection.
  Notebook.Days = Backbone.Collection.extend({
    
    model: Notebook.Day,

    fetchData: function() {

      var _this = this;
      $.get('data/days.txt').done(
        function(data) { 
          _this.reset($.parseJSON(data));
        }
      );

    }

  });

  // Day View
  Notebook.Views.Day = Backbone.LayoutView.extend({

    template: 'calendar-day',
    tagName: 'li',

    events: {

      "click a"   : "onClickHandler"

    },

    onClickHandler: function(e) {

      e.preventDefault();

      console.log($(e.target).text());

    },

    // options: {
    //     paths: {
    //       template: ""
    //   }
    // },

    // overriding application LayoutManager fetch method to use inline template
    // we also need to set the template path to "" above if we want to set the template to something like #day
    // as otherwise it will look for templates/#days as 'templates/' is the default template path used to fetch JST templates
    // fetch: function(path) {
    //   return _.template($(path).html());
    // },

    // Provide data to the template
      serialize: function() {
        return this.model.toJSON();
    }


  });

  // Calendar View
  Notebook.Views.Calendar = Backbone.LayoutView.extend({

    tagName: 'ul',

    initialize: function() {

    },

    beforeRender: function() {

      this.collection.each(function(model) {
        //console.log(this);
        this.insertView(new Notebook.Views.Day({model: model}));

      }, this);
      
      //this.setView(new Notebook.Views.Day());

    }

  });

  // Default View.
  Notebook.Views.Layout = Backbone.Layout.extend({

    template: "notebook",

    views: {},

    initialize: function() {

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // setting Calendar view on layout here to pass it the main collection (days)
      // does not seem to work in the views object directly
      this.setView("#calendar", new Notebook.Views.Calendar({ collection: this.collection }));



      // render layout - effectively also rendering subviews 
      this.render();

      $('#module-container').transition({opacity: 1}, 2000);

    },

  });

  Notebook.destroy = function() {

    console.log('Notebook destroy');

  }

  // Return the module for AMD compliance.
  return Notebook;

});
