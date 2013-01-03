// News module
define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var History = app.module();

  History.init = function() {

    console.log('History INIT');

    var layout = new History.Views.Layout();

  }

  // Default Model.
  History.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  History.Collection = Backbone.Collection.extend({
    model: History.Model
  });

  // Default View.
  History.Views.Layout = Backbone.Layout.extend({

    template: "history",

    initialize: function() {

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // render layout
      this.render();

      $('#module-container').transition({opacity: 1}, 2000);

    },

  });

  History.destroy = function() {

    console.log('History destroy');

  }

  // Return the module for AMD compliance.
  return History;

});
