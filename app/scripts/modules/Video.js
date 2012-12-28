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
      
      var dimensions = this.model.get('dimensions')
      ,   offset = this.model.get('offset')
      ,   autoplay = this.model.get('autoplay')

      // adjust video container dimensions if provided
      if(dimensions) {
        this.$el.css({ width: dimensions.width, height: dimensions.height});
      }

      // Popcorn instantiation
      this.popcorn = Popcorn.smart(this.el, this.model.attributes.sources);

      // adjust video dimensions if provided
      if(dimensions) {
        this.$el.find('video').css({ width: dimensions.width, height: dimensions.height});
      }

      // wrap all play actions in a 'canplay' callback
      this.popcorn.on('canplay', function() {

        if(offset)
          this.currentTime(offset);

        // autoplay?
        if(autoplay)
          this.play();

      })
     

      

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
