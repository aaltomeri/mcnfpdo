// News module
define([
  // Application.
  "app",
  "modules/Video",
  "css!../../styles/bgd-book.css"
],

// Map dependencies from above array.
function(app, Video) {

  // Create a new module.
  var BgdBook = app.module();

  BgdBook.init = function() {

    console.log('BgdBook INIT');

    var layout;

    var videos = new BgdBook.Collection();

    videos.on('reset', function() {
      layout = new BgdBook.Views.Layout({ collection: this });
    });

    videos.fetchData();

  }

  // Default Model.
  BgdBook.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  BgdBook.Collection = Backbone.Collection.extend({

    model: Video.Model,

    fetchData: function() {

      var _this = this;
      $.get('data/bgdbook-videos.txt').done(

        function(data) { 

          _this.reset($.parseJSON(data));

        }
      );

    }

  });

  // Default View.
  BgdBook.Views.Layout = Backbone.Layout.extend({

    template: "bgd-book",
    id: "bgd-book",



    initialize: function() {

      this.$el.css({ width: '100%', height: '100%'});

      $('#module-container').css({opacity: 0});

      this.collection.each(function(model) {

        // temporary
        // replacing Vimeo base url to allow for tests with local .mp4 videos with same ID
        // ex: http://player.vimeo.com/video/57062884
        // becomes medias/videos/57062884.mp4
        var sources = model.get('sources');
        _.each(sources, function(el, index, list) { 
          sources[index] = el.replace('http://player.vimeo.com/video/','medias/videos/') + '.mp4';
        });

        // setting views on Layout - adding true as last argument to append rather than replace
        this.setView(new Video.Views.Main({model : model, className: 'portrait'}), true);
      }, this);

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // render layout
      this.render();

      $('#module-container').transition({opacity: 1}, 2000);

      // init all video views
      this.getViews().each(function(view) {
        view.init();
        view.$el.find('video').css({width: "100%", height: "auto"});
      });

    },

  });

  BgdBook.destroy = function() {

    console.log('BgdBook destroy');

  }

  // Return the module for AMD compliance.
  return BgdBook;

});
