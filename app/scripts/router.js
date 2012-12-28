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
      "ttb(/:command)(/:offset)": "ttb",
      "bgd-map": "bgdMap"
    },

    index: function() {

      // here we call the init function that we have defined for the module
      Intro.init();

    },

    ttb: function(command, offset) {

      // here we call the init function that we have defined for the module
      // we pass the optional offset argument that will result in the TTB video to be played at that time offset
      TTB.init(command, offset);

    },

    bgdMap: function() {

      // requiring the module here will in effect initialize it because of how it is coded
      // @see init function in the module
      require(["modules/BgdMap"]);

    }

  });

  return Router;

});
