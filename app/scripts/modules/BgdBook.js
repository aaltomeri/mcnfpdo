// BgdBook module
define([
  // Application.
  "app",
  "modules/Video",
  "https://www.googleapis.com/customsearch/v1?key=AIzaSyCZyjGSINj8G5wX1RnCX-si_9xptWYRdnU&cx=011524589172753646057:qnfoalr-ilu&q=belgrade+fisera&lr=lang_fr&callback=define",
  "css!../../styles/bgd-book.css"
],

// Map dependencies from above array.
function(app, Video, SearchEngine) {

  console.log(SearchEngine);

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

  BgdBook.Views.SearchResults = Backbone.LayoutView.extend({
    
    
    initialize: function() {

      // hide at start
      this.$el.css({opacity: 0});

      var results = SearchEngine.items;

      for(var index = 0; index < results.length; index++) {
        this.$el.append('<div><p><a href="' + results[index].link + '">' + results[index].htmlTitle + '</a></p></div>');
      }

    }

  });

  // Default View.
  BgdBook.Views.Layout = Backbone.Layout.extend({

    template: "bgd-book",
    id: "bgd-book",

    initialize: function() {

      var videos
      ,   first_video

      this.$el.css({ 
        width: '100%', 
        height: '100%', 
        "-webkit-perspective": '1000px'
      });

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
        this.setView(new Video.Views.Main({model : model, className: model.get('className')}), true);
      }, this);

      // set Search  Results View
      var srView = this.setView('#search-results', new BgdBook.Views.SearchResults(), true);

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // render layout
      this.render();

      $('#module-container').transition({opacity: 1}, 2000);

      // get all video views in Layout (i.e. which model is a Video.Model)
      videos = this.getViews(function(view) { return view.model instanceof Video.Model; });

      // init all video views behaviors
      videos.each(function(view, index, videos) {

        var next = null;

        // do not do anything for last video
        if(index != videos.length-1) {
          next = videos[index+1];
        }
        else {
          //next = videos[0];
        }

        // init view - i.e. create popcorn instance
        view.init();

        var get_grid = function() {
          
          // positioning videos in a grid
          var hz_vdo_cnt = Math.ceil(Math.sqrt(videos.length))
          ,   vt_vdo_cnt = Math.ceil(Math.sqrt(videos.length))
          ,   hz_delta = this.$el.width()/hz_vdo_cnt
          ,   vt_delta = this.$el.height()/vt_vdo_cnt
          ,   w = (100/hz_vdo_cnt) + '%'
          ,   h = (100/vt_vdo_cnt) + '%'
          ,   left = hz_delta*(index%hz_vdo_cnt) + (Math.floor(Math.random() * (10 + 10 + 1)) - 20)
          ,   top = vt_delta * parseInt(index/vt_vdo_cnt) + (Math.floor(Math.random() * (10 + 10 + 1)) - 20)

          return {
            position: 'absolute',
            width: w,
            height: 'auto',
            top: top,
            left: left
          }
          

        }

        var custom_position = {
            position: 'absolute',
            top: view.model.get('position').top,
            left: view.model.get('position').left
          }

        // position view
        view.$el.css(custom_position);
        //view.$el.css($.proxy(get_grid, this)());

        view.$el.css({
          "z-index": index,
          opacity: 0
        });

        // set video element dimensions to match containers
        view.$el.find('video').css({
          width: "100%", 
          height: "auto"
        });

        // create layer that will be used to cover video when it finishes playing
        var overlay = $('<div class="video-overlay" />');
        overlay.css({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'white',
          opacity: 0
        });
        // append overlay
        view.$el.append(overlay);

        // add border?
        view.$el.find('video').css({border: "solid 1px black"});

        // hide view as we are showing them sequentially
        view.$el.hide();

        // wrap behavior init in 'canplay' event handler because we need video duration
        view.popcorn.on('canplay', function() {

          var slice = null;
          // set random out_point
          view.model.set('out_point', view.model.get('out_point')? view.model.get('out_point') : (slice? slice : view.popcorn.duration()))//Math.random()*view.popcorn.duration())//Math.random()*view.popcorn.duration()
          // define timeupdate handler used to play next video if out_point has been overshot
          var play_next = function() {

            var time = null;

            // overshooting out_point
            if(this.currentTime() >= view.model.get('out_point')) {

              //console.log(view.model.get('name') + ' : out point : ' + view.model.get('out_point'));

              // remove handler
              this.off('timeupdate', play_next);
              
              //view.model.set('out_point', view.model.get('out_point') + slice);//(Math.random()*view.popcorn.duration()-view.model.get('out_point')));

              if(view.model.get('out_point') > this.duration()) {
                view.model.set('out_point', slice);
                time = 0;
              }

              var rotation_delta = 1;

              view.$el.css({
                "-webkit-backface-visibility": "hidden"
              });

              
              view.$el.find('.video-overlay').transition({
                opacity: 0
              });

              view.$el.transition({
                opacity: 0.99,
                scale: 0.9,
                rotate3d: '0, 0, 1, ' + (Math.floor(Math.random() * ((rotation_delta + rotation_delta + 1)) - rotation_delta) + 2) + 'deg',
                //rotate3d: '-1, 12, 0, ' + rotation_delta + 'deg',
                //rotate: (Math.floor(Math.random() * (rotation_delta + rotation_delta + 1)) - rotation_delta) + 'deg',
                //rotateZ: '10deg'
              });

              // if there is no next video we dont need to setup the mechanism that launches it
              // but we display the search results
              // and thus we do not pause the video
              if(!next) {
                srView.$el.transition({
                  opacity: 0.99,
                  rotate3d: '0, 0, 1, ' + 1 + 'deg',
                  right: "20px"
                }, 600);
                return;
              };

              view.popcorn.pause(time);

              var left_delta = 20
              ,   top_delta = 20;

              // play next video
              next.$el.show();
              next.$el.transition({
                opacity: 1,
                left: next.$el.position().left + (Math.floor(Math.random() * ((left_delta + left_delta + 1)) - left_delta) + 2),
                top: next.$el.position().top + (Math.floor(Math.random() * ((top_delta + top_delta + 1)) - top_delta) + 2)
              }, 1000);
              next.popcorn.play();
              next.$el.css({"z-index": parseInt(view.$el.css("z-index")) + 1});

              // click on video that has just played
              view.$el.find('.video-overlay').on('click', function() {
                console.log('click');
                $(this).parent().css({'z-index': 1000});
              });
              
            }

          }

          // make videos start next video on ending
          view.popcorn.on('timeupdate', play_next);

        });


      }, this);
        
      // get first video
      first_video = videos.first().value()

      // show first video
      first_video.$el.show();
      first_video.$el.transition({opacity: 1}, 2000);
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
