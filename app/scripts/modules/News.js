// News module
define([
  // Application.
  "app",

  // Css
  "css!../../styles/news.css"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var News = app.module(Backbone.Events);

  News.init = function() {

    console.log('NEWS INIT');

    News.queries = new Array();

    var NewsItemDisplayInterval = 8000
    ,   EncounterDisplayInterval = 5000
    ,   layout
    ,   audiostreams
    ,   rssfeeds
    ,   twittersearches
    ,   encounters;

    layout = new News.Views.Layout();

    audiostreams = new News.AudioStreams();
    audiostreams.on('reset', function() {

      // set AudioStream View
      layout.audiostreamView = layout.setView('#audiostream', 
        new News.Views.AudioStream({model: this.at(0), collection: this})).render();

    });
    audiostreams.fetchData();

    rssfeeds = new News.RssFeeds();
    rssfeeds.on('reset', function() {

      twittersearches = new News.TwitterSearches();
      twittersearches.on('reset', function() {
        console.log(News.queries); 
        $.when.apply(null, News.queries).done(function() { 
          console.log('All News Items Fetched'); 
          News.trigger('News:NewsItemsFetched');
        });
      });
      twittersearches.fetchData();

    });
    rssfeeds.fetchData();

    /**
     * News Items management
     *
     * we allow for automatically adding a News Item to the collection when it is created
     * this is done by triggering a module wide event when a model is initialized
     * 
     */
    
    // every time a NewsItem is created it is added to the NewsItemsCollection
    News.newsItems = new News.NewsItemsCollection();

    News.on('News:NewsItem:created', function(model) {

      // add newsItem to collection
      News.newsItems.add(model);

    });

    // every time a NewsItem is added to the collection it is added to the view
    News.newsItems.on('add', function(model) {

      // create
      var newsItemView = new News.Views.NewsItemView({model: model});
      layout.newsItemsView.insertView(newsItemView);

      newsItemView.render();

    });

    // show New Item when it is set as current in its collecction
    News.newsItems.on('change:currentNewsItem', function() {
      layout.newsItemsView.showCurrentItem();
    });

    // set NewsItemsView collection
    layout.newsItemsView.collection = News.newsItems;

    // show first News Item abd start the display cycle
    News.on('News:NewsItemsFetched', function() {

      News.newsItems.rdm();

      setInterval(function() { News.newsItems.rdm(); }, NewsItemDisplayInterval);

    });

    ////////////////
    // Encounters //
    ////////////////

    encounters = new News.Encounters();
    encounters.on('reset', function() {
      // set Encounters View
      layout.encountersView = layout.setView('#encounters', new News.Views.EncountersView({ collection: this }));
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
  News.Model = Backbone.Model.extend({
  
  });

  // AudioStream Model
  News.AudioStream = News.Model.extend({

  });

  // RssFeed Model
  News.RssFeed = News.Model.extend({

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

            // loop through entries and create a NewsItem for each
            // this would need to be refined to accomodate different feeds
            // with different attribute names for title, text and date
            $.each(data.responseData.feed.entries, function (i, e) {

              var newsItem = new News.NewsItem({
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

      News.queries.push(query);

    }

  });

  // Twitter Search Model
  News.TwitterSearch = News.Model.extend({

    initialize: function() {

      var model = this
      ,   term = this.get('term');

      var query = $.getJSON('http://search.twitter.com/search.json?q='+ encodeURIComponent(term) +'&amp;rpp=10&amp;callback=?',
        function (data) {

          if (data.results) {

            model.set('entries', data.results);
            model.trigger('feed:received');

            //console.log(data);

            // loop through entries and create a NewsItem for each
            $.each(data.results, function (i, e) {

              var newsItem = new News.NewsItem({
                title: '@' + e.from_user,
                text: e.text,
                date: e.created_at,
                source: "Twitter",
                type: "Tweet"
              });

            });
          }

      });

      News.queries.push(query);

    }

  });

  // NewsItem Model
  News.NewsItem = News.Model.extend({
    initialize: function() {

      //console.log('NewsItem created : ' + this.get('type'));
      
      // say to the module eco-system that a News Item is born
      News.trigger('News:NewsItem:created', this);

    }
  });


  News.Encounter = News.Model.extend({
    initialize: function() {}
  });


  // Default Collection
  // Mother of all data sources collection for the News Module
  News.Collection = Backbone.Collection.extend({
    
    model: News.Model,
    currentStream: 0,

    // fetch data for this collection
    // uses the 'type' property to build data url
    fetchData: function() {

      var _this = this;

      if(typeof this.type == "undefined") {
        throw "News Collection must have a type to be able to fetch data"
      }

      $.get('data/news-'+this.type+'.txt').done(

        function(data) { 

          _this.reset($.parseJSON(data));

        }
      );

    }

  });

  // AudioStreams Collection
  News.AudioStreams = News.Collection.extend({
    type: "audiostreams",
    model: News.AudioStream
  });

  // RSS Feeds Collection
  News.RssFeeds = News.Collection.extend({
    type: "rss-feeds",
    model: News.RssFeed
  })

  // Twitter Searches Collection
  News.TwitterSearches = News.Collection.extend({
    type: "twitter-searches",
    model: News.TwitterSearch
  })

   // Belgrade Encounters Collection
  News.Encounters = News.Collection.extend({

    type: "encounters",
    model: News.Encounter,

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

  // News Items Collection
  News.NewsItemsCollection = Backbone.Collection.extend({
    
    model: News.NewsItem,
    currentNewsItem: null,
    currentNewsItemIndex: -1,

    setCurrentNewsItem: function(model) {
      this.currentNewsItem = model;
      this.trigger('change:currentNewsItem', model);
    },

    next: function() {

      if(this.currentNewsItemIndex > this.models.length-2) {
        this.currentNewsItemIndex = -1;
      }

      this.currentNewsItemIndex++;
      this.currentNewsItem = this.at(this.currentNewsItemIndex);
      this.trigger('change:currentNewsItem', this.currentNewsItem);

    },

    rdm: function() {

      this.currentNewsItemIndex = Math.floor(Math.random()*this.models.length);
      this.currentNewsItem = this.at(this.currentNewsItemIndex);
      this.trigger('change:currentNewsItem', this.currentNewsItem);

    }

  })

  ///////////
  // VIEWS //
  ///////////

  //////////////////////
  // AudioStream View //
  //////////////////////
  // this is just a Html Audio Element
  News.Views.AudioStream = Backbone.LayoutView.extend({

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

  // News Items View
  News.Views.NewsItemsView = Backbone.LayoutView.extend({

    tagName: 'ul',

    initialize: function() {
      
    },

    showCurrentItem: function() {

      var items = this.$el.find('li').not('.current')
      ,   previousItem = this.$el.find('li.current')
      ,   currentItem = this.$el.find('li#news-item-' + this.collection.currentNewsItem.cid)

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

  // News Item View
  News.Views.NewsItemView = Backbone.LayoutView.extend({
    tagName: 'li',
    template: 'modules/news/news-item',

    initialize: function() {
      this.$el.attr('id', "news-item-" + this.model.cid);
    },

    // Provide data to the template
    serialize: function() {
      return this.model.toJSON();
    }

  });

  // Belgrade Encounters View
  News.Views.EncountersView = Backbone.LayoutView.extend({

    tagName: 'ul',

    beforeRender: function() {

      this.collection.each(function(model) {

        this.insertView(new News.Views.EncounterView({model: model}));

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
  News.Views.EncounterView = Backbone.LayoutView.extend({

    tagName: 'li',
    template: 'modules/news/encounter',

    initialize: function() {
      this.$el.attr('id', "encounter-" + this.model.cid);
    },

    // Provide data to the template
    serialize: function() {
      return this.model.toJSON();
    }

  })

  // Default View.
  News.Views.Layout = Backbone.Layout.extend({

    template: "news",

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

      // set News Items View
      this.newsItemsView = this.setView('#news-items', new News.Views.NewsItemsView());

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

  News.destroy = function() {

    console.log('News destroy');

  }

  // Return the module for AMD compliance.
  return News;

});