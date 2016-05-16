// BelgradeVille module
define([

  // Application.
  "app",

  // google Maps
  'http://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=define'

],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var BelgradeVille = app.module()
  ,   layout
  ,   places

  BelgradeVille.init = function(action, start_index) {

    BelgradeVille.start_index = start_index;

    // poll for google.maps.version to see if it's actually loaded
    if(typeof google.maps.version === 'undefined') {
      console.log("Google Maps NOT loaded");
      setTimeout(function() { BelgradeVille.init(action, start_index)}, 10);
      return;
    }

    console.log("Google Maps loaded: " + google.maps.version);

    places = new BelgradeVille.Collection();
    layout = new BelgradeVille.Views.Layout({collection: places});

    places.on('reset', function() {

      var self = this;

      // function that looks for an existing (i.e. with a vimeo id) random video in collection
      function setRdmVideo() {

        BelgradeVille.start_index = Math.floor(Math.random()*self.models.length-1);

        // search for a place with a video
        if(!self.at(BelgradeVille.start_index).get('vimeo_id'))
          setRdmVideo();

      }

      // set random video id if given video does not exist
      if(BelgradeVille.start_index) {

        // out of bounds OR no vimeo id
        if(BelgradeVille.start_index > this.models.length-1 || !this.at(BelgradeVille.start_index).get('vimeo_id'))
          setRdmVideo();
      
      }


      layout.createMap();

    });

    places.fetchData();

  };

  // marker icons images
  var icon_image_on = 'images/mapicons_on/video.png'
  ,   icon_image_off = 'images/mapicons_off/video.png'
  ,   icon_image_missing = 'images/mapicons_missing/video.png'

  // Default Model.
  BelgradeVille.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  BelgradeVille.Collection = Backbone.Collection.extend({
    
    model: BelgradeVille.Model,

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
  BelgradeVille.Views.IwContent = Backbone.LayoutView.extend({
    template: "modules/bgd-map/iw_content",
    className: "iw_content",

  });

  // Default View.
  BelgradeVille.Views.Layout = Backbone.Layout.extend({

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
      var iw_content_view = new BelgradeVille.Views.IwContent();

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

      $('#bgd-map').css({width: "100%", height: "100%"});
      
      google.maps.visualRefresh = true;

      // create map
      this.map = new google.maps.Map($('#bgd-map').get(0), mapOptions);

      this.createPlaces(this.collection.models);
      this.initInfoWindow();

      // open info window if param has been passed to module
      if(BelgradeVille.start_index)
        this.infoWindow.open(this.map, this.collection.at(BelgradeVille.start_index).mrkr);

      $('#module-container').transition({opacity: 1}, 2000);

    },

    createPlaces: function (data) {

      var _this = this;

      // loop through places
      
      var count = 0;

      this.collection.each( function (place, index) {

        // deal with missing videos
        if(place.get('vimeo_id') === null)
          return;

        // create google maps Marker
        var mrkr = new google.maps.Marker({
          animation: google.maps.Animation.DROP,
          title: "",//place.get('name')
          index: index
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
          history.pushState({},"","#BelgradeVille/goto/"+mrkr.index);

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
          , place = this.anchor.place
          , src = 'http://player.vimeo.com/video/' + place.get('vimeo_id');

          // playe exists
          // destroy it and remove the vimeo iframe
          // note: I tried to change src for an existing player but did not succeed so I tear down and rebuild
          // this is working for this case at least  
          if(typeof layout.player == 'object') {

            layout.destroyPlayer();

          }

          layout.player = Popcorn.smart(vw_content, src);
          layout.player.autoplay(true);

          layout.player.on('ended', function() { 
            _iw.close();
            layout.destroyPlayer();
            layout.map.setZoom(13);
          });

          layout.player.on('canplay', function() {

            // ANALYTICS
            _gaq.push(['_trackEvent', 'Vidéos', 'View', place.get('name')]);

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

          if(!view.infoWindow.initialized) {

            google.maps.event.addListener(this, 'closeclick', function() {
              layout.map.setZoom(13);
              layout.destroyPlayer();
            });

            view.infoWindow.initialized = true;

          }


      });

    },

    destroyPlayer: function() {

      if(!this.player)
        return;

      this.player.destroy();
      delete this.player;

      if($(this.infoWindow.getContent()).find('iframe').length) {
        $(this.infoWindow.getContent()).find('iframe').remove();
      }

    }

  });

  BelgradeVille.destroy = function() {

    layout.destroyPlayer();
    console.log('BelgradeVille destroy');

  }

  // Return the module for AMD compliance.
  return BelgradeVille;

});
