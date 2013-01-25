define([

  // Libraries.
  "jquery",
  "lodash",
  "backbone",

  "text!../data/app.chapters.json",
  "text!../data/app.sounds.json",

  "popcorn",
  "transit",

  // Plugins.
  "plugins/backbone.layoutmanager"

],

function($, _, Backbone, Chapters, Sounds) {

  // Provide a global location to place configuration settings and module
  // creation.
  var app = {

    // The root path to run the application.
    root: "/",

    // iPad Detection
    isiPad: navigator.userAgent.match(/iPad/i) != null,

    mainVideo_defaultWidth: 640,
    mainVideo_defaultHeight: 360,

    chapters: new Backbone.Collection($.parseJSON(Chapters)),

    sounds: new Backbone.Collection($.parseJSON(Sounds))

  };

  // Localize or create a new JavaScript Template object.
  var JST = window.JST = window.JST || {};

  // Configure LayoutManager with Backbone Boilerplate defaults.
  Backbone.LayoutManager.configure({
    paths: {
      layout: "templates/layouts/",
      template: "templates/"
    },

    fetch: function(path) {
      path = path + ".html";

      if (!JST[path]) {
        $.ajax({ url: app.root + path, async: false }).then(function(contents) {
          JST[path] = _.template(contents);
        });
      }

      return JST[path];
    }
  });

  // Mix Backbone.Events, modules, and layout management into the app object.
  return _.extend(app, {
    // Create a custom object with a nested Views object.
    module: function(additionalProps) {
      return _.extend({ Views: {} }, additionalProps);
    },

    // Helper for using layouts.
    useLayout: function(name) {
      // If already using this Layout, then don't re-inject into the DOM.
      if (this.layout && this.layout.options.template === name) {
        return this.layout;
      }

      // If a layout already exists, remove it from the DOM.
      if (this.layout) {
        this.layout.remove();
      }

      // Create a new Layout.
      var layout = new Backbone.Layout({
        template: name,
        className: "layout " + name,
        id: "layout"
      });

      // Insert into the DOM.
      $("#main").empty().append(layout.el);

      // Render the layout.
      layout.render();

      // Cache the refererence.
      this.layout = layout;

      // Return the reference, for chainability.
      return layout;
    },

    /**
     * resize #main to account for the fact that the main video keeps its aspect ratio even if stretched to 100% width
     * as we want #module-container to overlay exactly on top of main video (intro or ttb) we need this calculation
     */
    resizeMain: function() {

      var video_container   = $('#main-container video')
      ,   video_el          = video_container.get(0)
      ,   module_container  = $('#module-container')
      ,   video_w           = video_el.videoWidth? video_el.videoWidth : this.mainVideo_defaultWidth
      ,   video_h           = video_el.videoHeight? video_el.videoHeight : this.mainVideo_defaultHeight
      ,   video_wRatio      = video_h/video_w 
      ,   video_hRatio      = video_w/video_h
      ,   video_container_w = video_container.width()
      ,   video_container_h = video_container.height()
      ,   w = Math.round(video_container_h * video_hRatio)
      ,   h = Math.round(video_container_w * video_wRatio)

      if($('body').height() < $('body').width())
        $('#main').width($('body').height()*0.9 * video_hRatio);
      else
      $('#main').height($('body').width()*0.9 * video_wRatio);

    },


    /**
     * Load chapters config
     */
    loadChaptersConfig: function() {



    }


  }, Backbone.Events);

});
