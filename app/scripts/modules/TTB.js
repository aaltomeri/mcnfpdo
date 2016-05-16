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

    // switch skip-intro to back to intro link
    $('#skip-intro-link').attr('href', '/').html('intro');

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
        { name: "BelgradeVille",title: "1/ Belgrade Ville", start: 17, end: 23, description: "Baltasar s'est promené dans Belgrade" },
        { name: "RepeterBelgrade", title: "2/ Répéter Belgrade", start: 27, end: 33, description: "Belgrade, la pièce d'Angélica Liddell, monté par Julien Fisera. Première le 18 mars à la Comédié de Sant Etienne" },
        { name: "CarnetDeNotes", title: "3/ Carnet de notes", start: 37, end: 43, description: "Mars 2006, Baltasar est à Belgrade. C'est l'enterrement de Milosevic. Quelques notes mais surtout d'autres choses se passent ailleurs." },
        { name: "TresCherPere", title: "4/ Très cher père", start: 46, end: 52, description: "Baltasar est venu à Belgrade pour son père. Ils ont des rapports compliqués." },
        { name: "BelgradePlus",title: "5/ Belgrade +", start: 54, end: 61, description: "Petites promenades du côté obscur" },
        { name: "BelgradeDirect", title: "6/ Belgrade Direct", start: 62, end: 67, description: "Belgrade en direct" },
        { name: "MadeInSerbia",title: "7/ Made in Serbia", start: 69, end: 75, description: "La Serbie, ah oui ... Nicolas MadeInSerbia etc." },
        { name: "HistoireSerbe",title: "8/ Histoire serbe", start: 77, end: 83, description: "Mais dans les faits ? Qu'est ce qui s'est passé ? Comment est ce qu'on peut expliquer ?" },
        { name: "VoixDeBelgrade", title: "9/ Voix de Belgrade", start: 85, end: 90, description: "Tous parlent, ou pensent, tous marchent ..." },
      ],
      buttons: [
        {type: 'info', text: '?', over_text: 'en savoir plus', visible: true },
        {type: 'twitter-share', text: 't', over_text: 'partager sur twitter', visible: true },
        {type: 'facebook-share', text: 'f', over_text: 'partager sur facebook', visible: true },
        {type: 'back-to-ttb', text: 'Poursuivre l\'exploration', visible: !app.isiPad },
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
    
    // Set TTB model to be used throughout the application
    TTB.model = video_model;

    ////////////////
    // video view //
    ////////////////
    
    var video_view = new Video.Views.Main({ model: video_model }),
    // actual main view for this module
    ttb_view = TTB.MainView = new TTB.Views.Main({ 
      video_view: video_view,
      model: video_model
    });
      

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

      this.initBehaviors();

      TTB.started = true;

      app.trigger('module:ttb:ready', TTB);

    },

    createButton: function(button_o) {

        var v = this
        ,   vv = this.vv
        ,   $bt =  $('<button class="btn btn-tool" ></button>')
        ,   enter_event = app.isiPad? 'touchstart' : 'mouseenter'
        ,   leave_event = app.isiPad? 'touchend' : 'mouseleave'

        $bt.attr('id', button_o.type+'-btn');
        $bt.html(button_o.text);
        $bt.data('type', button_o.type);
        $bt.data('over-text', button_o.over_text);
        $bt.data('text', button_o.text);

        $bt.on('click', $.proxy(this.buttonsClickHandler, this));
        
        if(!app.isiPad) {        
          $bt.on(enter_event, $.proxy(this.buttonsEnterHandler, this));
          $bt.on(leave_event, $.proxy(this.buttonsLeaveHandler, this));
        }

        

        $('#main').append($bt);

        return $bt;

    },

    createButtons: function() {

      var buttons = this.model.get('buttons')

      _.each(buttons, $.proxy(function(button) {

          var $bt 

          if(!button.visible)
            return;

          $bt = this.createButton(button);

          $bt.transition({opacity: 1});

        }
        , this)
      );

    },

    destroyButtons: function() {

      var buttons = this.model.get('buttons');

      _.each(buttons, $.proxy(function(button) {

          var $bt = $('#main').find('#' + button.type + '-btn')

          $bt.transition({opacity: 0}, function() {
                $bt.remove();
            });

          $bt.off('mouseenter', this.buttonsEnterHandler);
          $bt.off('mouseleave', this.buttonsLeaveHandler);
          $bt.off('click', this.buttonsClickHandler);

        }
        , this)
      );

    },

    buttonsEnterHandler: function(e) {

      $bt = $(e.target)

      $bt.html($bt.data('over-text'));

      switch($bt.data('type')) {

        case 'info':
              this.showInfoPanel();
            break;

      }

    },

    buttonsLeaveHandler: function(e) {

      $bt = $(e.target)

      $bt.html($bt.data('text'));

      switch($bt.data('type')) {

        case 'info':
            this.hideInfoPanel();
            break;

        default:
          break;

      }

    },

    buttonsClickHandler: function(e) {

        var $bt = $(e.target)

        switch($bt.data('type')) {

          case 'info':
            if(app.isiPad) {
              this.toggleInfoPanel();
            }
            break;

          case 'back-to-ttb':
            this._backToTtb();
            break;

          case 'twitter-share':
            var share_url = 'http://api.addthis.com/oexchange/0.8/forward/twitter/offer?'
            + 'url=' + encodeURIComponent(window.location.href)
            + '&text=' + app.title + " | " + encodeURIComponent(TTB.model.get('currentChapter').title)
            + '&pubid=' + window.addthis_config.pubid
            console.log(share_url);
            window.open(share_url);
            
            break;

          case 'facebook-share':
            var share_url = 'http://api.addthis.com/oexchange/0.8/forward/facebook/offer?'
            + 'url=' + window.location.href
            + '&title=' + app.title + " | " + encodeURIComponent(TTB.model.get('currentChapter').title)
            + '&description=' + app.title + " | " + encodeURIComponent(TTB.model.get('currentChapter').title)
            + '&pubid=' + window.addthis_config.pubid

            window.open(share_url);
            
            break;

        }

    },

    toggleInfoPanel: function() {

      var $bt = $('#info-btn')

      if($('#chapter-info-panel').is(':visible')) {
        this.hideInfoPanel();
        if(app.isiPad)
          $bt.html($bt.data('text'));
      }
      else {
        this.showInfoPanel();
        if(app.isiPad)
          $bt.html('x');
      }


    },

    showInfoPanel: function() {

      var $panel = $('#chapter-info-panel')

      $panel.html($('#chapter-info-'+TTB.model.get('currentChapter').name).html());

      $panel.show();
      //$panel.transition({opacity: 0.9});

    },

    hideInfoPanel: function() {

      var $panel = $('#chapter-info-panel')

      $panel.hide();
      //$panel.transition({opacity: 0}, function() { });

    },

    prepareStageForModule: function() {

      this.disablePlayPause();

      this.createButtons();

      if(!app.isiPad)
        this.enableBackToTtb();

    },

    enableBackToTtb: function(key) {

      $('body').on('keydown', {key: 32}, $.proxy(this._keydownHandler, this));

    },

    disableBackToTtb: function() {
      
      $('body').off('keydown', this._keydownHandler);

    },

    _keydownHandler: function(e) {

      if(!e.data.key)
        throw "This handler needs an event data 'key' property";

      if(e.which == e.data.key) {
        this._backToTtb( );
      }

    },

    _backToTtb: function() {

      var vv = this.vv;

      // prevent the click event to bubble up to #main 
      // even though at the time of the click on the button the play/pause mechanisem on #main was disabled
      // it got re-enabled before the end of the bubbling phase
      // e.stopPropagation();

      // go to end of current chapter
      app.trigger('goto', 'TTB/play/' + vv.model.get('currentChapter').end);
      
      this.destroyButtons();
      this.hideInfoPanel();
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


      // START
      vp.on('canplay', function() {

          // do not show intro carton
          // if we are starting somewhere after the beginning
          if(this.currentTime() > 0)
            return;

          // show still
          var still = vv.createStill()
          ,   template = 'ttb_intro'

          vv.showStill(still, true);

          $.get('templates/'+template+'.html', function(data) {
            vv.showOverlay(
              data,
              {
                background: "transparent", 
                opacity: 0.8 
              }
            );
          });

      });

      // SHOW CHAPTER NAME
      _.each(this.model.get('chapters'), function(chapter) {

          var start = chapter.start
          ,   end = chapter.end

          vp.code({

            start: start,
            end: end,

            onStart: function(options) {

              vv.currentChapter = chapter;

              vv.showOverlay(
                  '<p class="chapter-title ' + chapter.name + '">' + chapter.title + '<br/>'
                + '<span class="infos">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cliquez pour entrer</span></p>', 
                { opacity: 0.8, background: 'transparent' }
              );

              // hide overlay if we got directly to a chapter
              if(TTB.inChapter)
                vv.hideOverlay(); 
                  
            },

            onEnd: function() {

              vv.hideOverlay(); 

            }

          });

      });

      // END CREDITS
      vp.code({

        start: 95,
        end: 110,
        onStart: function() {

          var template = 'end_credits_1'

          $.get('templates/'+template+'.html', 
            function(data) {
              vv.showOverlay(data, { background: "transparent", opacity: 0.8 } );
          });

          _this.disablePlayPause();

        },

        onEnd: function() {

            vv.hideOverlay(); 

        }

      });

      vp.code({

        start: 110,
        end: 120,
        onStart: function() {

          var template = 'end_credits_2'

          $.get('templates/'+template+'.html', 
            function(data) {

              // hide still image
              vv.hideStill();

              vv.showOverlay(data, { background: "transparent", opacity: 0.8 } );

          });

          vv.popcorn.pause();
          _this.disablePlayPause();
         

          // allow click on links in chapters menu
          $('#main-container').css({"z-index": 3});


        },

        onEnd: function() {

        }

      });


      vp.on('timeupdate', function() {});

       // when PLAYING the video ...
      vp.on('play', function() {
        
        TTB.inChapter = false;

        vv.hideOverlay();

        // hide still image
        vv.hideStill();

        if(TTB.soundtrack.popcorn.paused()) {
          TTB.soundtrack.play(TTB.soundtrack.popcorn.currentTime(), 2000);
        }

      });

      // when PAUSING the video
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
          return;

          //get next chapter
          chapter = vv.model.getChapterNextByTime(vp.currentTime());

          // abort if no chapter has been found
          if(!chapter) {

            //app.trigger('goto', 'TTB');

            return;

          }

          //show some feedback that no action is possible at this time
          vv.showOverlay('<p>Prochain chapitre<br /><strong>'+ chapter.title +'</strong></p>', 
            {background: "transparent", opacity: 0.8 }
          );

          setTimeout(function() { vv.hideOverlay(); vp.play();}, 1000);

        }

      });

    }

  });

  // Return the module for AMD compliance.
  return TTB;

});
