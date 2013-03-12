// Set the require.js configuration for your application.
require.config({

  // Initialize the application with the main application file.
  deps: ["main"],

  paths: {
    // JavaScript folders.
    libs: "libs",
    plugins: "plugins",

    // require text plugin
    text: "libs/text",

    // Libraries.
    jquery: "libs/jquery",
    lodash: "libs/lodash",
    backbone: "libs/backbone",
    popcorn: "vendor/popcorn-complete",
    transit: "vendor/jquery.transit",
    buzz: "vendor/buzz/buzz",
    Howler: "vendor/howler/howler",
    Howl: "vendor/howler/howler"
  },

  map: {

    '*': {

      'css': 'libs/require-css/css'

    }

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
