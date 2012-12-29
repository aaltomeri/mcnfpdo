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
      name: 'TTB',
      sources: ['medias/videos/ttb.mp4'],
      dimensions: { width: '100%', height: '100%' },
      //sources: ['http://player.vimeo.com/video/56203539'],
      //dimensions: { width: '1280px', height: '720px' }
      offset: offset,
      autoplay: (command === 'play')? true : false,
      chapters: [
        { name: "notebook",  start: 66, end: 72 },
        { name: "bgd-book",  start: 73, end: 77 },
        { name: "bgd-map", start: 22, end: 27 },
        { name: "mail",  start: 58, end: 63 },
        { name: "tabloid", start: 86, end: 92 },
        { name: "news",  start: 79, end: 84 },
        { name: "tesla", start: 40, end: 48 },
        { name: "history", start: 49, end: 56 },
        { name: "war-trauma",  start: 32, end: 37 }
      ]

    }),
    // video view
    video_view = new Video.Views.Main({ model: video_model }),
    // actual main view for this module
    ttb_view = new TTB.Views.Main({ 
      video_view: video_view,

    });

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

      var _this = this
      ,   vv = this.vv
      ,   vp = vv.popcorn
      ,   chapter;

      this.allowPlayPause();

      // setup mechanism to launch a module on pause
      this.vv.popcorn.on('pause', function() {

        if(chapter = vv.model.getChapterByTime(vp.currentTime())) {

          console.log('TTB PAUSED on chapter: ' + chapter.name);

        }
        else {

          // do not pause when outside of a chapter
          this.play();

          // show some feedback that no action is possible at this time
          var d = $('<div style="position"><span>Patience !</<span></div>').css({
            position: 'absolute',
            // get actual video width : height * video dimensions factor
            width: _this.$el.find('video').height() * (this.media.videoWidth/this.media.videoHeight),
            height: _this.$el.find('video').height(),
            background: 'red',
            top: 0,
            opacity: 0.3,
            display: 'table'
          });

          // center overlay
          d.css({ left: _this.$el.width()/2 - d.width()/2 });

          // message style
          d.find('span').css({ 'display': 'table-cell', 'vertical-align': 'middle', 'text-align': 'center', color: 'white', 'font-size': '150px'});

          _this.$el.append(d);

          setTimeout(function() { d.fadeOut(function() { $(this).remove(); }) }, 500);

        }

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

    },

  });

  // Return the module for AMD compliance.
  return TTB;

});
