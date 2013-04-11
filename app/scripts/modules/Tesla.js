// CollectiveUnconscious module
define([
  // Application.
  "app",
  "modules/Video",
  "css!../../styles/uc.css"
],

// Map dependencies from above array.
function(app, Video) {

  // Create a new module.
  var Tesla = app.module()
  ,   layout

  Tesla.init = function(action, slug) {

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
            //source += "&html5=1";
          }

          // add modified source
          sources.push(source)
          
        });

        // replace sources by modified ones
        model.set('sources', sources);

      });

      // default video if param passed
      if(action && action == "goto" && slug) {

         var model = this.find(function(model, index, a) {
          if(model.get('slug') == slug)
            return true;
        });

         var start_index = this.indexOf(model);
         // as first video is triggered by a playNext we set the index at the desired index - 1
         this.currentVideoIndex = start_index-1;

      }

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
    id: "uc",
    vv: null,// Video View

    initialize: function() {

      var layout = this;

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // render layout
      this.render();

      /**
       * All dynamically added elements must be added after render since render load a template and replaces $el.html with it
       */
      
      this.playNext();
      
      // previous button
      var next_bt = $('#uc-controls-previous');
      next_bt.on('click', function() { layout.playPrevious(); });

      // next button
      var previous_bt = $('#uc-controls-next');
      previous_bt.on('click', function() { layout.playNext(); });

      $('#module-container').transition({opacity: 1}, 2000);

    },

    playNext: function() {

      var model = this.collection.getNext();

      if(model)
        this.play(model);

    },

    playPrevious: function(in_point, out_point) {

      var model = this.collection.getPrevious();
      
      if(model)
        this.play(model);

    },

    play: function(model, in_point, out_point) {

      // create Video View and set its first Video Model to be the first model in collection (created from list of videos loaded at startup)
      var in_point = model.get('in_point')? model.get('in_point') : 0,
          out_point = model.get('out_point'),
          vv = this.vv,
          controller = this

      // browser history
      history.pushState({},"","#Tesla/goto/"+model.get('slug'));

      $('#uc-video-title').html(model.get('name'));

      //Video View has not been set yet
      if(!vv) {
        
        vv = this.vv = this.setView("#uc-video", new Video.Views.Main({model : model }));
        vv.render();

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
