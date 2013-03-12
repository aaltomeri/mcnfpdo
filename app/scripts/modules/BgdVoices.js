// News module
define([
  // Application.
  "app",
  "Howler",
  "Howl",

  // Css
  "css!../../styles/bgd-voices.css"
],

// Map dependencies from above array.
function(app, Howler, Howl) {

  // Create a new module.
  var WarTrauma = app.module();

  WarTrauma.init = function() {

    console.log('BgdVoices INIT');

    // var sound = new Howl({
    //   urls: app.sounds.at(0).get('url')
    // }).play();


    console.log(app.sounds.at(0).get('url'))

    var layout = new WarTrauma.Views.Layout();

  }

  // Default Model.
  WarTrauma.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  WarTrauma.Collection = Backbone.Collection.extend({
    model: WarTrauma.Model
  });

  // Default View.
  WarTrauma.Views.Layout = Backbone.Layout.extend({

    template: "war-trauma",

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

  WarTrauma.destroy = function() {

    console.log('WarTrauma destroy');

  }

  // Return the module for AMD compliance.
  return WarTrauma;

});
