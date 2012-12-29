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
    
    // video info for this module
    var video_model = new Video.Model({
      name: 'Intro',
      sources: ['medias/videos/intro.mp4'],
      dimensions: { width: '100%', height: '100%' },
      //sources: ['http://player.vimeo.com/video/56203539'],
      //dimensions: { width: '1280px', height: '720px' }
      autoplay: true,
    }),
    // video view
    video_view = new Video.Views.Main({ model: video_model }),
    // actual main view for this module
    intro_view = new Intro.Views.Main({ video_view: video_view});

  };

  // Default View.
  Intro.Views.Main = Backbone.LayoutView.extend({

    initialize: function() {

      if(!this.options.video_view) {
        throw "Intro requires a video view";
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
        if(this.currentTime() > this.duration()-3) {
          this.pause();
          this.destroy();
          app.trigger('goto', 'ttb/play/10');
        }
      });

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
