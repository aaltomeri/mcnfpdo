// News module
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

    wiki_entries.on('reset', function() {
      layout = new History.Views.Layout({collection: this});
    });

    // starting a wikipedia request
    wiki_entries.on('History:WikiEntries:request_start', function(data) {

      layout.$el.find('.loading .request').append(data.model.get('name') + " / ");
      
    });

    // done with the wikipedia request 
    wiki_entries.on('History:WikiEntries:request_done', function(data) {

      var view = new History.Views.WikiView({ model: data.model });
      layout.insertView(view);
      view.render();

    });

    // done with all wikipedia requests
    wiki_entries.on('History:WikiEntries:all_requests_done', function() {

      layout.$el.find('.loading').remove();

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
          _this.each(function(model) {

              wiki_requests.push(_this.fetchWikiData(model));

          });
          
          $.when.apply($, wiki_requests).done(function() {

            console.log('%cALL REQUESTS DONE', "color: orange; font-size: medium");

            _this.trigger('History:WikiEntries:all_requests_done', _this);

          })
          

        }
      );

    },

    fetchWikiData: function(model) {

      var _this = this
      ,   wiki_request = $.getJSON('//fr.wikipedia.org/w/api.php?action=parse&format=json&callback=?', 
        {page:model.get('name'), prop:'text|sections', uselang:'fr', redirects: 1}
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

      data.text = "";//$text.html();

      return data;

    }

  });


  // WikiView
  History.Views.WikiView = Backbone.LayoutView.extend({

    template: 'modules/history/wiki-entry',
    className: 'wiki-entry',

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
