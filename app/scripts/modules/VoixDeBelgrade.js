// VoixDeBelgrade module
define([
  // Application.
  "app",
  "modules/Video",
  "Howler",
  "Howl",

  // Css
  "css!../../styles/VoixDeBelgrade.css"
],

// Map dependencies from above array.
function(app, Video, Howler, Howl) {

  // Create a new module.
  var VoixDeBelgrade = app.module()
  ,   layout
  ,   voices
  ,   voices_view

  VoixDeBelgrade.init = function() {

    console.log('VoixDeBelgrade INIT');

    layout = new VoixDeBelgrade.Views.Layout();

  }

  // Default Model.
  VoixDeBelgrade.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  VoixDeBelgrade.Collection = Backbone.Collection.extend({
    model: VoixDeBelgrade.Model
  });


  // Voices - a view to rule them all
  VoixDeBelgrade.Views.Voices = Backbone.LayoutView.extend({

    voices_count: 90,
    current_voice: null,
    current_voice_index: null,
    next_index: null,
    voices_map: [],
    voices_array: [],
    min_timeout: 0.5,
    max_timeout: 3,
    timeout_ID: null,
    speaking: false,
    voice_w: 100,
    area: null,
    voice_h: null,
    cols_count: null,
    rows_count: null,

    speak: function(index) {

      var view = this
      ,   voice = this.voices_map[index]
      ,   index_str = index+1
      ,   index_str_formatted = index_str < 10? '0'+index_str : index_str
      ,   next_index = Math.floor(Math.random()*(this.voices_count-1))
      ,   timeout = _.random(this.min_timeout, this.max_timeout) * 1000
      ,   fadeIn_time = this.speaking? Math.round(Math.random()*1000) : 4000
      ,   fadeOut_time = _.random(2,10)*1000
      ,   $voice_visual = voice? $("#voice-"+index) : $('<div class="voice-visual" id="voice-'+index+'"></div>')
      ,   rdm_opacity = _.random(0.5,1)      
      ,   voice_w = this.voice_w
      ,   area = this.area
      ,   voice_h = this.voice_h
      ,   cols_count = this.cols_count
      ,   rows_count = this.rows_count

      // voice does not exist
      if(!voice) {
        voice = this.current_voice = this.voices_map[index] = new Howl({
          urls: ['medias/VoixDeBelgrade/bgd-voice-' + index_str_formatted + '.ogg', 'medias/VoixDeBelgrade/bgd-voice-' + index_str_formatted + '.mp3']
        });
        this.voices_array.push(voice);
      }
      else {
        $voice_visual.remove();
      }

      voice.fadeIn(rdm_opacity, 
        fadeIn_time,
        function() {
          voice.fadeOut(0, fadeOut_time);
        }
      );

      this.timeout_ID = setTimeout(function() { view.speak(next_index); }, timeout);
      this.next_index = next_index;

      // show voice
      $voice_visual.css({
        top: index%rows_count * voice_h,
        left: index%cols_count * voice_w,
        width: voice_w,
        height: voice_h,
        opacity: 0
      });

      //console.log(index + ' : ' + this.voices_array.length);

      this.$el.append($voice_visual);

      $voice_visual.transition({opacity: rdm_opacity, duration: timeout/2}, function() {
        $voice_visual.transition({opacity: 0, duration: timeout*1.1});
      });

      this.speaking = true;

    },

    stop: function() {

      clearTimeout(this.timeout_ID);
      this.current_voice.fadeOut(0, 500);
      this.speaking = false;

    },

    afterRender: function() {

      this.area = this.$el.width()*this.$el.height();
      this.voice_h = this.area/this.voices_count/this.voice_w;
      this.cols_count = Math.floor(this.$el.width()/this.voice_w);
      this.rows_count = Math.floor(this.$el.height()/this.voice_h);

      var index = Math.floor(Math.random()*this.voices_count);
      this.speak(index);

    }

  });

  // Default View.
  VoixDeBelgrade.Views.Layout = Backbone.Layout.extend({

    template: "VoixDeBelgrade",

    initialize: function() {

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);


      //////
      // Main Video view for chapter
      /////
      
      // Video Model
      //  // video info for this module
      var video_model = new Video.Model({

        name: 'VoixDeBelgrade',
        sources: [ 'medias/videos/VoixDeBelgrade.webm', 'medias/videos/VoixDeBelgrade.mp4'],
        dimensions: { width: '100%', height: '100%' },
        autoplay: true,
        enablePlayPause: false,
        loop: true

      });
      this.vv = this.setView("#VoixDeBelgrade-video", new Video.Views.Main({model: video_model}));

      // voices view - global to module
      voices_view = this.setView("#VoixDeBelgrade-voices", new VoixDeBelgrade.Views.Voices());


      // render layout
      this.render();

      // toggle button
      $('#VoixDeBelgrade-toggle').html('Faire taire les voix');
      $('#VoixDeBelgrade-toggle').click($.proxy(function(){

        if(voices_view.speaking) {
          voices_view.stop();
          $('#VoixDeBelgrade-toggle').html('Entendre les voix');
        }
        else {
          voices_view.speak(voices_view.next_index);
          $('#VoixDeBelgrade-toggle').html('Faire taire les voix');
        }
      }, voices_view));

      // init video
      this.vv.init();

      $('#module-container').transition({opacity: 1}, 2000);

    },

  });

  VoixDeBelgrade.destroy = function() {

    console.log('VoixDeBelgrade destroy');
    voices_view.stop();
    voices_view.voices_array = null;
    voices_view.voices_map = null;
    voices_view.remove();

  }

  // Return the module for AMD compliance.
  return VoixDeBelgrade;

});
