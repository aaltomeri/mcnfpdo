// BgdMap module
define([

  // Application.
  "app",

  // google Maps
  'http://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=define'

],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var BgdMap = app.module(),

  init = function() {

    // poll for google.maps.version to see if it's actually loaded
    if(typeof google.maps.version === 'undefined') {
      console.log("Google Maps NOT loaded");
      setTimeout(init, 10);
      return;
    }

    console.log("Google Maps loaded: " + google.maps.version);

    var places = new BgdMap.Collection();
    var layout = new BgdMap.Views.Layout({collection: places});

    places.on('reset', function() { layout.createMap() });
    places.fetchData();

  }

  // marker icons images
  var icon_image_on = 'images/mapicons_on/video.png'
  ,   icon_image_off = 'images/mapicons_off/video.png'
  ,   icon_image_missing = 'images/mapicons_missing/video.png'

  // Default Model.
  BgdMap.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  BgdMap.Collection = Backbone.Collection.extend({
    
    model: BgdMap.Model,

    fetchData: function() {

      var _this = this;
      $.get('data/places.txt').done(
        function(data) { 
          _this.reset($.parseJSON(data));
        }
      );

    }

  });

  // Info Window Content View
  BgdMap.Views.IwContent = Backbone.LayoutView.extend({
    template: "iw_content",
    className: "iw_content",

  });

  // Default View.
  BgdMap.Views.Layout = Backbone.Layout.extend({

    template: "bgd-map",

    initialize: function() {

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // render layout
      this.render();

      // create infoWindow
      // only one info window will be used as we never are displaying more than one
      var iw_content_view = new BgdMap.Views.IwContent();

      iw_content_view.render();

      this.infoWindow = new google.maps.InfoWindow({
        content: iw_content_view.$el.find('> div').get(0)
      });

    },

    createMap: function() {

      // Map options
      var mapOptions = {
        zoom: 13,
        center: new google.maps.LatLng(44.81448,20.46674),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        mapTypeControl: false,
        styles: [
          {
            "featureType": "poi",
            "stylers": [
              { "visibility": "off" }
            ]
          },{
            "featureType": "transit",
            "stylers": [
              { "visibility": "simplified" }
            ]
          },
          {
            "featureType": "poi.park",
            "stylers": [
              { "visibility": "simplified" }
            ]
          }
        ]
      }

      // create map
      this.map = new google.maps.Map(this.el, mapOptions);

      this.createPlaces(this.collection.models);
      this.initInfoWindow();

      $('#module-container').transition({opacity: 1}, 2000);

    },

    createPlaces: function (data) {

      var _this = this;

      // loop through places
      
      var count = 0;

      this.collection.each( function (place) {

        // create google maps Marker
        var mrkr = new google.maps.Marker({
          animation: google.maps.Animation.DROP,
          title: place.get('name')
        });

        // delayed Marker placement for a nice visual effect on arrival
        var placeMarker = function() {
          var _mrkr = mrkr
          , delay = 1000 + (count*50);
          count++;
          setTimeout(function() { _mrkr.setMap(_this.map); }, delay);
        }
    
        mrkr.setPosition(new google.maps.LatLng(place.get('coordinates').Lat,place.get('coordinates').Lng));
        
        mrkr.setIcon((place.get('vimeo_id') !== null)? icon_image_on : icon_image_missing);

        placeMarker();

        if(!place.get('vimeo_id'))
          return;

        // add mcnfpdo_id property to Marker
        // to be able to map the place object to a marker
        // this will be used in the function that opens the info window
        mrkr.place = place;

        // click listener
        google.maps.event.addListener(mrkr, 'click', function() {

          _this.map.setZoom(15);

          // opening the window
          // see below for initialization code (in domready callback)
          _this.infoWindow.open(_this.map, this);

        });

        // add a mrker property to the place object
        // so we are able to get the marker corresponding to a mcnfpdo_place
        place.mrkr = mrkr;

      })

    },

    initInfoWindow: function() {

        var view = this;

        // listening to event that indicates the info window has been attached to the dom
        // this happens every time it is opened or its content is changed
        google.maps.event.addListener(view.infoWindow, 'domready', function() {
          
          var vw_content = this.getContent()
          , _iw = this
          , _player = this.player
          , src = 'http://player.vimeo.com/video/' + this.anchor.place.get('vimeo_id');

        if(typeof this.player !== 'object') {

          window._player = this.player = Popcorn.smart(vw_content, src);
          this.player.media.autoplay = true;

          this.player.on('ended', function() { 
            //_iw.close();
          });

          this.player.on('canplay', function() { 

            var setVisited = function() { 
            // set marker to 'visited' after 2 seconds
            if(this.currentTime() > 4) {
              _iw.anchor.setIcon(icon_image_off);
              this.off('timeupdate', setVisited);
            } 
          }

          // set setVisited
          if(_iw.anchor !== null) {
            if(_iw.anchor.getIcon() != icon_image_off) {
                this.on('timeupdate', setVisited);
              }
            }

          });

        }
        else {
          // add random number to src if it has not changed
          // allows for autoplaying src even if it's the same as the previously watched
          // this has to do with the HTMLVimeoVideoElement changeSrc method - triggered only if src has changed
          // I tried to call play() on the media instead of doing this but it was not working
          // probably because 'play' is not fwded to iframe player after it's been removed and re-added to the dom (closing and re-opening the info window)
          if(this.player.media.src == src) {
            src += '?rdm=' + Math.round(Math.random()*10000);
            //this.player.play();
          }

          this.player.media.src = src;

        }

          google.maps.event.addListener(this, 'closeclick', function() {
            //map.setZoom(13);
          });

        });
    }

  });

  setTimeout(init, 10);

  // Return the module for AMD compliance.
  return BgdMap;

});
