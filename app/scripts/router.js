define([
  // Application.
  "app",

  // Modules
  
],

function(app, BgdMap) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({

    routes: {
      "": "index",
      "bgd-map": "bgdMap"
    },

    index: function() {

    },

    bgdMap: function() {

      require(["modules/BgdMap"]);

    }

  });

  return Router;

});
