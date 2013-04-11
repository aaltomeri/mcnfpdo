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

    // we have swapped the depth in Intro to access the link on overlay
    // revert to see something ...
    $('#main-container').css({ "z-index": 0});
    $('#module-container').css({ "z-index": 1});

    // video info for this module
    var video_model = new Video.Model({

      name: 'TTB',
      sources: [ 'medias/videos/ttb.webm', 'medias/videos/ttb.mp4'],
      dimensions: { width: '100%', height: '100%' },
      //sources: ['http://player.vimeo.com/video/56203539'],
      //dimensions: { width: '1280px', height: '720px' }
      time: time,
      autoplay: (command === 'play')? true : false,
      loop: true,
      enablePlayPause: true,
      chapters: [
        { name: "BgdMap",title: "Belgrade Ville", start: 17, end: 23, description: "Baltasar s'est promené dans Belgrade" },
        { name: "BgdBook", title: "Belgrade d'Angélica Liddell", start: 27, end: 33, description: "Belgrade, la pièce d'Angélica Liddell, monté par Julien Fisera. Première le 18 mars à la Comédié de Sant Etienne" },
        { name: "Notebook", title: "Carnet de notes", start: 37, end: 43, description: "Mars 2006, Baltasar est à Belgrade. C'est l'enterrement de Milosevic. Quelques notes mais surtout d'autres choses se passent ailleurs." },
        { name: "BriefAnDenVater", title: "Très cher père", start: 46, end: 52, description: "Baltasar est venu à Belgrade pour son père. Ils ont des rapports compliqués." },
        { name: "BgdPlus",title: "Belgrade +", start: 54, end: 61, description: "Petites promenades du côté obscur" },
        { name: "BgdDirect", title: "Belgrade Direct", start: 62, end: 67, description: "Belgrade en direct" },
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
        ,   bt = this.back_to_ttb_button =  $('<button class="btn" id="back-to-ttb">Poursuivre l\'exploration</button>');

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

      if(!app.isiPad)
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
        this._backToTtb(e);
      }

    },

    _backToTtb: function(e) {

      var vv = this.vv;

      // prevent the click event to bubble up to #main 
      // even though at the time of the click on the button the play/pause mechanisem on #main was disabled
      // it got re-enabled before the end of the bubbling phase
      e.stopPropagation();

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
      ,   credits1Displayed
      ,   credits2Displayed


      vv.popcorn.on('canplay', function() {


      });

      vv.popcorn.on('timeupdate', function() {

          var chapter = vv.model.getChapterByTime(this.currentTime());

          if(this.currentTime() < 8 && showIntroInfo) {

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

          if(this.currentTime() > 8 && this.currentTime() < 9 && hideIntroInfo) {
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
          if(this.currentTime() > 95 && !credits1Displayed) {

            vv.showOverlay('<p><strong>Mon corps ne fait pas d\'ombre</strong></p>'
              + '<p class="infos">Un projet de <br/><strong>Julien Fišera, Jérémie Scheidler et Thomas Mery</strong></p>'
              + '<p class="infos">'
              + 'Images: <strong>Jérémie Scheidler</strong> - '
              + 'Recherche : <strong>Julien Fišera</strong> - '
              + 'Musique: <strong>Thomas Mery & Jérôme Berg</strong> - '
              + 'Développement: <strong>Thomas Mery</strong> - '
              + 'Baltasar: <strong>Vladislav Galard</strong>'
              + '</p>'
              + '<p class="infos"><span class="small">Un grand merci à : Emilija Andrejevic - Branimir Pipal - Zivomir Popovic - Marin Marovic - Mirjana Slavkovic, Musée d\'Histoire Yougoslave de Belgrade - Philippe Le Moine, Institut Français de Belgrade - Milica Zivadinovic, Centre Culturel de Serbie à Paris - Jasmina Nikolic - Sloga Press - Hôtel Cambrai - Alexandre Pallu - Grégoire Tachnakian  - Chantal Rameau - Cécile Fišera - Caroline Guiela Nguyen - Victor Leclère - Philippe Dubois - Simone Guiela - Emma Monier</span></p>'
            , { opacity: 0.8, background: "rgba(0,0,0,0.6)" } );

            _this.disablePlayPause();
            credits1Displayed = true;

            $('#main-container').css({"z-index": 3});

          }

          // show end credits
          if(this.currentTime() > 110 && !credits2Displayed) {

            vv.showOverlay('<p><strong>Mon corps ne fait pas d\'ombre</strong></p>'
              + '<p class="infos">Un projet de <strong>Julien Fišera, Jérémie Scheidler et Thomas Mery</strong></p>'
              + '<p class="infos">Vous pouvez maintenant vous rendre directement à un des chapitres<br/>en cliquant sur un des liens ci-dessous</p>'
              + '<p class="infos">'
              + '<a href="#BgdMap">Belgrade Ville</a>'
              + ' - <a href="#BgdBook">Belgrade d\'Angélica Liddell</a>'
              + ' - <a href="#Notebook">Carnet de notes</a>'
              + ' - <a href="#BriefAnDenVater">Très cher père</a>'
              + ' - <a href="#BgdPlus">Belgrade +</a>'
              + ' - <a href="#BgdDirect">Belgrade Direct</a>'
              + ' - <a href="#Tesla">Inconcient collectif</a>'
              + ' - <a href="#History">Histoire Serbe</a>'
              + ' - <a href="#BgdVoices">Les voix de Belgrade</a>'
              + '</p>'
            , { opacity: 0.8, background: "rgba(0,0,0,0.6)" } );

            credits2Displayed = true;
 
            hideIntroInfo = true;
            showIntroInfo = false;

            _this.enablePlayPause();

            $('#main-container').css({"z-index": 3});

          }

           if(this.currentTime() < 95 && credits1Displayed) {

              // reset creditsDisplayed to show them each time we reach the end
              credits1Displayed = false;
              credits2Displayed = false;

           }

      });

       // when PLAYING the video ...
      vv.popcorn.on('play', function() {
        
        vv.hideOverlay();

        // hide still image
        vv.hideStill();

        if(TTB.soundtrack.popcorn.paused()) {
          TTB.soundtrack.play(TTB.soundtrack.popcorn.currentTime(), 2000);
        }

      });

      // when PAUSING the video ...
      // setup mechanism to launch a module on pause
      this.vv.popcorn.on('pause', function() {

        vv.hideOverlay();

        

        if(chapter = vv.model.getChapterByTime(vp.currentTime())) {

          // find out if the chapter name is present in any of the routes
          // not 100% bullet proof but close enough for now
          var chapterExists = _.find(app.router.routes, function(route, key) { 
            return key.toLowerCase().indexOf(chapter.name.toLowerCase()) != -1; 
          });

          if(chapterExists) {
            // go to chapter
            app.trigger('goto', chapter.name);
          }
          else {
            vv.showOverlay('Le chapitre : <strong>' + chapter.title + '</strong> n\'existe pas encore');
            setTimeout(function() { vv.hideOverlay(); }, 2000);
          }

          // show still
          var still = vv.createStill();
          vv.showStill(still, true);

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
