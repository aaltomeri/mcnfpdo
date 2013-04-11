// BgdPlus module
define([
  // Application.
  "app",
  "modules/Video",
  "css!../../styles/bgd-plus.css"
],

// Map dependencies from above array.
function(app, Video) {

  // Create a new module.
  var BgdPlus = app.module()
  ,   layout

  BgdPlus.init = function() {

    console.log('BgdPlus INIT');

    BgdPlus.soundtrack.pause();

    var videos = new BgdPlus.Collection();

    layout = new BgdPlus.Views.Layout( {collection: videos });

    videos.on('reset', function() {

      layout.playSet();

    });

    videos.on('Belgrade+:fetching_data', function(data) {

      layout.showSearch(data.search_term);

    });

    videos.fetchData();
   

  }

  // Default Model.
  BgdPlus.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  BgdPlus.Collection = Backbone.Collection.extend({
    
    model: Video.Model,
    search_terms: [

      { display: "models", q: "+serbian +models +girls -indoor -flying -space -pig -eve -kosovo -land -occupied" },
      { display: "nightlife", q: "nightlife -live +party +girls" },
      { display: "atmosphere", q: "atmosphere -live" },
      { display: "life", q: "life -live -apartment -house -rent -asimo -robot" },
      { display: "today", q: "today -live-apartment -house -rent -cabin -asimo -robot" },
      { display: "party", q: "party -live -politics -serbian -opposition -asimo -robot" },
      { display: "crazy", q: "crazy -live -asimo -robot"},
      { display: "trash", q: "trash -live -music -heller -asimo -robot"},
      { display: "music", q: "music -live -asimo -robot"},
      // { display: "gaypride", q: "gaypride -asimo -robot"},
      { display: "underground", q: "underground -live -asimo -robot"},
      { display: "turbofolk", q: "turbofolk -live -asimo -robot"},
      { display: "girls", q: "girls -live -asimo -robot"},
      { display: "mafia", q: "mafia -live -asimo -robot"},
      { display: "nights", q: "nights -live -asimo -robot"},
      { display: "people", q: "people -live -asimo -robot"},
      { display: "tabloid", q: "tabloid -live -asimo -robot"},
      { display: "dirty", q: "dirty -live -asimo -robot -dolly"},
      { display: "scandal", q: "scandal -live -asimo -robot"},
      { display: "politics", q: "politics -live -asimo -robot"}

    ],
    search_term: null,
    data_fetched: false,

    fetchData: function() {

      var youtube_feed_url = '//gdata.youtube.com/feeds/api/videos?callback=?'
      ,   _this = this

      this.search_term = this.search_terms[Math.floor(Math.random()*this.search_terms.length)]
      

      //_this.trigger('Belgrade+:fetching_data', { search_term: this.search_term });
      
      var term_index = 0;
      

      var terms_cycle_intvl = setInterval(function() {

          layout.showSearch(_this.search_terms[term_index]);

          if(_this.search_terms[term_index].display == _this.search_term.display) {

            clearInterval(terms_cycle_intvl);
            
            layout.showSearch(_this.search_term);

            $.getJSON(youtube_feed_url, {
                v:2, 
                alt:'json-in-script', 
                format:'5',
                vq: "+belgrade +" + _this.search_term.q,
                "start-index": Math.floor(Math.random() * 20),
                "max-results": 2
              }, 
              $.proxy(_this.parseYoutubeData, _this)
            );

          }

          term_index++;

      },200);

      // set timeOut to check for Errors when getting videos
      setTimeout(function() {
        if(!_this.data_fetched) {
          //window.location.reload();
        }
      }, 2000);


    },
 
    parseYoutubeData: function(data) {

      this.data_fetched = true;

      // console.log(data);

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
  BgdPlus.Views.Layout = Backbone.Layout.extend({

    template: "bgd-plus",
    id: "bgd-plus",
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
       * All dynamically added elements must be added after render since render loads a template and replaces $el.html with it
       */
      

      this.$search_banner = this.$el.find('.search-banner');
      this.$search_term = this.$el.find('.search-term');
      this.$search_button = this.$el.find('.search-button');
      this.$search_button.on('click', function() { layout.collection.fetchData(); });

      $('#module-container').transition({opacity: 1}, 2000);

    },

    showSearch: function(search_term) {

      this.$el.find('.time').html("00:00");
      this.$el.find('.video-name').html("Searching ... ");

      this.$search_term.fadeOut(100);
      this.$search_term.html(search_term.display);
      this.$search_term.fadeIn(200);

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
            //source += "&html5=1";
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
        ,   left = Math.floor(hz_delta*(index%hz_vdo_cnt)) + (Math.floor(Math.random() * (10 + 10 + 1)) - 20)
        ,   top = Math.floor(vt_delta * parseInt(index/vt_vdo_cnt)) + (Math.floor(Math.random() * (10 + 10 + 1)) - 20)

        var vv_css = {
          position: 'absolute',
          top: top,
          left: left,
          width: w,
          height: h,
          "z-index": index,
          opacity: 0.2
        }

        // position view
        vv.$el.css(vv_css);
        vv.render();
        vv.init();
        vv.popcorn.play(); 
        vv.popcorn.pause(); 
        vv.popcorn.waiting = false;

        vv.popcorn.on('loadedmetadata', function() {
          this.hasPlayed = false;
        });

      }, this);

      //setInterval(function() { layout.playRdm(); }, 3000);
      layout.playRdm();

    },

    playRdm: function(index) {


      // play one random video from the set
      var views = this.getViews().value()
      ,   layout = this
      ,   index = index? index : Math.floor(Math.random()*views.length)
      ,   vv = views[index]

      if(this.n_videos_played_in_set == views.length) {
        this.collection.fetchData();
        return;
      }

      // console.log(" -------- playRdm ------- " );
      // console.log("index: " + index);
      // console.log("vv: " + vv);
      // console.log("vv popcorn: " + vv.popcorn);
      // console.log("hasPlayed: " + vv.popcorn.hasPlayed);

      // the randomly picked video play has already been played : pick another one
      if(vv.popcorn.hasPlayed) {
        layout.playRdm();
        return;
      }

      // if(!vv.popcorn.waiting) {
      //   console.log('----WAITING AT START---');

      //   if(vv.popcorn.waiting_timeout) {
      //     clearTimeout(vv.popcorn.waiting_timeout);
      //     delete vv.popcorn.waiting_timeout;
      //   }

      //   vv.popcorn.waiting_timeout = setTimeout(function(){
      //     console.log(vv.popcorn.id + ' HAS WAITED TOO LONG : waiting_timeout Id:' + vv.popcorn.waiting_timeout);
      //     vv.popcorn.pause();
      //     vv.popcorn.waiting = false;
      //     layout.playRdm();
      //   },3000);
      //   vv.popcorn.waiting = true;
      // }

      if(!isNaN(vv.popcorn.duration()) && vv.popcorn.duration() > 0) {

        var duration = vv.popcorn.duration()
        ,   in_point
        ,   out_point

        if(duration) {
          in_point = Math.round(Math.min(Math.round(Math.random()*duration), duration-1));
          out_point = Math.ceil(Math.max(in_point, Math.min(duration, in_point + Math.round(Math.random()*10)+5)));
        }
        else {
          this.playRdm(index);
        }

      }
      else {
        setTimeout(function() { 
          layout.playRdm(index); 
        }, 100);
        return;
      }


       // console.log("duration: " + vv.popcorn.duration());
       // console.log("in_point: " + in_point);
       // console.log("out_point: " + out_point);

      vv.popcorn.on('waiting', function() {

        // if(this.waiting) {
        //   clearTimeout(this.waiting_timeout);
        //   delete this.waiting_timeout;
        // }

        // this.waiting = true;

        // console.log('----BUFFERING---');
        // console.log(this);
        // var _popcorn = this;
        //   this.waiting_timeout = setTimeout(function(){
        //     console.log(_popcorn.id + ' HAS WAITED TOO LONG : waiting_timeout Id:' + _popcorn.waiting_timeout);
        //     _popcorn.pause();
        //     layout.playRdm();
        //   },6000);
        // // console.log(this.id + " waiting timeout: " + this.waiting_timeout);
        // console.log('-------');
      });

      vv.popcorn.on('play', function() {

        vv.$el.transition({opacity: 1});
        layout.$el.find('.video-name').html(vv.model.get('name').toLowerCase());  

      });

      // TIMEUPDATE
      vv.popcorn.on('timeupdate', function() {

        var time = this.currentTime()
        ,   countdown = Math.round(out_point - time)

        // we have started - set waiting to false
        // if(this.waiting) {
        //   console.log("-----timeupdate PLAYING-----");
        //   clearTimeout(this.waiting_timeout);
        //   delete this.waiting_timeout;
        //   this.waiting = false;
        // }

        // DISPLAY COUNTOWN
        layout.$el.find('.time').html('00:' + (countdown>9?countdown:'0'+countdown));

        if(this.currentTime() > out_point && !this.hasPlayed) {

          this.hasPlayed = true;
          this.pause();

          layout.n_videos_played_in_set++;

          vv.popcorn.off('timeupdate');
          vv.popcorn.off('waiting');

          if(this.waiting_timeout) {
            clearTimeout(this.waiting_timeout);
            delete this.waiting_timeout;
          }

          layout.playRdm();
        }

      });


      // ENDED
      vv.popcorn.on('ended', function() {
        //layout.playRdm();
      });

      //vv.popcorn.unmute();
      //vv.popcorn.volume(1); 
      vv.popcorn.play(in_point);

    }

  });

  BgdPlus.destroy = function() {

    //console.log('Belgrade+ destroy');

    layout.getViews(function(view) { return view.$el.hasClass('video'); }).each(function(view) {
      view.remove();
    });

  }

  // Return the module for AMD compliance.
  return BgdPlus;

});
