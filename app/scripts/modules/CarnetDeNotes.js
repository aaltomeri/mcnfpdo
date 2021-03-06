// CarnetDeNotes module
define([
  // Application.
  "app",
  "modules/Video",
  "css!../../styles/CarnetDeNotes.css"

],

// Map dependencies from above array.
function(app, Video) {

  // Create a new module.
  var CarnetDeNotes = app.module();

  CarnetDeNotes.init = function(action, options) {

    console.log('CarnetDeNotes INIT');

    var layout
    ,   days = new CarnetDeNotes.Days();

    days.on('CarnetDeNotes:Days:entries_ready', function() {

      var number
      ,   model

      layout = new CarnetDeNotes.Views.Layout({collection: this});

      if((action && action == 'goto') && (options && options.date)) {

        number = options.date.split('-')[0];
        model = this.at(number-1);

        if(model) {
          this.setCurrentDay(model);
        }

      }

    });

    days.fetchData();

  }

  // Default Model.
  CarnetDeNotes.Day = Backbone.Model.extend({
  
  });

  // Default Collection.
  CarnetDeNotes.Days = Backbone.Collection.extend({
    
    model: CarnetDeNotes.Day,
    wikiData: null,
    wikiText: null,
    currentDay: null,


    fetchData: function() {

      var _this = this
      ,   wiki_request
      $.get('data/CarnetDeNotes-days.txt').done(

        function(data) { 


          _this.reset($.parseJSON(data));

          // global scope callback for wikipedia data
          //Popcorn.getScript( "//fr.wikipedia.org/w/api.php?action=parse&props=text&redirects&page=Mars_2006&format=json&callback=CarnetDeNotesParseWikiData");
          wiki_request = $.getJSON('//fr.wikipedia.org/w/api.php?action=parse&format=json&callback=?', {page:'Mars_2006', prop:'text|sections', uselang:'fr'}, $.proxy(_this.parseWikiData, _this));
        
          wiki_request.fail(function() { window.location.reload(); })

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

      // remove Edit links
      $text.find('.mw-editsection').remove();

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

      this.trigger('CarnetDeNotes:Days:entries_ready', this);

    },

    setCurrentDay: function(model) {
      this.currentDay = model;
      this.trigger('change:currentDay');
       _gaq.push(['_trackEvent', 'CarnetDeNotes', 'Navigation', "day: " + model.get('number')]);
    }

  });

  // Wikipedia Entries View
  CarnetDeNotes.Views.Entries = Backbone.LayoutView.extend({

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
  CarnetDeNotes.Views.Day = Backbone.LayoutView.extend({

    template: 'modules/CarnetDeNotes/calendar-day',
    tagName: 'td',

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
  CarnetDeNotes.Views.Calendar = Backbone.LayoutView.extend({

    tagName: 'table',

    initialize: function() {

    },

    afterRender: function() {

      var view = this
      ,   day_view = null
      ,   date = null
      ,   wd = 0
      ,   row_id = 0
      ,   row_str = ''
      ,   $row = null
      ,   week_days = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];

      // first row represents the day of the week
      row_str = '<tr>';
      for(var _wd = 0; _wd < 7; _wd++) {
        date = new Date(2006, 2, _wd);
        row_str += '<td>' + week_days[_wd] + '</td>'
      }
      row_str += '</tr>';

      this.$el.append(row_str);

      // dirty hack to push first day under the right day of the week
      var days_array = this.collection.toArray();
      days_array.unshift(null);
      days_array.unshift(null);

      _.each(days_array, function(model) {  

        if(model)
          date = new Date(2006, 2, model.get('number'));

        if(wd%7 == 0) {// beginning of the week

          row_str = '<tr id="calendar-row-'+ row_id + '" />';
          view.$el.append(row_str);
          $row = $('#calendar-row-'+row_id);

          // increment row id
          row_id++;

          // reset week day
          wd = 0;

        }

        if(model)
          day_view = this.insertView('#' + $row.get(0).id, new CarnetDeNotes.Views.Day({model: model})).render();
        else
          $row.append('<td></td>');

        // increment week day
        wd++;

      }, this);


    }

  });

  // Default View.
  CarnetDeNotes.Views.Layout = Backbone.Layout.extend({

    template: "CarnetDeNotes",

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
      calendarView = this.setView("#calendar .body", new CarnetDeNotes.Views.Calendar({ collection: this.collection }));
      entriesView = this.setView("#entries", new CarnetDeNotes.Views.Entries({ collection: this.collection }));


      this.videoView = this.setView("#CarnetDeNotes-video", new Video.Views.Main());

      this.videoView.model = new Video.Model({

        name: 'CarnetDeNotes-video',
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

        var date = currentDay.get('number') + '-mars-2006';
        history.pushState({},"","#CarnetDeNotes/goto/"+date);

        if(sources) {

          // sources is a simple string 
          if(_.isString(sources)) {

              // if youtube url we want html5
              if(sources.search(/youtube/) != -1) {
                //youtube_force_html5_param = "&html5=1";
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

  CarnetDeNotes.destroy = function() {

    console.log('CarnetDeNotes destroy');

  }

  // Return the module for AMD compliance.
  return CarnetDeNotes;

});
