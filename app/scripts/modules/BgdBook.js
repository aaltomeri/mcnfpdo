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

      var videos
      ,   first_video

      this.$el.css({ width: '100%', height: '100%'});

      $('#module-container').css({opacity: 0});

      // looping through video models
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

      // get all set videos in Layout
      videos = this.getViews();

      // init all video views behaviors
      videos.each(function(view, index, videos) {

        var next = null;

        // do not do anything for last video
        if(index != videos.length-1) {
          next = videos[index+1];
        }

        // init view - i.e. create popcorn instance
        view.init();

        // set video element dimensions to match containers
        view.$el.find('video').css({width: "100%", height: "auto"});

        // hide view as we are showing them sequentially
        view.$el.hide();

        // wrap behavior init in 'canplay' event handler because we need video duration
        view.popcorn.on('canplay', function() {

          // if there is no next video we dont need to setup the mechanism that launches it
          if(!next) return;

          // set random out_point
          var out_point = Math.random()*view.popcorn.duration()
          // define timeupdate handler used to play next video if out_point has been overshot
          ,   play_next = function() {

            // overshooting out_point
            if(this.currentTime() > out_point) {

              console.log(next);

              // remove handler
              this.off('timeupdate', play_next);

              // play next video
              next.$el.fadeIn();
              next.popcorn.play();
              
            }

          }

          // make videos start next video on ending
          view.popcorn.on('timeupdate', play_next);

        });


      });
        
      // get first video
      first_video = videos.first().value()

      // show first video
      first_video.$el.fadeIn();
      // play it
      first_video.popcorn.play();

    },

  });

  BgdBook.destroy = function() {

    console.log('BgdBook destroy');

  }

  // Return the module for AMD compliance.
  return BgdBook;

});
