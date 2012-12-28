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

    /**
     * Init routine for Vieo View
     * this methd needs to be explicitly called for video instanciation through Popcorn
     * 
     * @return void
     */
    init: function() {

      if(!this.model)
        throw 'Video View requires a model';
      
      var d = this.model.get('dimensions');

      // adjust video container dimensions if provided
      if(d) {
        this.$el.css({ width: d.width, height: d.height});
      }

      // Popcorn instantiation
      this.popcorn = Popcorn.smart(this.el, this.model.attributes.sources);

      // adjust video dimensions if provided
      if(d) {
        this.$el.find('video').css({ width: d.width, height: d.height});
      }

      // autoplay?
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
