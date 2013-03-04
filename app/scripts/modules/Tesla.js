// News module
define([
  // Application.
  "app",
  "modules/Video"
],

// Map dependencies from above array.
function(app, Video) {

  // Create a new module.
  var Tesla = app.module()
  ,   layout

  Tesla.init = function() {

    console.log('Tesla INIT');

    var videos = new Tesla.Collection();

    videos.on('reset', function() {

      this.each(function(model) { 
        
       // add autoplay to all models
        model.set('autoplay', true);

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

      });

      layout = new Tesla.Views.Layout({ collection: this });


    });

    videos.fetchData();

  }

  // Default Model.
  Tesla.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  Tesla.Collection = Backbone.Collection.extend({

    model: Video.Model,
    currentVideoIndex: -1,

    fetchData: function() {

      var _this = this;
      $.get('data/tesla-videos.txt').done(

        function(data) { 

          _this.reset($.parseJSON(data));

        }
      );

    },

    getPrevious: function() {

      if(this.currentVideoIndex > 0) {
        this.currentVideoIndex--;
      }
      else {
        return;
      }
      
      return this.at(this.currentVideoIndex);

    },

     getNext: function() {

      this.currentVideoIndex++;

      if(this.currentVideoIndex > this.models.length - 1) {

        this.currentVideoIndex = 0;

      }

      return this.at(this.currentVideoIndex);

    }

  });

  // Default View.
  Tesla.Views.Layout = Backbone.Layout.extend({

    template: "tesla",
    vv: null,// Video View

    initialize: function() {

      var layout = this;

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      this.playNext();

      // render layout
      this.render();

      /**
       * All dynamically added elements must be added after render since render load a template and replaces $el.html with it
       */
      
      // next button for debugging
      var next_bt = $('<button>NEXT</button>');
      next_bt.css({position: "absolute", top: 0, left: 0, "z-index": 200})
      this.$el.append(next_bt);

      next_bt.on('click', function() { layout.playNext(); });

      $('#module-container').transition({opacity: 1}, 2000);

    },

    playNext: function(in_point, out_point) {

      // create Video View and set its first Video Model to be the first model in collection (created from list of videos loaded at startup)
      var model = this.collection.getNext(),
          in_point = model.get('in_point')? model.get('in_point') : 0,
          out_point = model.get('out_point'),
          vv = this.vv,
          controller = this

      //Video View has not been set yet
      if(!vv) {
        
        vv = this.vv = this.setView(new Video.Views.Main({model : model }));

        // for debugging
        window.tv = vv.popcorn;

      }
      else { // Video View exists so all we do is change its model
        vv.model = model;
      }

      vv.init();
      vv.popcorn.play(in_point);

      // init behaviors - deprecated since Youtube wrapper seems to work fine with new version of popcorn
      // vv.popcorn.on('canplay', function() {
      //   vv.popcorn.currentTime(in_point);
      //   this.on('seeked', function() { this.play(); });
      // });

      vv.popcorn.on('timeupdate', function() {

        if(out_point && this.currentTime() > out_point) {

          controller.playNext();

        }

      });

    }


  });

  Tesla.destroy = function() {

    console.log('Tesla destroy');

    layout.vv.remove();

  }

  // Return the module for AMD compliance.
  return Tesla;

});
