// Video module
define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Video = app.module();
  
  Video.init = function() {
    
    var view = new Video.Views.Main();
    
  };

  // Default View.
  Video.Views.Main = Backbone.View.extend({

    popcorn: null,

    init: function() {

      var d;

      if(!this.model)
        throw 'Video View requires a model';

      this.popcorn = Popcorn.smart(this.el, this.model.attributes.sources);

      if(d = this.model.attributes.dimensions) {
        this.$el.css({ width: d.width, height: d.height});
        this.$el.find('video').css({ width: d.width, height: d.height});
      }

      if(this.model.attributes.autoplay)
        this.popcorn.play();

    }

  });

  

  // Default Model.
  Video.Model = Backbone.Model.extend({
      
  });

  // Default Collection.
  Video.Collection = Backbone.Collection.extend({
    model: Video.Model
  });


  // Return the module for AMD compliance.
  return Video;

});
