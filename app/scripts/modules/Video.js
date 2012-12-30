// Video module
define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Video = app.module();
  
  Video.init = function() {
    
    var view = new Video.Views.Main();
    
  };

  // Default View.
  Video.Views.Main = Backbone.View.extend({

    popcorn: null,
    overlay: null,

    /**
     * Init routine for Vieo View
     * this methd needs to be explicitly called for video instanciation through Popcorn
     * 
     * @return void
     */
    init: function() {

      if(!this.model)
        throw 'Video View requires a model';
      
      var dimensions = this.model.get('dimensions')
      ,   offset = this.model.get('offset')
      ,   autoplay = this.model.get('autoplay')

      // adjust video container dimensions if provided
      if(dimensions) {
        this.$el.css({ width: dimensions.width, height: dimensions.height});
      }

      // Popcorn instantiation
      this.popcorn = Popcorn.smart(this.el, this.model.attributes.sources);

      // adjust video dimensions if provided
      if(dimensions) {
        this.$el.find('video').css({ width: dimensions.width, height: dimensions.height});
      }

      // wrap all play actions in a 'canplay' callback
      this.popcorn.on('canplay', function() {

        if(offset)
          this.currentTime(offset);

        // autoplay?
        if(autoplay)
          this.play();

      })

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

      var overlay = this.overlay = $('<div><div class="text">'+text+'</div></div>');

      overlay.css({
        position: 'absolute',
        // get actual video width : height * video dimensions factor
        width: this.$el.find('video').height() * (this.popcorn.media.videoWidth/this.popcorn.media.videoHeight),
        height: this.$el.find('video').width() * (this.popcorn.media.videoHeight/this.popcorn.media.videoWidth),
        background: 'black ',
        opacity: 0.3,
        display: 'table'
      });

      // center overlay
      overlay.css({ 
        left: this.$el.width()/2 - overlay.width()/2,
        top: this.$el.height()/2 - overlay.height()/2
      });

      // message style
      overlay.find('.text').css({ 
        'display': 'table-cell', 
        'vertical-align': 'middle', 
        'text-align': 'center', 
        color: 'white', 
        'font-size': '30px', 
        'line-height': 'auto',
        'text-transform': 'uppercase',
        'padding': '0 15%'
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
