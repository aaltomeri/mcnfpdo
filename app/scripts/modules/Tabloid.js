// News module
define([
  // Application.
  "app",
  "modules/Video",
],

// Map dependencies from above array.
function(app, Video) {

  // Create a new module.
  var Tabloid = app.module();

  Tabloid.init = function() {

    console.log('Tabloid INIT');

    var videos = new Tabloid.Collection();

    var layout = new Tabloid.Views.Layout( {collection: videos });

    videos.on('reset', function() {

      layout.playSet();

    });

    videos.fetchData();
   

  }

  // Default Model.
  Tabloid.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  Tabloid.Collection = Backbone.Collection.extend({
    
    model: Video.Model,

    fetchData: function() {

      var youtube_feed_url = '//gdata.youtube.com/feeds/api/videos?callback=?'
      ,   _this = this
      ,   search_terms = ["belgrade", "nightlife+belgrade", "beograd", "belgrade+chipmunk", "turbofolk"]
      ,   search_term = search_terms[Math.floor(Math.random()*search_terms.length)]
      
      console.log("search_term: " + search_term);
     
      $.getJSON(youtube_feed_url, {
          v:2, 
          alt:'json-in-script', 
          format:'5',
          q: search_term,
          "start-index": Math.floor(Math.random() * 100),
          "max-results": 4
        }, 
        $.proxy(_this.parseYoutubeData, _this)
      );

    },

    parseYoutubeData: function(data) {

      console.log(data);

      // turning entries into an array of mcnfpdo Videos
      // same model than other modules use
      // 
      var videos = new Array();

      _.each(data.feed.entry, function(entry) {

        var video = {

          "name": entry.title.$t,
          "sources": entry.link[0].href,
          "dimensions": {},
          "position": {},

        }

        videos.push(video);

      });
      
      this.reset(videos);

    }

  });

  // Default View.
  Tabloid.Views.Layout = Backbone.Layout.extend({

    template: "tabloid",
    n_videos_played_in_set: 0,

    initialize: function() {

      var layout = this;

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // render layout
      this.render();
      
      /**
       * All dynically added elements must be added after render since render load a template and replaces $el.html with it
       */
      
      // next button for debugging
      var next_bt = $('<button>NEXT</button>');
      next_bt.css({position: "absolute", top: 0, left: 0, "z-index": 200})
      this.$el.append(next_bt);

      next_bt.on('click', function() { layout.collection.fetchData(); });

      $('#module-container').transition({opacity: 1}, 2000);

    },



    playSet: function() {
      
      var videos = this.collection
      ,   layout = this;

      this.getViews(function(view) { return view.$el.hasClass('video'); }).each(function(view) {
        view.remove();
      });

      this.n_videos_played_in_set = 0;

      // looping through video models
      this.collection.each(function(model, index) {

        // turn single source string into an array for consistency
        if(_.isString(model.get('sources'))) {
          model.set('sources', new Array(model.get('sources')));
        }

        // alter video sources if need be
        var sources = new Array();
        _.each(model.get('sources'), function(source) {

          // force html5 video for youtube
          if(source.search(/youtube/) != -1) {
            source += "&html5=1";
          }

          // add modified source
          sources.push(source)
          
        });

        // replace sources by modified ones
        model.set('sources', sources);

        // setting views on Layout - adding true as last argument to append rather than replace
        var vv = this.setView(new Video.Views.Main({model : model, className: "video"}), true);

        var hz_vdo_cnt = Math.ceil(Math.sqrt(videos.length))
        ,   vt_vdo_cnt = Math.ceil(Math.sqrt(videos.length))
        ,   hz_delta = this.$el.width()/hz_vdo_cnt
        ,   vt_delta = this.$el.height()/vt_vdo_cnt
        ,   w = Math.ceil((100/hz_vdo_cnt)) + '%'
        ,   h = Math.ceil((100/vt_vdo_cnt)) + '%'
        ,   left = Math.floor(hz_delta*(index%hz_vdo_cnt))// + (Math.floor(Math.random() * (10 + 10 + 1)) - 20)
        ,   top = Math.floor(vt_delta * parseInt(index/vt_vdo_cnt))// + (Math.floor(Math.random() * (10 + 10 + 1)) - 20)

        var vv_css = {
          position: 'absolute',
          top: top,
          left: left,
          width: w,
          height: h,
          "z-index": index
          //display: "none"
        }

        // position view
        vv.$el.css(vv_css);
        vv.render();
        vv.init();
        vv.popcorn.play(); 
        vv.popcorn.pause(); 

        vv.popcorn.on('loadedmetadata', function() {
          this.hasPlayed = false;
        });

      }, this);

      //setInterval(function() { layout.playRdm(); }, 3000);
      layout.playRdm();

    },

    playRdm: function(index) {

      console.log(" -------- playRdm ------- " );

      // play one random video from the set
      var views = this.getViews().value()
      ,   layout = this
      ,   index = index? index : Math.floor(Math.random()*views.length)
      ,   vv = views[index]

      if(this.n_videos_played_in_set == views.length) {
        this.collection.fetchData();
        return;
      }

      console.log("index: " + index);
      console.log("vv: " + vv);
      console.log("vv popcorn: " + vv.popcorn);
      console.log("hasPlayed: " + vv.popcorn.hasPlayed);

      if(vv.popcorn.hasPlayed) {
        layout.playRdm();
        return;
      }

      if(!isNaN(vv.popcorn.duration()) && vv.popcorn.duration() > 0) {

        var duration = vv.popcorn.duration()
        ,   in_point = Math.round(Math.random()*duration)
        ,   out_point = Math.ceil(Math.max(in_point, Math.min(duration, in_point + Math.round(Math.random()*3))))

      }
      else {
        setTimeout(function() { layout.playRdm(index); }, 100);
        return;
      }


      console.log("duration: " + vv.popcorn.duration());
      console.log("in_point: " + in_point);
      console.log("out_point: " + out_point);

      vv.$el.show();

      vv.popcorn.on('timeupdate', function() {

        if(this.currentTime() > out_point && !this.hasPlayed) {
          this.hasPlayed = true;
          this.pause();
          layout.n_videos_played_in_set++;
          layout.playRdm();
        }

      });

      //vv.popcorn.unmute();
      //vv.popcorn.volume(1); 
      vv.popcorn.play(in_point);

    }

  });

  Tabloid.destroy = function() {

    console.log('Tabloid destroy');

  }

  // Return the module for AMD compliance.
  return Tabloid;

});
