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
  var News = app.module();

  News.init = function() {

    console.log('NEWS INIT');

    var layout;

    var audiostreams = new News.AudioStreams();
    audiostreams.on('reset', function() {
      layout = new News.Views.Layout({audiostreams: this});
    });
    audiostreams.fetchData();

  }

  // Default Model.
  News.Model = Backbone.Model.extend({
  
  });

  // AudioStream Model
  News.AudioStream = News.Model.extend({

  });

  // Default Collection.
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

  // AudioStream View
  // this is just a Html Audio Element
  News.Views.AudioStream = Backbone.LayoutView.extend({

    popcorn: null,

    initialize: function() {

      var view = this;

      this.popcorn = new Popcorn.HTMLAudioElement(this.el);
      this.popcorn.src = this.model.get('url');

      this.model.on('change:url', this.change, this);

      this.$el.append('<button>Change Radio</button>');
      this.$el.append('<div class="infos"></div>');


      this.$el.find('button').on('click', function() {

        view.collection.currentStream++;

        var nextStream = view.collection.at(view.collection.currentStream);

        view.model.set('name', nextStream.get('name'));
        view.model.set('url', nextStream.get('url'));

        
        
      });

      this.change(this.model);

    },

    change: function(model) {
      console.log(model.get('name'));
      this.popcorn.src = model.get('url');
      this.$el.find('.infos').html(model.get('name'));
      this.pause();
      this.play();
    },

    // wrapper for popcorn instance play method
    play: function() {
      this.popcorn.play();
    },

    // wrapper for popcorn instance pause method
    pause: function() {
      this.popcorn.pause();
    }

  });

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
      ,   audiostreamView

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

     
      // set AudioStream View
      // one View to listen to them all
      window.as = audiostreamView = this.setView('#audiostream', new News.Views.AudioStream({model: audiostreams.at(0), collection: audiostreams}))

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

        $('#webcam > img').attr('src', _webcam_url);

      }

      //$('#webcam > img').on('load', updateWebcam);
      $('#webcam > img').on('error', function() { 
        webcam_url = getWebcam(); 
        updateWebcam(); 
      });
      $('#webcam > img').attr('src', webcam);


     setInterval(updateWebcam, 1000);

    }

  });

  News.destroy = function() {

    console.log('News destroy');

  }

  // Return the module for AMD compliance.
  return News;

});