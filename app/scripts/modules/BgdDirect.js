// BgdDirect module
define([
  // Application.
  "app",

  // Css
  "css!../../styles/bgd-direct.css"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var BgdDirect = app.module(Backbone.Events);

  BgdDirect.init = function() {

    console.log('NEWS INIT');

    BgdDirect.queries = new Array();

    var BgdDirectItemDisplayInterval = 6000
    ,   EncounterDisplayInterval = 10000
    ,   layout
    ,   audiostreams
    ,   rssfeeds
    ,   twittersearches
    ,   encounters;

    layout = new BgdDirect.Views.Layout();

    audiostreams = new BgdDirect.AudioStreams();
    audiostreams.on('reset', function() {

      var stream_index = Math.floor(Math.random()*this.models.length);

      this.currentStream = stream_index;

      // do not show radio for FF as it does not support playing mp3 feeds
      if(!$.browser.mozilla) {

        // set AudioStream View
        layout.audiostreamView = layout.setView('#audiostream', 
          new BgdDirect.Views.AudioStream({start_stream_index: stream_index, model: this.at(stream_index), collection: this})).render();
      
      }

    });
    audiostreams.fetchData();

    rssfeeds = new BgdDirect.RssFeeds();
    rssfeeds.on('reset', function() {

      twittersearches = new BgdDirect.TwitterSearches();
      twittersearches.on('reset', function() {
        console.log(BgdDirect.queries); 
        $.when.apply(null, BgdDirect.queries).done(function() { 
          console.log('All BgdDirect Items Fetched'); 
          BgdDirect.trigger('BgdDirect:BgdDirectItemsFetched');
        });
      });
      twittersearches.fetchData();

    });
    rssfeeds.fetchData();

    /**
     * BgdDirect Items management
     *
     * we allow for automatically adding a BgdDirect Item to the collection when it is created
     * this is done by triggering a module wide event when a model is initialized
     * 
     */
    
    // every time a BgdDirectItem is created it is added to the BgdDirectItemsCollection
    BgdDirect.newsItems = new BgdDirect.BgdDirectItemsCollection();

    BgdDirect.on('BgdDirect:BgdDirectItem:created', function(model) {

      // add newsItem to collection
      BgdDirect.newsItems.add(model);

    });

    // every time a BgdDirectItem is added to the collection it is added to the view
    BgdDirect.newsItems.on('add', function(model) {

      // create
      var newsItemView = new BgdDirect.Views.BgdDirectItemView({model: model});
      layout.newsItemsView.insertView(newsItemView);

      newsItemView.render();

    });

    // show New Item when it is set as current in its collecction
    BgdDirect.newsItems.on('change:currentBgdDirectItem', function() {
      layout.newsItemsView.showCurrentItem();
    });

    // set BgdDirectItemsView collection
    layout.newsItemsView.collection = BgdDirect.newsItems;

    // show first BgdDirect Item abd start the display cycle
    BgdDirect.on('BgdDirect:BgdDirectItemsFetched', function() {

      BgdDirect.newsItems.rdm();

      setInterval(function() { BgdDirect.newsItems.rdm(); }, BgdDirectItemDisplayInterval);

    });

    ////////////////
    // Encounters //
    ////////////////

    encounters = new BgdDirect.Encounters();
    encounters.on('reset', function() {
      // set Encounters View
      layout.encountersView = layout.setView('#encounters', new BgdDirect.Views.EncountersView({ collection: this }));
      layout.encountersView.render();

      this.rdm();
      setInterval(function() { encounters.rdm(); }, EncounterDisplayInterval);

    });
    encounters.fetchData();

    encounters.on('change:currentItem', function() {
      layout.encountersView.showCurrentItem();
    });
    

  }

  // Default Model.
  BgdDirect.Model = Backbone.Model.extend({
  
  });

  // AudioStream Model
  BgdDirect.AudioStream = BgdDirect.Model.extend({

  });

  // RssFeed Model
  BgdDirect.RssFeed = BgdDirect.Model.extend({

    initialize: function() {

      var model = this
      ,   feed_url = this.get('url');

      var query = $.ajax({
        url      : document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=?&q=' + encodeURIComponent(feed_url),
        dataType : 'json',
        success  : function (data) {

          if (data.responseData.feed && data.responseData.feed.entries) {

            model.set('entries', data.responseData.feed.entries);
            model.trigger('feed:received');

            console.log(data);

            // loop through entries and create a BgdDirectItem for each
            // this would need to be refined to accomodate different feeds
            // with different attribute names for title, text and date
            $.each(data.responseData.feed.entries, function (i, e) {

              var newsItem = new BgdDirect.BgdDirectItem({
                title: e.title,
                text: e.contentSnippet,
                date: e.publishedDate? e.publishedDate : e.pubDate,
                source: data.responseData.feed.title,
                type: 'Rss Feed Entry'
              });

            });

          }

        }
      });

      BgdDirect.queries.push(query);

    }

  });

  // Twitter Search Model
  BgdDirect.TwitterSearch = BgdDirect.Model.extend({

    initialize: function() {

      var model = this
      ,   term = this.get('term');

      var query = $.getJSON('http://search.twitter.com/search.json?q='+ encodeURIComponent(term) +'&amp;rpp=10&amp;callback=?',
        function (data) {

          if (data.results) {

            model.set('entries', data.results);
            model.trigger('feed:received');

            //console.log(data);

            // loop through entries and create a BgdDirectItem for each
            $.each(data.results, function (i, e) {

              var newsItem = new BgdDirect.BgdDirectItem({
                title: '@' + e.from_user,
                text: e.text,
                date: e.created_at,
                source: "Twitter",
                type: "Tweet"
              });

            });
          }

      });

      BgdDirect.queries.push(query);

    }

  });

  // BgdDirectItem Model
  BgdDirect.BgdDirectItem = BgdDirect.Model.extend({
    initialize: function() {

      //console.log('BgdDirectItem created : ' + this.get('type'));
      
      // say to the module eco-system that a BgdDirect Item is born
      BgdDirect.trigger('BgdDirect:BgdDirectItem:created', this);

    }
  });


  BgdDirect.Encounter = BgdDirect.Model.extend({
    initialize: function() {}
  });


  // Default Collection
  // Mother of all data sources collection for the BgdDirect Module
  BgdDirect.Collection = Backbone.Collection.extend({
    
    model: BgdDirect.Model,
    currentStream: 0,

    // fetch data for this collection
    // uses the 'type' property to build data url
    fetchData: function() {

      var _this = this;

      if(typeof this.type == "undefined") {
        throw "BgdDirect Collection must have a type to be able to fetch data"
      }

      $.get('data/bgd-direct-'+this.type+'.txt').done(

        function(data) { 

          _this.reset($.parseJSON(data));

        }
      );

    }

  });

  // AudioStreams Collection
  BgdDirect.AudioStreams = BgdDirect.Collection.extend({
    type: "audiostreams",
    model: BgdDirect.AudioStream
  });

  // RSS Feeds Collection
  BgdDirect.RssFeeds = BgdDirect.Collection.extend({
    type: "rss-feeds",
    model: BgdDirect.RssFeed
  })

  // Twitter Searches Collection
  BgdDirect.TwitterSearches = BgdDirect.Collection.extend({
    type: "twitter-searches",
    model: BgdDirect.TwitterSearch
  })

   // Belgrade Encounters Collection
  BgdDirect.Encounters = BgdDirect.Collection.extend({

    type: "encounters",
    model: BgdDirect.Encounter,

    currentItem: null,
    currentItemIndex: -1,

    setCurrentItem: function(model) {
      this.currentItem = model;
      this.trigger('change:currentItem', model);
    },

    rdm: function() {

      this.currentItemIndex = Math.floor(Math.random()*this.models.length);
      this.setCurrentItem(this.at(this.currentItemIndex));

    }

  })

  // BgdDirect Items Collection
  BgdDirect.BgdDirectItemsCollection = Backbone.Collection.extend({
    
    model: BgdDirect.BgdDirectItem,
    currentBgdDirectItem: null,
    currentBgdDirectItemIndex: -1,

    setCurrentBgdDirectItem: function(model) {
      this.currentBgdDirectItem = model;
      this.trigger('change:currentBgdDirectItem', model);
    },

    next: function() {

      if(this.currentBgdDirectItemIndex > this.models.length-2) {
        this.currentBgdDirectItemIndex = -1;
      }

      this.currentBgdDirectItemIndex++;
      this.currentBgdDirectItem = this.at(this.currentBgdDirectItemIndex);
      this.trigger('change:currentBgdDirectItem', this.currentBgdDirectItem);

    },

    rdm: function() {

      this.currentBgdDirectItemIndex = Math.floor(Math.random()*this.models.length);
      this.currentBgdDirectItem = this.at(this.currentBgdDirectItemIndex);
      this.trigger('change:currentBgdDirectItem', this.currentBgdDirectItem);

    }

  })

  ///////////
  // VIEWS //
  ///////////

  //////////////////////
  // AudioStream View //
  //////////////////////
  // this is just a Html Audio Element
  BgdDirect.Views.AudioStream = Backbone.LayoutView.extend({

    popcorn: null,

    initialize: function() {

      var view = this;

      this.popcorn = Popcorn( new Popcorn.HTMLAudioElement(this.el) );
      this.popcorn.media.src = this.model.get('url');

      this.popcorn.volume(0.4);

      this.popcorn.on('canplay', function() {
        
        view.infos.html(view.model.get('name'));

      });

      this.model.on('change:url', this.change, this);

      this.$el.append('<button class="play-pause-radio">Play/Pause</button>');
      this.$el.append('<button class="change-radio">Change Radio</button>');
      this.infos = $('<div class="infos"></div>');
      this.$el.append(this.infos);

      this.$el.find('button.play-pause-radio').on('click', function() {
          
        view.popcorn.paused()? view.popcorn.play() : view.popcorn.pause();

      });

      this.$el.find('button.change-radio').on('click', function() {

        view.collection.currentStream++;

        var nextStream = view.collection.at(view.collection.currentStream);

        view.model.set('name', nextStream.get('name'));
        view.model.set('url', nextStream.get('url'));

      });



      this.change(this.model);

    },

    change: function(model) {
      
      this.infos.html('Searching for ' + model.get('name') + ' ... ');

      this.popcorn.media.src = model.get('url');

      this.pause();
      this.play();

    },

    // wrapper for popcorn instance play method
    play: function() {
      this.popcorn.media.play();
    },

    // wrapper for popcorn instance pause method
    pause: function() {
      this.popcorn.media.pause();
    }

  });

  // BgdDirect Items View
  BgdDirect.Views.BgdDirectItemsView = Backbone.LayoutView.extend({

    tagName: 'ul',

    initialize: function() {
      
    },

    showCurrentItem: function() {

      var items = this.$el.find('li').not('.current')
      ,   previousItem = this.$el.find('li.current')
      ,   currentItem = this.$el.find('li#news-item-' + this.collection.currentBgdDirectItem.cid)

      if(previousItem.length) {
        previousItem.transition({left: previousItem.width() + 'px'});
        previousItem.removeClass('current');
      }

      items.hide();
      currentItem.css({left: '-' + currentItem.width() + 'px'});
      currentItem.show();
      currentItem.transition({left: 0});

      currentItem.addClass('current');

    }

  });

  // BgdDirect Item View
  BgdDirect.Views.BgdDirectItemView = Backbone.LayoutView.extend({
    tagName: 'li',
    template: 'modules/bgd-direct/news-item',

    initialize: function() {
      this.$el.attr('id', "news-item-" + this.model.cid);
    },

    // Provide data to the template
    serialize: function() {
      return this.model.toJSON();
    }

  });

  // Belgrade Encounters View
  BgdDirect.Views.EncountersView = Backbone.LayoutView.extend({

    tagName: 'ul',

    beforeRender: function() {

      this.collection.each(function(model) {

        this.insertView(new BgdDirect.Views.EncounterView({model: model}));

      }, this);

    },

    showCurrentItem: function() {

      var items = this.$el.find('li').not('.current')
      ,   previousItem = this.$el.find('li.current')
      ,   currentItem = this.$el.find('li#encounter-' + this.collection.currentItem.cid)

      if(previousItem.length) {
        previousItem.transition({left: '-' + previousItem.width() + 'px'});
        previousItem.removeClass('current');
      }

      items.hide();
      currentItem.css({left: currentItem.width() + 'px'});
      currentItem.show();
      currentItem.transition({left: 0});

      currentItem.addClass('current');

    }
 

  })

  // Belgrade Encounter View
  BgdDirect.Views.EncounterView = Backbone.LayoutView.extend({

    tagName: 'li',
    template: 'modules/bgd-direct/encounter',

    initialize: function() {
      this.$el.attr('id', "encounter-" + this.model.cid);
    },

    // Provide data to the template
    serialize: function() {
      return this.model.toJSON();
    }

  })

  // Default View.
  BgdDirect.Views.Layout = Backbone.Layout.extend({

    template: "bgd-direct",

    webcams: [
      'http://www.mondo.rs/traffic_cams/1357146725/29.jpg',
      'http://www.mondo.rs/traffic_cams/30.jpg',
      'http://www.mondo.rs/traffic_cams/31.jpg',
      'http://www.mondo.rs/traffic_cams/1357146773/5.jpg',
      'http://www.mondo.rs/traffic_cams/7.jpg',
      'http://www.mondo.rs/traffic_cams/10.jpg',
      'http://www.mondo.rs/traffic_cams/18.jpg',
      'http://www.mondo.rs/traffic_cams/6.jpg',
      'http://www.mondo.rs/traffic_cams/11.jpg'
    ],

     initialize: function() {

      var audiostreams = this.options.audiostreams
      ,   encounters = this.options.encounters
      ,   audiostreamView
      ,   newsItemsView

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // set BgdDirect Items View
      this.newsItemsView = this.setView('#news-items', new BgdDirect.Views.BgdDirectItemsView());

      // render layout
      this.render();

      $('#module-container').transition({opacity: 1}, 2000);

      this.initWebcam();

    },

    initWebcam: function() {

      $('#webcam > img').css({
        width: '100%',
        height: '100%'
      });

      var webcams = this.webcams;

      function getWebcam() {

        var webcam_count = webcams.length
        ,   webcam_index = Math.floor(Math.random()*webcam_count)
        ,   webcam_url = webcams[webcam_index]


        return webcam_url;

      }

      var webcam_url = getWebcam();

      var updateWebcam = function() {
        
        var rdm = Math.round(Math.random()*100000)
        ,   _webcam_url = webcam_url + '?' + rdm;

        if(rdm > 90000)
          webcam_url = getWebcam();

        try {

          $('#webcam > img').attr('src', _webcam_url);

        }
        catch(e) {
          console.log(e);
        }

      }

      //$('#webcam > img').on('load', updateWebcam);
      $('#webcam > img').on('error', function() { 
        webcam_url = getWebcam(); 
        updateWebcam(); 
      });
      $('#webcam > img').attr('src', webcam_url);


     setInterval(updateWebcam, 10000);

    }

  });

  BgdDirect.destroy = function() {

    console.log('BgdDirect destroy');

  }

  // Return the module for AMD compliance.
  return BgdDirect;

});