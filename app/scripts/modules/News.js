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

    var layout = new News.Views.Layout();

  }

  // Default Model.
  News.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  News.Collection = Backbone.Collection.extend({
    model: News.Model
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

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

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
