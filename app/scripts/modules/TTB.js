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

  TTB.init = function(command, offset) {
  TTB.init = function(command, time) {
    
    // video info for this module
    var video_model = new Video.Model({
      name: 'TTB',
      sources: ['medias/videos/ttb.mp4'],
      dimensions: { width: '100%', height: '100%' },
      //sources: ['http://player.vimeo.com/video/56203539'],
      //dimensions: { width: '1280px', height: '720px' }
      offset: offset,
      time: time,
      autoplay: (command === 'play')? true : false,
      enablePlayPause: true,
      chapters: [
        { name: "notebook", title: "Carnet de notes", start: 66, end: 72 },
        { name: "bgd-book", title: "Belgrade par Angélica Liddell", start: 73, end: 77 },
        { name: "bgd-map",title: "Belgrade Ville", start: 22, end: 27 },
        { name: "mail", title: "Lettres du père", start: 58, end: 63 },
        { name: "tabloid",title: "Belgrade Trash", start: 86, end: 92 },
        { name: "news", title: "Actualités", start: 79, end: 84 },
        { name: "tesla",title: "Insconscient collectif", start: 40, end: 48 },
        { name: "history",title: "Histoire Serbe", start: 49, end: 56 },
        { name: "war-trauma", title: "Traumatisme de guerre", start: 32, end: 37 }
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
      this.initBehaviors();

      TTB.started = true;

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
