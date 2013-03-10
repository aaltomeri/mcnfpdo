// TTB module
define([
  // Application.
  "app",

  // Modules
  "modules/Video",
  "modules/Soundtrack"

],

// Map dependencies from above array.
function(app, Video, Soundtrack) {

  // Create a new module.
  var TTB = app.module();

  TTB.started = false;

  TTB.init = function(command, time) {

    // video info for this module
    var video_model = new Video.Model({

      name: 'TTB',
      sources: [ 'medias/videos/ttb.webm', 'medias/videos/ttb.mp4'],
      dimensions: { width: '100%', height: '100%' },
      //sources: ['http://player.vimeo.com/video/56203539'],
      //dimensions: { width: '1280px', height: '720px' }
      time: time,
      autoplay: (command === 'play')? true : false,
      enablePlayPause: true,
      chapters: [
        { name: "BgdMap",title: "Belgrade Ville", start: 17, end: 23, description: "Baltasar s'est promené dans Belgrade" },
        { name: "BgdBook", title: "Belgrade d'Angélica Liddell", start: 27, end: 33, description: "Belgrade, la pièce d'Angélica Liddell, monté par Julien Fisera. Première le 18 mars à la Comédié de Sant Etienne" },
        { name: "Notebook", title: "Carnet de notes", start: 37, end: 43, description: "Mars 2006, Baltasar est à Belgrade. C'est l'enterrement de Milosevic. Quelques notes mais surtout d'autres choses se passent ailleurs." },
        { name: "Mail", title: "Très cher père", start: 46, end: 52, description: "" },
        { name: "Tabloid",title: "Belgrade +", start: 54, end: 61, description: "Petites promenades du côté obscur" },
        { name: "News", title: "Belgrade Live", start: 62, end: 67, description: "Belgrade en direct" },
        { name: "Tesla",title: "Inconscient collectif", start: 69, end: 75, description: "La Serbie, ah oui ... Nicolas Tesla etc." },
        { name: "History",title: "Histoire serbe", start: 77, end: 83, description: "Mais dans les faits ? Qu'est ce qui s'est passé ? Comment est ce qu'on peut expliquer ?" },
        { name: "BgdVoices", title: "Les voix de Belgrade", start: 85, end: 90, description: "Tous parlent, ou pensent, tous marchent ..." },
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

    ////////////////
    // video view //
    ////////////////
    
    var video_view = new Video.Views.Main({ model: video_model }),
    // actual main view for this module
    ttb_view = TTB.MainView = new TTB.Views.Main({ 
      video_view: video_view,
    });

    // Set TTB model to be used throughout the application
    TTB.model = video_model;

    ////////////////
    // Soundtrack //
    ////////////////
    var soundtrack_model = app.sounds.find(function(model) { return model.get('name') == "TTB Soundtrack" });
    TTB.soundtrack = new Soundtrack.View({ 
      model: soundtrack_model
    });

    // play soudtrack if time param is a Number
    if(typeof(time) == "number") {
      TTB.soundtrack.play(time, 2000);
    }

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

      // add view to the dom
      $('#main-container').empty().append(this.el);

      // init video
      vv.init();

      var still = vv.createStill();
      vv.showStill(still, true);

      this.createBacktoTtbButton();

      this.initBehaviors();

      TTB.started = true;

      app.trigger('module:ttb:ready', TTB);

    },

    createBacktoTtbButton: function() {

        var v = this
        ,   vv = this.vv
        ,   bt = this.back_to_ttb_button =  $('<button class="btn">Poursuivre l\'exploration</button>');

        // append home button
        bt.css({ 
          position: 'absolute', 
          bottom: '10px', 
          right: '10px',
          opacity: 0,
          "z-index": 1000
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
      ,   showIntroInfo = true
      ,   hideIntroInfo = true
      ,   creditsDisplayed;


      vv.popcorn.on('canplay', function() {


      });

      vv.popcorn.on('timeupdate', function() {

          var chapter = vv.model.getChapterByTime(this.currentTime());

          if(this.currentTime() < 15 && showIntroInfo) {

            // show still
            var still = vv.createStill();
            vv.showStill(still, true);

            vv.showOverlay(
              '<p>Pour commencer<br />appuyez sur la barre espace<br/>ou cliquez dans l\'écran</p>'
              + '<p class="infos">Ensuite,<br/>pour explorer chaque chapitre,<br />appuyez sur la barre espace<br/>ou cliquez dans l\'écran<br/>lorsque le titre du chapitre apparaît</p>'
              , {background: "transparent", opacity: 0.8 }
            );
            showIntroInfo = false;

          }

          if(this.currentTime() > 15 && hideIntroInfo) {
            vv.hideOverlay();
            hideIntroInfo = false;
          }

          // show chapter name
          if(chapter && vv.currentChapter != chapter) {

            vv.currentChapter = chapter;
            vv.showOverlay('<p class="chapter-title '+ chapter.name +'">'+chapter.title+'</p>'
              //+ '<br />'+chapter.description+'</p>'
              , { opacity: 0.8, background: 'transparent'}
            );
            setTimeout(function() { vv.hideOverlay(); }, 3000);

          }

          // show end credits
          if(this.currentTime() > 95 && !creditsDisplayed) {
            vv.showOverlay('<p>Mon corps ne fait pas d\'ombre</p><p>Un projet de Julien Fišera, Jérémie Scheidler et Thomas Mery</p>'
              + '<p class="infos">Baltasar: Vladislav Galard<br /> Musique: Thomas Mery & Jérôme Berg<br/>Images: Jérémie Scheidler</p>'
              + '<p class="infos">Appuyez sur la barre espace ou cliquez dans l\'écran pour explorer à nouveau les différents chapitres. Vous pouvez également choisir de vous rendre directement à un des chapitres en cliquant sur un des liens ci-dessous</p>'
              + '<p class="infos"><a href="#BgdMap">Belgrade Ville</a> - <a href="#BgdBook">Belgrade d\'Angélica Liddell</a> - <a href="#Notebook">Carnet de notes</a> - <a href="#Mail">Très cher père</a> - <a href="#Tabloid">Belgrade +</a> - <a href="#News">Actualités</a> - <a href="#Tesla">Inconcient collectif</a> - <a href="#History">Histoire Serbe</a> - <a href="#BgdVoices">Les voix de Belgrade</a></p>'
            , { opacity: 0.8, background: "rgba(0,0,0,0.6)" } );
            hideIntroInfo = false;
            creditsDisplayed = true;

            $('#main-container').css({"z-index": 3});

          }

           if(this.currentTime() < 95 && creditsDisplayed) {

              // reset creditsDisplayed to show them each time we reach the end
              creditsDisplayed = false;

           }

      });

       // when PLAYING the video ...
      vv.popcorn.on('play', function() {
        
        vv.hideOverlay();

        // hide still image
        vv.hideStill();

        if(TTB.soundtrack.popcorn.paused())
          TTB.soundtrack.play(TTB.soundtrack.popcorn.currentTime(), 2000);
      })

      // when PAUSING the video ...
      // setup mechanism to launch a module on pause
      this.vv.popcorn.on('pause', function() {

        // show still
        var still = vv.createStill();
        vv.showStill(still, true);

        if(chapter = vv.model.getChapterByTime(vp.currentTime())) {

          if(app.router.routes[chapter.name]) {
            // go to chapter
            app.trigger('goto', chapter.name);
          }
          else {
            vv.showOverlay('Le chapitre : <strong>' + chapter.title + '</strong> n\'existe pas encore');
            setTimeout(function() { vv.hideOverlay(); }, 2000);
          }

          TTB.soundtrack.pause(7000);

        }
        else {

          // do not pause when outside of a chapter
          //this.play();

          // get next chapter
          chapter = vv.model.getChapterNextByTime(vp.currentTime());

          // abort if no chapter has been found
          if(!chapter) {

            app.trigger('goto', 'TTB');

            return;

          }

          // show some feedback that no action is possible at this time
          vv.showOverlay('<p>Prochain chapitre<br /><strong>'+ chapter.title +'</strong></p>'
            + '<p class="infos">'+ chapter.description +'</p>'
            + '<p class="infos">Pour explorer chaque chapitre<br />appuyez sur la barre espace<br />ou cliquez dans l\'écran<br />lorsque son titre apparaît</p>'
            , {background: "transparent", opacity: 0.8 }
          );

          // setTimeout(function() { vv.hideOverlay(); }, 1000);

        }

      });

    }

  });

  // Return the module for AMD compliance.
  return TTB;

});
