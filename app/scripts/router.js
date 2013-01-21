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

      "BgdMap": "bgdMap",
      "BgdBook": "bgdBook",
      "News": "news",
      "Notebook": "notebook",
      "Tesla": "tesla",
      "Mail": "mail",
      "History": "history",
      "Tabloid": "tabloid",
      "WarTrauma": "warTrauma"

    },

    index: function() {

      // here we call the init function that we have defined for the module
      Intro.init();

    },

    ttb: function(command, time) {

      $('#module-container').empty();

      // if current Chapter exists, call its destroy method
      // if(typeof TTB.model !== "undefined" && TTB.model.get('currentChapter')) {
      //     require(["modules/" + TTB.model.get('currentChapter').name], function(module) {
      //     if(_.isFunction(module.destroy)) module.destroy();
      //   });
      // }

      // here we call the init function that we have defined for the module
      // we pass the optional command and time arguments that will result in the TTB video to be played/paused at a time offset if given
      // 'time' can also be a chapter name - the ttb video playhead will then position it self at the beginning of the chapter
      TTB.init(command, time);

      // play soudtrack (has been initialized in the init call)
      TTB.soundtrack.play();

    },

    notebook: function() {

      this.moduleLauncher('Notebook');

    },
    
    bgdBook: function() {

      this.moduleLauncher('BgdBook');

    },

    bgdMap: function() {

      this.moduleLauncher('BgdMap');

    },

    mail: function() {

      this.moduleLauncher('Mail');

    }, 
    
    tabloid: function() {

      this.moduleLauncher('Tabloid');

    },

    news: function() {

      this.moduleLauncher('News');

    },

    tesla: function() {

      this.moduleLauncher('Tesla');

    },

    history: function() {

      this.moduleLauncher('History');

    },

    warTrauma: function() {

      this.moduleLauncher('WarTrauma');

    },

    moduleLauncher: function(moduleName) {

      this.ttb('pause', moduleName);

      // pause Soundtrack
      TTB.soundtrack.pause();

      TTB.MainView.prepareStageForModule();

      // requiring the module AND calling its init method in the callback
      require(["modules/" + moduleName], function(module) { module.init(); });

    }

  });

  return Router;

});
