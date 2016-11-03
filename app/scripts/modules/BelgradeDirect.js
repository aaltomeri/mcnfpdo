// BelgradeDirect module
define([
  // Application.
  "app",

  // Css
  "css!../../styles/BelgradeDirect.css"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var BelgradeDirect = app.module(Backbone.Events);

  BelgradeDirect.init = function() {

    console.log('NEWS INIT');

    BelgradeDirect.queries = new Array();

    var BelgradeDirectItemDisplayInterval = 6000
    ,   EncounterDisplayInterval = 10000
    ,   layout
    ,   audiostreams
    ,   rssfeeds
    ,   twittersearches
    ,   encounters;

    layout = new BelgradeDirect.Views.Layout();

    audiostreams = new BelgradeDirect.AudioStreams();
    audiostreams.on('reset', function() {

      var stream_index = Math.floor(Math.random()*this.models.length);

      this.currentStream = stream_index;

      // do not show radio for FF as it does not support playing mp3 feeds
      if(!$.browser.mozilla) {

        // set AudioStream View
        layout.audiostreamView = layout.setView('#audiostream', 
          new BelgradeDirect.Views.AudioStream({start_stream_index: stream_index, model: this.at(stream_index), collection: this})).render();
      
      }

    });
    audiostreams.fetchData();

    rssfeeds = new BelgradeDirect.RssFeeds();
    rssfeeds.on('reset', function() {

      twittersearches = new BelgradeDirect.TwitterSearches();
      twittersearches.on('reset', function() {

        $.when.apply(null, BelgradeDirect.queries).done(function() { 

          BelgradeDirect.trigger('BelgradeDirect:BelgradeDirectItemsFetched');

        });
      });
      twittersearches.fetchData();

    });
    rssfeeds.fetchData();

    /**
     * BelgradeDirect Items management
     *
     * we allow for automatically adding a BelgradeDirect Item to the collection when it is created
     * this is done by triggering a module wide event when a model is initialized
     * 
     */
    
    // every time a BelgradeDirectItem is created it is added to the BelgradeDirectItemsCollection
    BelgradeDirect.newsItems = new BelgradeDirect.BelgradeDirectItemsCollection();

    BelgradeDirect.on('BelgradeDirect:BelgradeDirectItem:created', function(model) {

      // add newsItem to collection
      BelgradeDirect.newsItems.add(model);

    });

    // every time a BelgradeDirectItem is added to the collection it is added to the view
    BelgradeDirect.newsItems.on('add', function(model) {

      // create
      var newsItemView = new BelgradeDirect.Views.BelgradeDirectItemView({model: model});
      layout.newsItemsView.insertView(newsItemView);

      newsItemView.render();

    });

    // show New Item when it is set as current in its collecction
    BelgradeDirect.newsItems.on('change:currentBelgradeDirectItem', function() {
      layout.newsItemsView.showCurrentItem();
    });

    // set BelgradeDirectItemsView collection
    layout.newsItemsView.collection = BelgradeDirect.newsItems;

    // show first BelgradeDirect Item abd start the display cycle
    BelgradeDirect.on('BelgradeDirect:BelgradeDirectItemsFetched', function() {

      BelgradeDirect.newsItems.rdm();

      setInterval(function() { BelgradeDirect.newsItems.rdm(); }, BelgradeDirectItemDisplayInterval);

    });

    ////////////////
    // Encounters //
    ////////////////

    encounters = new BelgradeDirect.Encounters();
    encounters.on('reset', function() {
      // set Encounters View
      layout.encountersView = layout.setView('#encounters .body', new BelgradeDirect.Views.EncountersView({ collection: this }));
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
  BelgradeDirect.Model = Backbone.Model.extend({
  
  });

  // AudioStream Model
  BelgradeDirect.AudioStream = BelgradeDirect.Model.extend({

  });

  // RssFeed Model
  BelgradeDirect.RssFeed = BelgradeDirect.Model.extend({

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

            // loop through entries and create a BelgradeDirectItem for each
            // this would need to be refined to accomodate different feeds
            // with different attribute names for title, text and date
            $.each(data.responseData.feed.entries, function (i, e) {

              //console.log(e);

              var newsItem = new BelgradeDirect.BelgradeDirectItem({
                title: e.title,
                text: e.contentSnippet.replace(/[….]{0,3}/g,''),
                link: e.link,
                date: e.publishedDate? e.publishedDate : e.pubDate,
                source: data.responseData.feed.title,
                type: 'Rss Feed Entry'
              });

            });

          }

        }
      });

      BelgradeDirect.queries.push(query);

    }

  });

  // Twitter Search Model
  BelgradeDirect.TwitterSearch = BelgradeDirect.Model.extend({

    initialize: function() {

      var model = this
      ,   term = this.get('term');

      // SKIP Twitter search as it needs overhaul due to Twitter AI 1.1 having to be used now
      return;

      var query = $.getJSON('http://search.twitter.com/search.json?q='+ encodeURIComponent(term) +'&amp;include_entities=1&amp;rpp=10&amp;callback=?',
        function (data) {

          if (data.results) {

            model.set('entries', data.results);
            model.trigger('feed:received');

            //console.log(data);

            // loop through entries and create a BelgradeDirectItem for each
            $.each(data.results, function (i, e) {

              var newsItem = new BelgradeDirect.BelgradeDirectItem({
                title: '@' + e.from_user,
                text: e.text.replace(/[….]{0,3}/g,''),
                link: e.entities.urls.length? e.entities.urls[0].expanded_url : "http://www.twitter.com/"+e.from_user,
                date: e.created_at,
                source: "Twitter",
                type: "Tweet"
              });

            });
          }

      });

      BelgradeDirect.queries.push(query);

    }

  });

  // BelgradeDirectItem Model
  BelgradeDirect.BelgradeDirectItem = BelgradeDirect.Model.extend({
    initialize: function() {

      //console.log('BelgradeDirectItem created : ' + this.get('type'));
      
      // say to the module eco-system that a BelgradeDirect Item is born
      BelgradeDirect.trigger('BelgradeDirect:BelgradeDirectItem:created', this);

    }
  });


  BelgradeDirect.Encounter = BelgradeDirect.Model.extend({
    initialize: function() {}
  });


  // Default Collection
  // Mother of all data sources collection for the BelgradeDirect Module
  BelgradeDirect.Collection = Backbone.Collection.extend({
    
    model: BelgradeDirect.Model,
    currentStream: 0,

    // fetch data for this collection
    // uses the 'type' property to build data url
    fetchData: function() {

      var _this = this;

      if(typeof this.type == "undefined") {
        throw "BelgradeDirect Collection must have a type to be able to fetch data"
      }

      $.get('data/BelgradeDirect-'+this.type+'.txt').done(

        function(data) { 

          _this.reset($.parseJSON(data));

        }
      );

    }

  });

  // AudioStreams Collection
  BelgradeDirect.AudioStreams = BelgradeDirect.Collection.extend({
    type: "audiostreams",
    model: BelgradeDirect.AudioStream
  });

  // RSS Feeds Collection
  BelgradeDirect.RssFeeds = BelgradeDirect.Collection.extend({
    type: "rss-feeds",
    model: BelgradeDirect.RssFeed
  })

  // Twitter Searches Collection
  BelgradeDirect.TwitterSearches = BelgradeDirect.Collection.extend({
    type: "twitter-searches",
    model: BelgradeDirect.TwitterSearch
  })

   // Belgrade Encounters Collection
  BelgradeDirect.Encounters = BelgradeDirect.Collection.extend({

    type: "encounters",
    model: BelgradeDirect.Encounter,

    currentItem: null,
    currentItemIndex: -1,
    items_array: [],

    setCurrentItem: function(model) {
      this.currentItem = model;
      this.trigger('change:currentItem', model);
    },

    rdm: function() {

      this.currentItemIndex = Math.floor(Math.random()*this.models.length);
      this.setCurrentItem(this.at(this.currentItemIndex));

      if(this.items_array.indexOf(this.currentItemIndex) == -1)
        this.items_array.push(this.currentItemIndex);

    }

  })

  // BelgradeDirect Items Collection
  BelgradeDirect.BelgradeDirectItemsCollection = Backbone.Collection.extend({
    
    model: BelgradeDirect.BelgradeDirectItem,
    currentBelgradeDirectItem: null,
    currentBelgradeDirectItemIndex: -1,

    setCurrentBelgradeDirectItem: function(model) {
      this.currentBelgradeDirectItem = model;
      this.trigger('change:currentBelgradeDirectItem', model);
    },

    next: function() {

      if(this.currentBelgradeDirectItemIndex > this.models.length-2) {
        this.currentBelgradeDirectItemIndex = -1;
      }

      this.currentBelgradeDirectItemIndex++;
      this.currentBelgradeDirectItem = this.at(this.currentBelgradeDirectItemIndex);
      this.trigger('change:currentBelgradeDirectItem', this.currentBelgradeDirectItem);

    },

    rdm: function() {

      this.currentBelgradeDirectItemIndex = Math.floor(Math.random()*this.models.length);
      this.currentBelgradeDirectItem = this.at(this.currentBelgradeDirectItemIndex);
      this.trigger('change:currentBelgradeDirectItem', this.currentBelgradeDirectItem);

    }

  })

  ///////////
  // VIEWS //
  ///////////

  //////////////////////
  // AudioStream View //
  //////////////////////
  // this is just a Html Audio Element
  BelgradeDirect.Views.AudioStream = Backbone.LayoutView.extend({

    popcorn: null,

    initialize: function() {

      var view = this;

      this.popcorn = Popcorn( new Popcorn.HTMLAudioElement(this.el) );
      this.popcorn.media.src = this.model.get('url');

      this.popcorn.volume(0.4);

      this.popcorn.on('canplay', function() {
        
        view.infos.html(view.model.get('name'));

      });

      this.popcorn.on('play', function() {

        view.$el.find('button.play-pause-radio').html("Eteindre la radio");

      });

      this.popcorn.on('pause', function() {

          view.$el.find('button.play-pause-radio').html("Allumer la radio");

      });

      this.model.on('change:url', this.change, this);

      this.$el.append('<button class="play-pause-radio"></button>');
      this.$el.append('<button class="change-radio">Changer de station</button>');
      this.infos = $('<div class="infos"></div>');
      this.$el.append(this.infos);

      this.$el.find('button.play-pause-radio').on('click', function() {
        
        view.popcorn.paused()? view.popcorn.play() : view.popcorn.pause();

      });

      this.$el.find('button.change-radio').on('click', function() {

        view.collection.currentStream = Math.floor(Math.random()*view.collection.models.length);

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

  // BelgradeDirect Items View
  BelgradeDirect.Views.BelgradeDirectItemsView = Backbone.LayoutView.extend({

    tagName: 'ul',

    initialize: function() {
      
    },

    showCurrentItem: function() {

      var items = this.$el.find('li').not('.current')
      ,   previousItem = this.$el.find('li.current')
      ,   currentItem = this.$el.find('li#news-item-' + this.collection.currentBelgradeDirectItem.cid)

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

  // BelgradeDirect Item View
  BelgradeDirect.Views.BelgradeDirectItemView = Backbone.LayoutView.extend({
    tagName: 'li',
    template: 'modules/BelgradeDirect/news-item',

    initialize: function() {
      this.$el.attr('id', "news-item-" + this.model.cid);
    },

    // Provide data to the template
    serialize: function() {
      return this.model.toJSON();
    }

  });

  // Belgrade Encounters View
  BelgradeDirect.Views.EncountersView = Backbone.LayoutView.extend({

    tagName: 'ul',

    beforeRender: function() {

      this.collection.each(function(model) {

        this.insertView(new BelgradeDirect.Views.EncounterView({model: model}));

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
  BelgradeDirect.Views.EncounterView = Backbone.LayoutView.extend({

    tagName: 'li',
    template: 'modules/BelgradeDirect/encounter',

    initialize: function() {
      this.$el.attr('id', "encounter-" + this.model.cid);
    },

    // Provide data to the template
    serialize: function() {
      return this.model.toJSON();
    }

  })

  // Default View.
  BelgradeDirect.Views.Layout = Backbone.Layout.extend({

    template: "BelgradeDirect",

    webcams: [
       'http://services.mondo.rs/traffic_cams/5.jpg',
      'http://services.mondo.rs/traffic_cams/30.jpg',
      'http://services.mondo.rs/traffic_cams/31.jpg',
      'http://services.mondo.rs/traffic_cams/1357146773/5.jpg',
      'http://services.mondo.rs/traffic_cams/7.jpg',
      'http://services.mondo.rs/traffic_cams/10.jpg',
      'http://services.mondo.rs/traffic_cams/18.jpg',
      'http://services.mondo.rs/traffic_cams/6.jpg',
      'http://services.mondo.rs/traffic_cams/11.jpg'
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

      // set BelgradeDirect Items View
      this.newsItemsView = this.setView('#news-items .body', new BelgradeDirect.Views.BelgradeDirectItemsView());

      // render layout
      this.render();

      // add today's date in Belgrade
      $('#BelgradeDirect-date').html(Date());

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

        // add today's date in Belgrade
        $('#BelgradeDirect-date').html(Date());

        if(rdm > 50000)
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


     setInterval(updateWebcam, 4000);

    }

  });

  BelgradeDirect.destroy = function() {

    console.log('BelgradeDirect destroy');

  }

  // Return the module for AMD compliance.
  return BelgradeDirect;

});