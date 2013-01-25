// Notebook module
define([
  // Application.
  "app",
  "modules/Video",
  "css!../../styles/notebook.css"

],

// Map dependencies from above array.
function(app, Video) {

  // Create a new module.
  var Notebook = app.module();

  Notebook.init = function() {

    console.log('Notebook INIT');

    var layout
    ,   days = new Notebook.Days();

    days.on('Notebook:Days:entries_ready', function() {
      layout = new Notebook.Views.Layout({collection: this});
    });

    days.fetchData();

  }

  // Default Model.
  Notebook.Day = Backbone.Model.extend({
  
  });

  // Default Collection.
  Notebook.Days = Backbone.Collection.extend({
    
    model: Notebook.Day,
    wikiData: null,
    wikiText: null,
    currentDay: null,


    fetchData: function() {

      var _this = this;
      $.get('data/notebook-days.txt').done(

        function(data) { 

          _this.reset($.parseJSON(data));

          // global scope callback for wikipedia data
          //Popcorn.getScript( "//fr.wikipedia.org/w/api.php?action=parse&props=text&redirects&page=Mars_2006&format=json&callback=NoteBookParseWikiData");
          $.getJSON('//fr.wikipedia.org/w/api.php?action=parse&format=json&callback=?', {page:'Mars_2006', prop:'text|sections', uselang:'fr'}, $.proxy(_this.parseWikiData, _this));
        }
      );

    },

    parseWikiData: function(data) {

      var data = this.wikiData = data.parse
      ,   $text = this.wikiText = $('<div />').append(data.text['*'])

      // remove editsection links
      $text.find('.editsection').remove();

      // add wikipedia absolute url for wikipedia links
      // also make link open in another tab/window
      $text.find('[href*=wiki]').each(function() {
        $(this).attr('href', 'http://fr.wikipedia.com/' + $(this).attr('href'));
        $(this).attr('target', '_blank');
      });

      // add infos  to days models
      this.each(function(model) {

        // get section from wikipedia data
        // this corresponds to a day in the month
        var section = data.sections[model.get('number')]
        ,   $anchor  = $text.find('*').filter('[id="'+ section.anchor +'"]')
        ,   wiki_entry
        ,   mcnfpdo_entries
        ,   mcnfpdo_entry

        // set anchor text on model instance to be used later
        model.set('anchor', section.anchor);

        // set text for Day
        // searching for anchor which is an actual element id on the wiki page
        // it will be a jQuery Object - a div containing an h3 title + an unordered list (as of 2012-01-10) to which we will be able to append data
        wiki_entry = $('<div />');
        wiki_entry.append($anchor.parent().clone());
        wiki_entry.append($anchor.parent().next().clone());

        // creating li elements for each fictional entry
        // appending fictional data to the day entry
        mcnfpdo_entries = model.get('mcnfpdo_entries');
        for(var index = 0; index < mcnfpdo_entries.length; index++) {
          mcnfpdo_entry = mcnfpdo_entries[index];
          li = $('<li />').html(mcnfpdo_entry);
          wiki_entry.children('ul').prepend(li);
        }

        model.set('wiki_entry', wiki_entry);

      });

      this.trigger('Notebook:Days:entries_ready', this);

    },

    setCurrentDay: function(model) {
      this.currentDay = model;
      this.trigger('change:currentDay');
    }

  });

  // Wikipedia Entries View
  Notebook.Views.Entries = Backbone.LayoutView.extend({

    initialize: function() {

      this.collection.each(function(model) {

        this.$el.append(model.get('wiki_entry'));

      }, this);
    },

    scrollTo: function(top) {

      this.$el.parent().animate({scrollTop: top});

    }

  });

  // Day View
  Notebook.Views.Day = Backbone.LayoutView.extend({

    template: 'modules/notebook/calendar-day',
    tagName: 'li',

    events: {

      "click a"   : "onClickHandler"

    },

    initialize: function() {

      if(this.model.get('sources')) {
        this.$el.addClass('important');
      }

    },

    onClickHandler: function(e) {

      e.preventDefault();

      this.model.collection.setCurrentDay(this.model);

    },

    // Provide data to the template
    serialize: function() {
      return this.model.toJSON();
    }


  });

  // Calendar View
  Notebook.Views.Calendar = Backbone.LayoutView.extend({

    tagName: 'ul',

    initialize: function() {

    },

    beforeRender: function() {

      this.collection.each(function(model) {

        this.insertView(new Notebook.Views.Day({model: model}));

      }, this);


    }

  });

  // Default View.
  Notebook.Views.Layout = Backbone.Layout.extend({

    template: "notebook",

    views: {},

    afterRender: function() {
      
      // this.videoView.init();
      // this.videoView.popcorn.play();

    },

    initialize: function() {

      var calendarView, entriesView, videoView

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // setting Calendar and Entries views on layout here to pass it the main collection (days)
      // does not seem to work in the views object directly
      calendarView = this.setView("#calendar", new Notebook.Views.Calendar({ collection: this.collection }));
      entriesView = this.setView("#entries", new Notebook.Views.Entries({ collection: this.collection }));


      this.videoView = this.setView("#notebook-video", new Video.Views.Main());

      this.videoView.model = new Video.Model({

        name: 'Notebook-video',
        //sources: ['https://www.youtube.com/watch?v=XAJZF7rJXG0'],
        dimensions: { width: '100%', height: '100%' },
        autoplay: true,
        enablePlayPause: false,
        chapters: []

      });



      this.collection.on('change:currentDay', function() { 

        var currentDay = this.collection.currentDay
        ,   anchor = currentDay.get('anchor')
        ,   top    =  entriesView.$el.find('[id*="' + anchor + '"]').position().top
        ,   sources = currentDay.get('sources')
        ,   youtube_force_html5_param = ""

        entriesView.scrollTo(top);

        if(sources) {

          // sources is a simple string 
          if(_.isString(sources)) {

              // if youtube url we want html5
              if(sources.search(/youtube/) != -1) {
                youtube_force_html5_param = "&html5=1";
              }

              // we need an array in any case
              sources = new Array(sources + youtube_force_html5_param)
          }

          this.videoView.model.set('sources', sources);

          this.videoView.init();

          // despite autoplay youTube videos seem to pause
          // so we force play here
          // have not tested with other sources
          this.videoView.popcorn.play();

        }
        else {
          if(this.videoView.popcorn) {
            this.videoView.popcorn.destroy();
            delete this.videoView.popcorn;
            this.videoView.$el.empty();
          }
        }

      }, this);

      // render layout - effectively also rendering subviews 
      this.render();

      $('#module-container').transition({opacity: 1}, 2000);

    },

  });

  Notebook.destroy = function() {

    console.log('Notebook destroy');

  }

  // Return the module for AMD compliance.
  return Notebook;

});
