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
      ,   loop = this.model.get('loop')

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

      this.popcorn.options.frameAnimation = true;

      console.log('creating video');
      console.log(this);

      if(loop) {
        this.popcorn.loop(true);
      }

      // adjust video element dimensions if provided
      if(dimensions) {
        this.$el.find('video').css({ width: dimensions.width, height: dimensions.height});
      }

      // wrap all play actions in a 'canplay' callback
      this.popcorn.on('canplay', function() {

        vv.model.set('duration', this.duration());

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

      // ANALYTICS
      _gaq.push(['_trackEvent', 'Vidéos', 'View', this.model.get('name')]);

    },

    /**
     * wrapper for popcorn play
     */
    play: function(time) {

      this.popcorn.play(time);

    },

    /**
     * wrapper for popcorn pause
     */
    pause: function() {

      this.popcorn.pause();

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

      this.$el.parent().parent().css({"z-index": 100});

      // by clicking on video
      this._enablePlayPauseByClicking();

      // by pressing space bar
      this._enablePlayPauseByPressingKey(32);

    },

    disablePlayPause: function() {

      this.$el.parent().parent().css({"z-index": 1});

      this._disablePlayPauseByClicking();
      this._disablePlayPauseByPressingKey();

    },

    _enablePlayPauseByClicking: function() {

        var trigger_event = app.isiPad? 'touchstart' : 'click';

        // make sure we only have on handler registered
        this.$el.parent().off(trigger_event);

        this.$el.parent().on(trigger_event, $.proxy(
            this._clickHandler, this
          )
        );

    },
    
    _disablePlayPauseByClicking: function() {

        var trigger_event = app.isiPad? 'touchstart' : 'click';

        // unregister all handlers as we do not need to be more specific
        // and as handler has been registered through $.proxy being more accurate means refactoring in _enablePlayPauseByClicking
        // to get a reference to the proxied function
        this.$el.parent().off(trigger_event);

    },

    _enablePlayPauseByPressingKey: function(key) {

      // make sure we only have on handler registered
      $('body').off('keydown');

      $('body').on('keydown', {key: key}, $.proxy(this._keydownHandler, this));

    },

    _disablePlayPauseByPressingKey: function() {

      $('body').off('keydown', this._keydownHandler);

    },

    _clickHandler: function(e) {

      this._togglePlayPause();

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

    /**
     * create Thubnail for this video
     * @param dimensions object the size of the thumbnail as an object with width and height properties
     * @return Canvas Element
     */
    createStill: function(dimensions) {

      var v = this.popcorn.media
      ,   $c = $('<canvas></canvas>')
      ,   c = $c.get(0)
      ,   context = c.getContext('2d')
      ,   vw = this.popcorn.media.videoWidth? this.popcorn.media.videoWidth : Video.defaultWidth
      ,   vh = this.popcorn.media.videoHeight? this.popcorn.media.videoHeight : Video.defaultHeight
      ,   elw = this.$el.find('video').width()
      ,   elh = this.$el.find('video').height()
      ,   cw = (dimensions && dimensions.width)? dimensions.width : ((elw > elh)? Math.round(elh * (vw/vh)) : elw)
      ,   ch = (dimensions && dimensions.height)? dimensions.height : ((elh > elw)?Math.round(elw * (vh/vw)) : elh)

      $c.css({
        position: "absolute"
      });

      c.width = cw;
      c.height = ch;

      context.drawImage(v,0,0,cw,ch);
      return c;

    },

    /**
     * displays video thumbnail on top of the video
     * @param c canvas element holding the thumbnail
     * @param position object with top and left properties
     * @return void
     */
    showStill: function(c, effect, position, callback) {

      var $c = $(c)

      // remove still if already present on stage
      if(this.still && this.still.length)
        this.still.remove();

      $c.attr('id', this.popcorn.id);
      this.still = $c;

      if(typeof(position) == "undefined" || !position)
        position = {
          top: 0, 
          left: this.$el.width()/2 - $c.get(0).width/2
        }

      $c.css({

        top: position.top,
        left: position.left,
        opacity: 0

      });

      if(effect) {
        // add filters
        $c.addClass('video-pause-effect');
      }

      this.$el.append($c);

      $c.transition({opacity: 1, duration: 500}, callback);

    },

    /**
     * remove still image if present
     */
    hideStill: function() {

      var still = this.still;

      if(!still)
        return;

      if(this.still.length) {
        this.still.transition({opacity: 0, duration: 600}, function() { still.remove()});
      }

    },

    showOverlay: function(text, styles) {

      this.hideOverlay();

      var overlay = this.overlay = $('<div class="overlay"><div class="text">'+text+'</div></div>')

      // original video media dimensions: use dynamically obtained dimensions if possible, 
      // defaults to the Video module defaults otherwise
      // useful on iPad where we have no way to have an autoplay or autoload which would allow us to get those dimensions from the media itself
      // i.e. they become available only after at least being loaded through the load() method
      ,   vw = this.popcorn.media.videoWidth? this.popcorn.media.videoWidth : Video.defaultWidth
      ,   vh = this.popcorn.media.videoHeight? this.popcorn.media.videoHeight : Video.defaultHeight

      var opacity = 0.5;

      if(styles && typeof(styles) == "object") {
        overlay.css(styles);
        opacity = styles.opacity? styles.opacity : opacity;
      }


      overlay.css({
        position: 'absolute',
        // get actual video width : height * video dimensions factor
        width: Math.round(this.$el.find('video').height() * (vw/vh)),
        height: Math.round(this.$el.find('video').width() * (vh/vw))
      });

      // center overlay
      overlay.css({ 
        left: this.$el.width()/2 - overlay.width()/2,
        top: this.$el.height()/2 - overlay.height()/2
      });

      overlay.css({opacity: 0});
      this.$el.append(overlay);
      overlay.transition({opacity: opacity});

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
       * works by appending 1s to the time passed to getChapterByTime until a chapter is found
       * @return object the chapter
       */
      getChapterNextByTime: function(time) {

        // abort it time > video duration
        if(time > this.get('duration'))
          return null;

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
