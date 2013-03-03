// Video module
define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Video = app.module();

  Video.defaultWidth = 640;
  Video.defaultHeight = 360;
  
  Video.init = function() {
    
    var view = new Video.Views.Main();
    
  };

  // Default View.
  Video.Views.Main = Backbone.View.extend({

    className: 'video',

    manage: true,

    popcorn: null,
    overlay: null,

    /**
     * Init routine for Video View
     * this methd needs to be explicitly called for video instanciation through Popcorn
     * 
     * @return void
     */
    init: function(start_time) {

      if(!this.model)
        throw 'Video View requires a model';

      if(!this.model.get('sources'))
        throw 'Video View requires a model with sources attribute set';
      
      var vv = this
      ,   dimensions = this.model.get('dimensions')
      ,   time = this.model.get('time')
      ,   autoplay = this.model.get('autoplay')
      ,   enablePlayPause = this.model.get('enablePlayPause')

      // adjust video container dimensions if provided
      if(dimensions) {
        this.$el.css({ width: dimensions.width, height: dimensions.height});
      }

      if(this.popcorn) {
        this.popcorn.destroy();
        this.$el.empty();
      }

      // Popcorn instantiation
      this.popcorn = Popcorn.smart(this.el, this.model.attributes.sources);

      // adjust video element dimensions if provided
      if(dimensions) {
        this.$el.find('video').css({ width: dimensions.width, height: dimensions.height});
      }

      // wrap all play actions in a 'canplay' callback
      this.popcorn.on('canplay', function() {

        // offset playhead
        if(time) {

          // execute function with Video View context ( as we are in a popcorn event callback )
          $.proxy(vv.movePlayHead, vv)(time);

        }

        if(start_time) {
          this.currentTime(start_time);
        }

        // autoplay?
        if(autoplay) this.play();

      });

      // enable PLAY / PAUSE
      if(enablePlayPause) this.enablePlayPause();

    },

    movePlayHead: function(time) {

      // time is a string 
      if(isNaN(time)) {

        // is it a chapter name ?
        var chapter = _.find(this.model.attributes.chapters, function(chapter) { 
          return  chapter.name.toLowerCase() == time.toLowerCase();
        }) 

        if(chapter) {
          this.popcorn.currentTime(chapter.start);
          this.model.set('currentChapter', chapter);
        }

      }
      else {
         this.popcorn.currentTime(time);
      }

    },

    enablePlayPause: function() {

      // by clicking on video
      this._enablePlayPauseByClicking();

      // by pressing space bar
      this._enablePlayPauseByPressingKey(32);

    },

    disablePlayPause: function() {

      this._disablePlayPauseByClicking();
      this._disablePlayPauseByPressingKey();

    },

    _enablePlayPauseByClicking: function() {

        var trigger_event = app.isiPad? 'touchstart' : 'click';

        $('#main').on(trigger_event, $.proxy(this._togglePlayPause, this));

    },
    
    _disablePlayPauseByClicking: function() {

        var trigger_event = app.isiPad? 'touchstart' : 'click';
        $('#main').off(trigger_event, this._togglePlayPause);

    },

    _enablePlayPauseByPressingKey: function(key) {

      $('body').on('keydown', {key: key}, $.proxy(this._keydownHandler, this));

    },

    _disablePlayPauseByPressingKey: function() {

      $('body').off('keydown', this._keydownHandler);

    },

    _keydownHandler: function(e) {

      if(!e.data.key)
        throw "This handler needs an event data 'key' property";

      if(e.which == e.data.key) {
        this._togglePlayPause();
      }

    },

    _togglePlayPause: function() {

      var vp = this.popcorn;

      if(vp.paused()) {
        vp.play();
      }
      else {
        vp.pause();
      }

    },

    showOverlay: function(text) {

      this.hideOverlay();

      var overlay = this.overlay = $('<div class="overlay"><div class="text">'+text+'</div></div>')

      // original video media dimensions: use dynamically obtained dimensions if possible, 
      // defaults to the Video module defaults otherwise
      // useful on iPad where we have no way to have an autoplay or autoload which would allow us to get those dimensions from the media itself
      // i.e. they become available only after at least being loaded through the load() method
      ,   vw = this.popcorn.media.videoWidth? this.popcorn.media.videoWidth : Video.defaultWidth
      ,   vh = this.popcorn.media.videoHeight? this.popcorn.media.videoHeight : Video.defaultHeight


      overlay.css({
        position: 'absolute',
        // get actual video width : height * video dimensions factor
        width: Math.round(this.$el.find('video').height() * (vw/vh)),
        height: Math.round(this.$el.find('video').width() * (vh/vw)),
        background: 'black ',
        opacity: 0.3,
        display: 'table'
      });

      // center overlay
      overlay.css({ 
        left: this.$el.width()/2 - overlay.width()/2,
        top: this.$el.height()/2 - overlay.height()/2
      });

      overlay.css({opacity: 0});
      this.$el.append(overlay);
      overlay.transition({opacity: 0.5});

    },

    hideOverlay: function() {

      var overlay = this.overlay;
      
      if(overlay) {
        overlay.transition({opacity: 0}, function() { overlay.remove(); });
      }
        
    },

    /**
     * override remove method to allow for destroying popcorn instance
     */
    remove: function() {

      if(this.popcorn) {

        this.popcorn.destroy();
        delete this.popcorn;
        
      }

      this.disablePlayPause();

      Backbone.View.prototype.remove.apply(this, arguments);

    }

  });

  // Default Model.
  Video.Model = Backbone.Model.extend({

      chapters: [],

      /**
       * returns the chapter for a given time
       * @return object the chapter
       */
      getChapterByTime: function(time) {
        return _.find(this.attributes.chapters, function(chapter) { 
          return  time > chapter.start && time < chapter.end;
        });
      },

      /**
       * returns the next chapter for a given time
       * @return object the chapter
       */
      getChapterNextByTime: function(time) {

        var chapter = this.getChapterByTime(time);

        if(chapter) {
          return chapter;
        }
        else {
          return this.getChapterNextByTime(time+1);
        }

      }

  });

  // Default Collection.
  Video.Collection = Backbone.Collection.extend({
    model: Video.Model
  });


  // Return the module for AMD compliance.
  return Video;

});
