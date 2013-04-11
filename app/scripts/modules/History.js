// History module
define([
  // Application.
  "app",
  "css!../../styles/history.css",
  "vendor/jquery-ui-1.10.1.custom.min"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var History = app.module();

  History.init = function() {

    console.log('History INIT');

    var layout
    ,   wiki_entries = new History.WikiEntries();

    // create layout after entries list has been loaded and Collection has been populated
    wiki_entries.on('reset', function() {
      layout = new History.Views.Layout({collection: this});
    });

    // starting a wikipedia request
    wiki_entries.on('History:WikiEntries:request_start', function(data) {

      
    });

    // done with the wikipedia request 
    wiki_entries.on('History:WikiEntries:request_done', function(data) {

      var view = new History.Views.WikiView({ model: data.model });
      layout.insertView(view);

      view.render();

      //view.$el.hide();

      var _l = Math.random() * 20 + 10 //(Math.random() > .5)? layout.$el.width() : -view.$el.width()-20
      ,   _t = Math.random() * 20 + 40 //(Math.random() > .5)? layout.$el.height() : -view.$el.height()-20

      view.$el.css({
        left: _l,
        top: _t
      });

    });

    // done with all wikipedia requests
    wiki_entries.on('History:WikiEntries:all_requests_done', function() {

      layout.$el.find('.loading').remove();

      layout.getViews(function(view, index) {

        // return;

        // spread cards on canvas
        
        var _l = Math.ceil(Math.random() * (layout.$el.width() - view.$el.width()))
        ,   _t = Math.round(Math.random() * (layout.$el.height() - view.$el.height()));

        view.$el.show();

        view.$el.transition({ 
          left: _l,
          top: _t,
          opacity: 1,
          delay:  100 * index 
        }, 
        function() { 
          view.enabled = true; 
        });

      });

    });

    wiki_entries.fetchData();

  }

  // Default Model.
  History.WikiEntry = Backbone.Model.extend({
  
  });

  // Collection for Wikipedia Entries
  History.WikiEntries = Backbone.Collection.extend({

    model: History.WikiEntry,
    wikiData: null,

    fetchData: function() {

      var _this = this
      ,   wiki_requests = new Array()

      $.get('data/history-wiki-entries.txt').done(

        function(data) { 

          _this.reset($.parseJSON(data));

          // loop through parsed entries
          // we will fecth the wikipedia entry and popupate a 'entry' key with the parsed wiki text
          _this.each(function(model, index) {

              setTimeout(function() {

                // add Promise returned by the fetch method to array
                wiki_requests.push(_this.fetchWikiData(model));

                // add all requests to global promise
                // when all have been processed
                if(wiki_requests.length == _this.models.length) {

                   $.when.apply($, wiki_requests).done(function() {

                    console.log('%cALL REQUESTS DONE', "color: orange; font-size: medium");

                    _this.trigger('History:WikiEntries:all_requests_done', _this);

                  });

                }

              }, 500 * index);

          });
          
         
          

        }
      );

    },

    fetchWikiData: function(model) {

      var _this = this
      ,   wiki_request = $.getJSON('//fr.wikipedia.org/w/api.php?action=parse&format=json&callback=?', 
        { 
          page: model.get('name'), 
          prop: 'text|sections', 
          uselang: 'fr', 
          redirects: 1
        }
      );

      _this.trigger('History:WikiEntries:request_start', { model: model });

      wiki_request.done(function(data) {

        // skip if data is undefined
        // it seems to hapen for some reason
        if(typeof data == "undefined" || data.error) {
          console.error(model.get('name') + ' has not been found on Wikipedia');
          return;
        }

        var data = _this.parseWikiData(data);

        model.set('name', data.title);
        model.set('text', data.text);

        console.log(model.get('name'));

        _this.trigger('History:WikiEntries:request_done', { request: data.title, model: model });


      })

      return wiki_request;

    },

    parseWikiData: function(data) {

      // skip on error
      if(data.error)
        return;

      var data = this.wikiData = data.parse
      ,   text = data.text['*']
      ,   $text = $('<div />').append(text)

      // remove editsection links
      $text.find('.editsection').remove();

      // add wikipedia absolute url for wikipedia links
      // also make link open in another tab/window
      $text.find('[href*=wiki]').each(function() {
        $(this).attr('href', 'http://fr.wikipedia.com/' + $(this).attr('href'));
        $(this).attr('target', '_blank');
      });

      data.text = $text.html();

      return data;

    }

  });


  // WikiView
  History.Views.WikiView = Backbone.LayoutView.extend({

    template: 'modules/history/wiki-entry',
    className: 'wiki-entry',

    enabled: false,

    events: {
      "click .btn-show-entry": "toggleEntry"
    },

    initialize: function() {

      this.$el.draggable({ 
        handle: '.handle',
        cursor: 'move',
        stack: ".wiki-entry",
        containment: "parent",
        distance : 0,
        delay: 0
      });

    },

    toggleEntry: function() {
      
      // abort if not active yet
      if(!this.enabled) {
        return;
      }

      if(this.$text.is(':visible')) {

        this.$text.hide();
        this.$btn_show_entry.addClass('icon-circle-arrow-down');
        this.$btn_show_entry.removeClass('icon-circle-arrow-up');

      }
      else {

        // ANALYTICS
        _gaq.push(['_trackEvent', 'History', 'View', this.model.get('name')]);
        this.$text.show();
        this.$btn_show_entry.removeClass('icon-circle-arrow-down');
        this.$btn_show_entry.addClass('icon-circle-arrow-up');

      }

    },

    afterRender: function() {

      this.$text = this.$el.find('.text');
      this.$btn_show_entry = this.$el.find('.btn-show-entry');


    },

    // Provide data to the template
    serialize: function() {
      return this.model.toJSON();
    }

  });

  // Default View.
  History.Views.Layout = Backbone.Layout.extend({

    template: "history",

    initialize: function() {

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // render layout
      this.render();

      $('#module-container').transition({opacity: 1}, 2000);

    },

  });

  History.destroy = function() {

    console.log('History destroy');

  }

  // Return the module for AMD compliance.
  return History;

});
