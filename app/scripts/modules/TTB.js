// TTB module
define([
  // Application.
  "app",

  // Modules
  "modules/Video"

],

// Map dependencies from above array.
function(app, Video) {

  // Create a new module.
  var TTB = app.module();

  TTB.init = function(command, offset) {
    
    // video info for this module
    var video_model = new Video.Model({
      name: 'Intro',
      sources: ['medias/videos/ttb.mp4'],
      dimensions: { width: '100%', height: '100%' },
      //sources: ['http://player.vimeo.com/video/56203539'],
      //dimensions: { width: '1280px', height: '720px' }
      offset: offset,
      autoplay: (command === 'play')? true : false
    }),
    // video view
    video_view = new Video.Views.Main({ model: video_model }),
    // actual main view for this module
    ttb_view = new TTB.Views.Main({ video_view: video_view});

  };

  // Default Model.
  TTB.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  TTB.Collection = Backbone.Collection.extend({
    model: TTB.Model
  });

  // Default View.
  TTB.Views.Main = Backbone.View.extend({

     initialize: function() {

      if(!this.options.video_view) {
        throw "TTB requires a video view";
      }
      else {
        // shortcut to video view
        var vv = this.options.video_view;
      }

      this.$el.css({ width: "100%", height: "100%"});

      // append video view to Intro view
      this.$el.append(vv.$el);

      // add Intro view to the dom
      $('#main-container').empty().append(this.el);

      // init video
      vv.init();

      vv.popcorn.on('timeupdate', function() {
        
      });

    }

  });

  // Return the module for AMD compliance.
  return TTB;

});
