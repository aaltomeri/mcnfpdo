define([
  // Application.
  "app",

  // Modules
  "modules/Intro"
],

function(app, Intro) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({

    routes: {
      "": "index",
      "bgd-map": "bgdMap"
    },

    index: function() {

      // here we call the init function that we have defined for the Intro module
      Intro.init();

    },

    bgdMap: function() {

      // requiring the module here will in effect initialize it because of how it is coded
      // @see init function in the module
      require(["modules/BgdMap"]);

    }

  });

  return Router;

});
