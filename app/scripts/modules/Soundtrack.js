define([
  // Application.
  "app"

],

// Map dependencies from above array.
function(app) {

	var Soundtrack = app.module();


	// Default Model
	Soundtrack.Model = Backbone.Model.extend({

	});

	// Default Collection.
	Soundtrack.Collection = Backbone.Collection.extend({
		model: Soundtrack.Model
	});

	Soundtrack.View = Backbone.LayoutView.extend({

		initialize: function() {

			this.popcorn = Popcorn( new Popcorn.HTMLAudioElement(this.el) );
			this.popcorn.loop(true);

			if(this.collection) {
				this.model = this.collection.at(0);
			}

			if(!this.model)
				return;

	  		this.popcorn.media.src = this.model.get('url');

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

	return Soundtrack;

});