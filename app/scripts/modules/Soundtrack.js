define([
  // Application.
  "app",
  "buzz"

],

// Map dependencies from above array.
function(app, Buzz) {

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

			if(this.collection) {
				this.model = this.collection.at(0);
			}

			if(!this.model)
				return;

			this.$el.hide();
			$('body').append(this.$el);

			this.popcorn = Popcorn.smart(this.el, this.model.get('url')); 
			//this.popcorn = Popcorn( new Popcorn.HTMLAudioElement(this.el) );
			this.popcorn.loop(true);

	  		//this.popcorn.media.src = this.model.get('url');

		},

		// wrapper for popcorn instance play method
	    play: function(start_time, fade_in) {

	    	var p = this.popcorn
	    	,	bz = null

	    	function _play() {
	    		
	    		if(fade_in) {

			    	// default id no number given
			    	if(typeof(fade_in) != "number") {
			    		fade_in = 1000;
			    	}

		    		p.currentTime(start_time);

		    		bz = new Buzz.sound(p.media);
		    		bz.fadeIn(fade_in);

		    	}
		    	else {

		    		p.play(start_time);

	    		}

	    	}

	    	try {
	    		_play();
	    	}
	    	catch(error) {

		    	p.on('canplay', function() {
		    		_play();
		    	});

	    	}
	    	


	    },

	    // wrapper for popcorn instance pause method
	    pause: function(fade_out) {

	    	var p = this.popcorn
	    	,	bz = null

	    	if(fade_out) {

		    	// default id no number given
		    	if(typeof(fade_out) != "number") {
		    		fade_in = 1000;
		    	}

	    		bz = new Buzz.sound(p.media);
	    		bz.fadeOut(fade_out, function() {
	    			p.pause();
	    		});

	    	}
	    	else {

	    		p.pause();

	    	}
	    	
	    },

	    /**
	     * override remove method to allow for destroying popcorn instance
	     */
	    remove: function() {

	      if(this.popcorn) {

	        this.popcorn.destroy();
	        delete this.popcorn;
	        
	      }

	      Backbone.View.prototype.remove.apply(this, arguments);

	    }

	});



	return Soundtrack;

});