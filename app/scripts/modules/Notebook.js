// News module
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

    var layout = new Notebook.Views.Layout();

  }

  // Default Model.
  Notebook.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  Notebook.Collection = Backbone.Collection.extend({
    model: Notebook.Model
  });

  // Default View.
  Notebook.Views.Layout = Backbone.Layout.extend({

    template: "notebook",

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

  

  Notebook.destroy = function() {

    console.log('Notebook destroy');

  }

  // Return the module for AMD compliance.
  return Notebook;

});
