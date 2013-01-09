// Set the require.js configuration for your application.
require.config({

  // Initialize the application with the main application file.
  deps: ["main"],

  paths: {
    // JavaScript folders.
    libs: "libs",
    plugins: "plugins",

    // Libraries.
    jquery: "libs/jquery",
    lodash: "libs/lodash",
    backbone: "libs/backbone",
    popcorn: "vendor/popcorn-complete",
    transit: "vendor/jquery.transit"
  },

  shim: {
    // Backbone library depends on lodash and jQuery.
    backbone: {
      deps: ["lodash", "jquery"],
      exports: "Backbone"
    },

    transit: {
       deps: ["jquery"],
    },

    // Backbone.LayoutManager depends on Backbone.
    "plugins/backbone.layoutmanager": ["backbone"]
  }

});
