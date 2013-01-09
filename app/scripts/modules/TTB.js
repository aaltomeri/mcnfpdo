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

  TTB.started = false;

  TTB.init = function(command, time) {

    // video info for this module
    var video_model = new Video.Model({

      name: 'TTB',
      sources: ['medias/videos/ttb.mp4'],
      dimensions: { width: '100%', height: '100%' },
      //sources: ['http://player.vimeo.com/video/56203539'],
      //dimensions: { width: '1280px', height: '720px' }
      time: time,
      autoplay: (command === 'play')? true : false,
      enablePlayPause: true,
      chapters: [
        { name: "Notebook", title: "Carnet de notes", start: 66, end: 72 },
        { name: "BgdBook", title: "Belgrade par Angélica Liddell", start: 73, end: 77 },
        { name: "BgdMap",title: "Belgrade Ville", start: 22, end: 27 },
        { name: "Mail", title: "Lettres du père", start: 58, end: 63 },
        { name: "Tabloid",title: "Belgrade Trash", start: 86, end: 92 },
        { name: "News", title: "Actualités", start: 79, end: 84 },
        { name: "Tesla",title: "Insconscient collectif", start: 40, end: 48 },
        { name: "History",title: "Histoire Serbe", start: 49, end: 56 },
        { name: "WarTrauma", title: "Traumatisme de guerre", start: 32, end: 37 }
      ]

    });
  
    // TTB has already been initialized and launched
    if(TTB.started) {

      if(time) {// move playhead if necessary
        TTB.MainView.options.video_view.movePlayHead(time);
      }

      // play or pause
      if(command === 'play') {
        TTB.MainView.options.video_view.popcorn.play();
      }
      else {
        TTB.MainView.options.video_view.popcorn.pause();
      }

      return;

    }

    // video view
    var video_view = new Video.Views.Main({ model: video_model }),
    // actual main view for this module
    ttb_view = TTB.MainView = new TTB.Views.Main({ 
      video_view: video_view,
    });

    TTB.model = video_model;

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

      // append video view to Main view
      this.$el.append(vv.$el);

      // add Intro view to the dom
      $('#main-container').empty().append(this.el);

      // init video
      vv.init();

      this.createBacktoTtbButton();

      this.initBehaviors();

      TTB.started = true;

      app.trigger('module:ttb:ready', TTB);

    },

    createBacktoTtbButton: function() {

        var v = this
        ,   vv = this.vv
        ,   bt = this.back_to_ttb_button =  $('<button>Back to TTB</button>');

        // append home button
        bt.css({ 
          position: 'absolute', 
          bottom: '10px', 
          right: '10px',
          opacity: 0
        });
        $('#main').append(bt);

    },

    prepareStageForModule: function() {

      this.disablePlayPause();
      this.enableBackToTtb();

    },

    showBackToTtbButton: function() {

      this.back_to_ttb_button.transition({opacity: 1});

    },

    hideBackToTtbButton: function() {

      this.back_to_ttb_button.transition({opacity: 0});

    },

    enableBackToTtb: function(key) {

      var bt = this.back_to_ttb_button;

      this.showBackToTtbButton();

      bt.on('click', $.proxy(this._backToTtb, this));

      $('body').on('keydown', {key: 32}, $.proxy(this._keydownHandler, this));

    },

    disableBackToTtb: function() {

      var bt = this.back_to_ttb_button;

      this.hideBackToTtbButton();

      bt.off('click', this._backToTtb);
      
      $('body').off('keydown', this._keydownHandler);

    },

    _keydownHandler: function(e) {

      if(!e.data.key)
        throw "This handler needs an event data 'key' property";

      if(e.which == e.data.key) {
        this._backToTtb();
      }

    },

    _backToTtb: function() {

      var vv = this.vv;

      // go to end of current chapter
      app.trigger('goto', 'TTB/play/' + vv.model.get('currentChapter').end);

      this.disableBackToTtb();
      this.enablePlayPause();

    },

    // wrapper around the Video View method of the same name
    enablePlayPause: function() {
      if(this.vv) {
        this.vv.enablePlayPause();
      }
    },

    // wrapper around the Video View method of the same name
    disablePlayPause: function() {
      if(this.vv) {
        this.vv.disablePlayPause();
      }
    },

    initBehaviors: function() {

      var _this = this
      ,   vv = this.vv
      ,   vp = vv.popcorn
      ,   chapter
      ,  showIntroInfo = true
      ,   hideIntroInfo = true;

      vv.showOverlay('Pour découvrir ce que cache les objets appuyez sur la barre espace ou cliquez/touchez l\'écran');

      vv.popcorn.on('timeupdate', function() {

          if(this.currentTime() < 15 && showIntroInfo) {
            //vv.showOverlay('Pour découvrir ce que cache les objets appuyez sur la barre espace ou cliquez/touchez l\'écran');
            //showIntroInfo = false;
          }

          if(this.currentTime() > 15 && hideIntroInfo) {
            vv.hideOverlay();
            hideIntroInfo = false;
          }

      });

      // setup mechanism to launch a module on pause
      this.vv.popcorn.on('pause', function() {

        if(chapter = vv.model.getChapterByTime(vp.currentTime())) {

          console.log('TTB PAUSED on chapter: ' + chapter.name);

          if(app.router.routes[chapter.name]) {
            // go to chapter
            app.trigger('goto', chapter.name);
          }
          else {
            vv.showOverlay('Le chapitre : <strong>' + chapter.title + '</strong> n\'existe pas encore');
            setTimeout(function() { vv.hideOverlay(); }, 2000);
          }


        }
        else {

          // do not pause when outside of a chapter
          this.play();

          // get next chapter
          chapter = vv.model.getChapterNextByTime(vp.currentTime());

          // show some feedback that no action is possible at this time
          vv.showOverlay('Prochain chapitre<br /><strong>'+ chapter.title +'</strong>');

          setTimeout(function() { vv.hideOverlay(); }, 1000);

        }

      });

    }

  });

  // Return the module for AMD compliance.
  return TTB;

});
