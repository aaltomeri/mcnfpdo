define([
  // Application.
  "app",

  // Modules
  "modules/Intro", 
  "modules/TTB",

  "modules/Soundtrack"

],

function(app, Intro, TTB, Soundtrack) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({

    routes: {

      "": "index",

      "TTB(/:command)(/:time)": "ttb",

      "BelgradeVille(/:action)(/:index)": "BelgradeVille",
      "RepeterBelgrade": "RepeterBelgrade",
      "CarnetDeNotes(/:action)(/:date)": "CarnetDeNotes",
      "TresCherPere": "TresCherPere",
      "MadeInSerbia(/:command)(/:time)": "MadeInSerbia",
      "HistoireSerbe": "HistoireSerbe",
      "BelgradePlus": "BelgradePlus",
      "BelgradeDirect": "BelgradeDirect",
      "VoixDeBelgrade": "VoixDeBelgrade"

    },

    index: function() {

      // jump to Belgrade Map if iPad
      if(app.isiPad) {
        window.location.replace('/#BelgradeVille');
        $('.no-ipad').remove();
      }

      // here we call the init function that we have defined for the module
      Intro.init();

    },

    ttb: function(command, time) {

      $('#main-container').css({"z-index": 1});

      if(app.isiPad) {
        //app.trigger('goto', 'BelgradeVille');
      }

      // ANALYTICS
      _gaq.push(['_trackEvent', 'TTB', 'Navigation', "command: " + command]);
      _gaq.push(['_trackEvent', 'TTB', 'Navigation', "time or chapter: " + time]);

      _gaq.push(['_trackPageview', 'TTB/#' + time]);

      //if current Chapter exists, call its destroy method
      if(typeof TTB.model !== "undefined" && TTB.model.get('currentChapter')) {

          var module_path = "modules/" + TTB.model.get('currentChapter').name
          ,   _destroy_current_module = function() {

                //console.log(module_path);

                try {
                  require([module_path], function(module) {

                    module.soundtrack.remove();

                    if(_.isFunction(module.destroy)) module.destroy();
                    
                  });
                }
                catch(e) {
                  setTimeout(_destroy_current_module, 200);
                }
              }

          _destroy_current_module();

          $('#module-container').empty();

      }

      // here we call the init function that we have defined for the module
      // we pass the optional command and time arguments that will result in the TTB video to be played/paused at a time offset if given
      // 'time' can also be a chapter name - the ttb video playhead will then position it self at the beginning of the chapter
      TTB.init(command, time);

    },

    CarnetDeNotes: function(action, date) {

      this.moduleLauncher('CarnetDeNotes', action, {date: date});

    },
    
    RepeterBelgrade: function() {

      this.moduleLauncher('RepeterBelgrade');

    },

    BelgradeVille: function(action, index) {

      this.moduleLauncher('BelgradeVille', action, index);

    },

    TresCherPere: function() {

      this.moduleLauncher('TresCherPere');

    }, 
    
    BelgradePlus: function() {

      this.moduleLauncher('BelgradePlus');

    },

    BelgradeDirect: function() {

      this.moduleLauncher('BelgradeDirect');

    },

    MadeInSerbia: function(action, slug) {

      this.moduleLauncher('MadeInSerbia', action, slug);

    },

    HistoireSerbe: function() {

      this.moduleLauncher('HistoireSerbe');

    },

    VoixDeBelgrade: function() {

      this.moduleLauncher('VoixDeBelgrade');

    },

    moduleLauncher: function(moduleName, action, options) {

      // init TTB
      this.ttb('pause', moduleName);
     
      //app.debug();

      var chapter = _.find(TTB.model.attributes.chapters, function(chapter) { 
        return  chapter.name.toLowerCase() == moduleName.toLowerCase();
      }) 

      TTB.model.set('currentChapter', chapter);
            
      TTB.MainView.prepareStageForModule();
      
      TTB.soundtrack.pause(7000);

      TTB.inChapter = true;

      var module_path = "modules/" + moduleName
          ,   _load_module = function(action, options) {

                try {
                  // requiring the module AND calling its init method in the callback
                  require(["modules/" + moduleName], function(module) { 

                    var config = app.chapters.find(function(model) { return model.get('name') == moduleName });

                    ////////////////
                    // Soundtrack //
                    ////////////////
                    var chapter_soundtracks = new Soundtrack.Collection()

                    // build collection for this chapter Soundtrack View
                    // it is built out of an array of soundtracks names
                    // that we fill in the chapters config file
                    _.each(config.get('soundtrack'), function(soundtrack_name) {

                      // get sound from sountrack name
                      var soundtrack_model = app.sounds.find(function(model) { return model.get('name') == soundtrack_name });

                      // add new Soundtrack model to collection
                      chapter_soundtracks.add(soundtrack_model);

                    })

                    module.soundtrack = new Soundtrack.View({ 
                      collection: chapter_soundtracks
                    });

                    module.soundtrack.play();

                    module.init(action, options); 

                  });
                }
                catch(e) {
                  setTimeout(_load_module, 200);
                }
              }

      _load_module(action, options);

    }

  });

  return Router;

});
