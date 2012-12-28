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
        var vv = this.vv = this.options.video_view;
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

      this.initBehaviors();

    },

    initBehaviors: function() {

      this.allowPlayPause();

      // setup mechanism to launch a module on pause
      this.vv.popcorn.on('pause', function() {
        console.log('TTB PAUSED');
      });

    },

    allowPlayPause: function() {

      // by clicking on video
      this._allowPlayPauseByClicking();

      // by pressing space bar
      this._allowPlayPauseByPressingKey(32);

    },

    _allowPlayPauseByClicking: function() {

        var _this = this;
        
        $('#main').on('click',function() { 
          _this._togglePlayPause();
        });

    },

    _allowPlayPauseByPressingKey: function(key) {

        var _this = this;

        $('body').on('keydown', function(e) {
            if(e.which == key) {
              _this._togglePlayPause();
            }
        });

    },

    _togglePlayPause: function() {

      var vv = this.vv
      ,   vp = vv.popcorn;

      if(vp.paused()) {
        vp.play();
      }
      else {
        vp.pause();
      }

    }

  });

  // Return the module for AMD compliance.
  return TTB;

});
