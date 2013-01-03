// News module
define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Tesla = app.module();

  Tesla.init = function() {

    console.log('Tesla INIT');

    var layout = new Tesla.Views.Layout();

  }

  // Default Model.
  Tesla.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  Tesla.Collection = Backbone.Collection.extend({
    model: Tesla.Model
  });

  // Default View.
  Tesla.Views.Layout = Backbone.Layout.extend({

    template: "tesla",

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

  Tesla.destroy = function() {

    console.log('Tesla destroy');

  }

  // Return the module for AMD compliance.
  return Tesla;

});
