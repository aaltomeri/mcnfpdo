define([
  // Application.
  "app",

  // Modules
  "modules/Intro", 
  "modules/TTB",
],

function(app, Intro, TTB) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({

    routes: {
      "": "index",
      "ttb": "ttb",
      "bgd-map": "bgdMap"
    },

    index: function() {

      // here we call the init function that we have defined for the Intro module
      Intro.init();

    },

    ttb: function() {

      // here we call the init function that we have defined for the Intro module
      TTB.init();

    },

    bgdMap: function() {

      // requiring the module here will in effect initialize it because of how it is coded
      // @see init function in the module
      require(["modules/BgdMap"]);

    }

  });

  return Router;

});
