// Intro module
define([
  // Application.
  "app",

  // Modules
  "modules/Video"
],

// Map dependencies from above array.
function(app, Video) {

  // Create a new module.
  var Intro = app.module();
  
  Intro.init = function() {
    
    var video_model = new Video.Model({
      name: 'Intro',
      sources: ['medias/videos/intro.mp4'],
      autoplay: true,
      dimensions: { width: '100%', height: '100%' }
    }),
    video_view = new Video.Views.Main({ model: video_model }),
    intro_view = new Intro.Views.Main({ video_view: video_view});

  };

  // Default View.
  Intro.Views.Main = Backbone.LayoutView.extend({

    initialize: function() {

      if(!this.options.video_view) {
        throw "Intro requires a video view";
      }
      else {
        var vv = this.options.video_view;
      }

      this.$el.css({ width: "100%", height: "100%"});

      // add video view
      this.$el.append(vv.$el);

      // add layout to the dom
      $('#main-container').empty().append(this.el);

      vv.init();

    }

  });

  

  // Default Model.
  Intro.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  Intro.Collection = Backbone.Collection.extend({
    model: Intro.Model
  });


  // Return the module for AMD compliance.
  return Intro;

});
