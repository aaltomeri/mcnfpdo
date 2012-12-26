define([
  // Application.
  "app",

  // Mdules
  "modules/BgdMap"
],

function(app, bgdMap) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    routes: {
      "": "index"
    },

    index: function() {

      console.log(bgdMap);

    }
  });

  return Router;

});
