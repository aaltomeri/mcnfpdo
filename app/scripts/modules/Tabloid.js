// News module
define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Tabloid = app.module();

  Tabloid.init = function() {

    console.log('Tabloid INIT');

    var layout = new Tabloid.Views.Layout();

  }

  // Default Model.
  Tabloid.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  Tabloid.Collection = Backbone.Collection.extend({
    model: Tabloid.Model
  });

  // Default View.
  Tabloid.Views.Layout = Backbone.Layout.extend({

    template: "tabloid",

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

  Tabloid.destroy = function() {

    console.log('Tabloid destroy');

  }

  // Return the module for AMD compliance.
  return Tabloid;

});
