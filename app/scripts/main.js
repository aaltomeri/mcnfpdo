/* jQuery Tiny Pub/Sub - v0.7 - 10/27/2011
 * http://benalman.com/
 * Copyright (c) 2011 "Cowboy" Ben Alman; Licensed MIT, GPL */
(function(a){var b=a({});a.subscribe=function(){b.on.apply(b,arguments)},a.unsubscribe=function(){b.off.apply(b,arguments)},a.publish=function(){b.trigger.apply(b,arguments)}})(jQuery);

window.application = {

	youtube_apikey: 'AI39si6LU2csPMStKFyR0Y2-_1wcNPIbDCbf6S2g1rnN6cdiRLUyulAanMarPqV0QtAtOiMtdz_gnn1X7ilekSmYI-TOdtN4Dg',
	youtube_feed_url: 'https://gdata.youtube.com/feeds/api/videos?v=2&alt=json-in-script&format=5&callback=application.parseYoutubeFeed',
	youtube_videos: {},
	search_term: 'beograd',
	videos: [],
	max_instances: 6,

	google_api_key: 'AIzaSyCZyjGSINj8G5wX1RnCX-si_9xptWYRdnU',
	gmaps_api_url: 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=application.initBgdMap',

	scPlayer: null,

	init: function() {

		//this.getYoutubeFeed();

		//$.subscribe('app::videosReady', $.proxy(this.makeVideo, this));

		//this.initSounCloudAPI(); 
		
		//this.initWebcam();
		
		//this.initTestVideoSeek();
		
		//this.initTestSwitchVideos();
		
		this.loadGMapsAPI();
		
		//this.testVimeo();



	},

	testVimeo: function() {

		var vimeo_id_1 = 55932236
		,	vimeo_id_2 = 55932126;

		window._player = Popcorn.smart('#videos', 'http://player.vimeo.com/video/'+vimeo_id_1);
		_player.play();

		setTimeout(function() {
			_player.media.src = 'http://player.vimeo.com/video/'+vimeo_id_2;
			_player.play();
		}, 6000);
		

	},

	getYoutubeFeed: function() {

		var s = document.createElement('script')
		,	start_index = Math.round(Math.random()*100)

		s.src = this.youtube_feed_url + '&q=' + this.search_term + '&start-index=' + start_index + '&max-results=' + this.max_instances;	
		$('body').append(s);

	},

	parseYoutubeFeed: function(data) {

		this.youtube_videos = data.feed.entry;
		$.publish('app::videosReady');

	},

	initSounCloudAPI: function() {

		//use Popcorn HTMLSoundCloudAudioElement dummy element to load SC API and use ot for search
		this.scPlayer = Popcorn.HTMLSoundCloudAudioElement('audio');
		this.scPlayer.src = "http://soundcloud.com/fatcatrecords/the-twilight-sad-december-2012";

	},

	makeVideo: function() {

		var v
		,	_rdm_start_time
		,	container_id = 'v' + (this.videos.length+1)
		,	v_container = $('<div style="width: 313px; height: 234px;"></div>')
		,	_this = this;

		v_container.get(0).id = container_id;

		$('#videos').append(v_container); 

		// v = Popcorn.vimeo(

		// 	'#' + container_id,
		// 	'https://vimeo.com/53786471',
		// 	{}

		// );

		var ytv_id = this.youtube_videos[this.videos.length].id.$t.split('video:')[1]
		,	ytv_name = this.youtube_videos[this.videos.length].title.$t;

		v = Popcorn.youtube(

			'#' + container_id,
			//'http://youtu.be/uixTByj_NZY?html5=1&controls=0',
			'http://youtu.be/' + ytv_id + '?html5=1&controls=0&loop=1',
			{}

		);

		v.ytv_name = ytv_name;

		this.videos.push(v);

		v.on('play', function() {

			var _v;

			$('#notes').html(v.ytv_name);

			for(var vi = 0, l = _this.videos.length; vi < l; vi++) {

				_v = _this.videos[vi];

				if(v !== _v) {
					
					//pause
					_v.pause();

				}

			}

		});

		// listen to the pause event
		v.on('pause', function() {
			
			// replace video

		});
		/*
		v.code({
 			start: 3,
 			end: 6,
 			onStart: function(options) { _this.makeVideo(); },
 			onFrame: function(options) {},
 			onEnd: function(options) { $(v.media.parentNode).remove(); }
	    });
*/
		v.on('loadedmetadata', function(){
			_rdm_start_time = Math.round(Math.random()*v.duration());
			v.currentTime(_rdm_start_time);
			//v.volume(0);
			if(_this.videos.length < _this.max_instances)
				_this.makeVideo();

		});

		//v.play();

		return v;

	},

	initWebcam: function() {

		$('#webcam > img').css({
			width: '1024px',
			height: '768px'
		});

		var updateWebcam = function() {
			
			var rdm = Math.round(Math.random()*100000);


			$('#webcam > img').attr('src','http://www.mondo.rs/traffic_cams/1355003603/5.jpg?' + rdm);

		}

		setInterval(updateWebcam, 500);

	},

	initTestVideoSeek: function() {

		var src
		,	container = '<div id="v"></div>'
		, 	videos_container = $('#videos')
		,	v
		,	seek_itvl = 1000
		,	t1 = new Date().getTime()
		,	t2
		,	itvl
		,	d
		,	delays = new Array()
		,	total 
		,	average
		,	prev_position = 0;

		videos_container.append(container);

		src = 'test_640x360_9Mbs.mp4';
		src = 'test_640x360_240kbs.mp4';
		src = 'test_640x360_4Mbs.mp4';
		src = 'test_640x360_1Mbs.mp4';
		
		src = 'test_1280x720_5Mbs.mp4';
		src = 'test_1280x720_735kbs.mp4';
		src = 'test_1280x720_1Mbs.mp4';

		v = Popcorn.smart('#v', ['data/' + src])

		var _seek = function() {

			var rdmt = Math.round(Math.random() * v.duration());

			t1 = new Date().getTime();
			//v.pause(Math.round(rdmt);
			v.media.currentTime = rdmt;

		}

		v.on('canplay', function(e) { 
			console.log(e);
			console.log('CAN PLAY');
			itvl = setInterval(_seek, seek_itvl);
		});

		v.on('click', function() { 

			total = delays.reduce(function(a, b) {
			    return a + b;
			})
			average = Math.round(total/delays.length);

			clearInterval(itvl);

			console.log('Average seek time: ' + average);

		});

		v.on('seeked', function() {

			t2 = new Date().getTime();
			var d = t2-t1
			,	p = v.media.currentTime;

			console.log("jump length: " + Math.abs(p-prev_position) + " - time: " + d);

			prev_position = p;

			delays.push(d);
			
		});




	},

	initTestSwitchVideos: function() {

		var debug = ((window.location.hash == '#debug')? true : false)
		,	va_container = $('<div id="va"></div>')
		,	vb_container = $('<div id="vb"></div>')
		,	v_active = 'a'
		,	containers_css = {

			position: 'absolute',
			top: '0px',
			left: '0px'

		}
		,	_transparency = 0
		, 	_easing_a = 'in'
		, 	_easing_b = 'out'


		va_container.css(containers_css);
		vb_container.css(containers_css);

		// debug - display videos side by side 
		var debug_css = {

			position: 'relative',
			float: 'left',
			width: '50%'

		}

		if(debug) {
			va_container.css(debug_css);
			vb_container.css(debug_css);
		}

		$('#videos').append(vb_container);
		$('#videos').append(va_container);

		if(!debug)
			vb_container.transition({ opacity: _transparency });
		

		$('#videos').on('click', function() {

			if(v_active == 'a') {

				var time = va.currentTime();

				vb.pause(time);
				
				var _do = function() {

					va.pause(time);

					if(!debug) {
						va_container.transition({ opacity: _transparency }, 500, _easing_a);
						vb_container.transition({ opacity: 1 }, 500, _easing_b);
					}

					v_active = 'b';

				}

				vb.on('seeked', _do);

			}
			else {

				if(!debug) {
					va_container.transition({ opacity: 1 }, 500, _easing_b);
					vb_container.transition({ opacity: _transparency }, 500, _easing_a);
				}
				
				va.play();
				//vb.play();

				v_active = 'a';

			}

		});

		var va = Popcorn.smart('#va', ['data/test_640x360_1Mbs.mp4','data/test_switch_a.webm'])
		,	vb = Popcorn.smart('#vb', ['data/test_640x360_1Mbs_NB.mp4','data/test_switch_b.webm']);
		
		va.play();
		//vb.play();

	},

	loadGMapsAPI: function() {

		var script = document.createElement("script");
		script.type = "text/javascript";

		// the src for the api contains a callback parameter to trigger initBgdMap when API is ready to use
		script.src = this.gmaps_api_url;
		
		document.body.appendChild(script);

	},

	initBgdMap: function() {

		// create map container
		var map_div = $('<div id="bgd-map"></div>');
		map_div.css({
			width: '100%',
			height: '100%'
		});
		$('#main').css({height: '100%'});
		$('#main').html(map_div);

		// Map options
        var mapOptions = {
          zoom: 13,
          center: new google.maps.LatLng(44.81448,20.46674),
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: false,
          mapTypeControl: false
        }

        // create map
        var map = new google.maps.Map(map_div.get(0), mapOptions);

        // create infoWindow
        // only one info window will be used as we never are displaying more than one
        var infoWindow = new google.maps.InfoWindow({});

        // create info window content div as a DOM element
      	// so we can reference it easily
      	var infoWindow_content = $('<div style="width: 500px; height:281px; overflow: hidden"></div>').get(0);
      	infoWindow.setContent(infoWindow_content);

      	// marker icons images
      	var icon_image_on = 'images/mapicons_on/video.png'
        ,   icon_image_off = 'images/mapicons_off/video.png'

        // places (called mcnfpdo_places out of saturday night poetry frenzy)
      	var mcnfpdo_places = {
			'Appart Rideaux': {
				coordinates: {
					Lat: 44.815508,
					Lng: 20.460414
				},
				vimeo_id: 55932126
			},
			'Eglise BITEF': {
				coordinates: {
					Lat: 44.818129,
					Lng: 20.467201
				},
				vimeo_id: 55932236
			},
			'Fille blonde au chien bord de l\'eau': {
				coordinates: {
					Lat: 44.832652,
					Lng: 20.420018
				},
				vimeo_id: 55932126
			},
			'BIGZ': {
				coordinates: {
					Lat: 44.797246,
					Lng: 20.446338
				},
				vimeo_id: 55932236
			},
			'Sava Centar': {
				coordinates: {
					Lat: 44.809441,
					Lng: 20.431442
				},
				vimeo_id: 55932126
			},
			'Bus Novi Beograd (73)': {
				coordinates: {
					Lat: 44.804402,
					Lng: 20.405774
				},
				vimeo_id: 55932236
			},
			'Câbles de tram dans la nuit (Slavija)': {
				coordinates: {
					Lat: 44.802221,
					Lng: 20.466654
				},
				vimeo_id: 55932126
			},
			'Saul Leiter: voitures derrière parpaing plastique': {
				coordinates: {
					Lat: 44.805441,
					Lng: 20.477984
				},
				vimeo_id: 55932236
			},
			'Auberge Karadjordjeva': {
				coordinates: {
					Lat: 44.801373,
					Lng: 20.476036
				},
				vimeo_id: 55932126
			},
			'Bateau Sava à Ada': {
				coordinates: {
					Lat: 44.793927,
					Lng: 20.406028
				},
				vimeo_id: 55932236
			},
			'Atelier Zika': {
				coordinates: {
					Lat: 44.77457,
					Lng: 20.413327
				},
				vimeo_id: 55932126
			},
			'Cordage bateau': {
				coordinates: {
					Lat: 44.838374,
					Lng: 20.419248
				},
				vimeo_id: 55932236
			},
			'Carrefour hôtel PRESIDENT': {
				coordinates: {
					Lat: 44.810758,
					Lng: 20.455136
				},
				vimeo_id: 55932126
			},
			'Colleur d\'affiches': {
				coordinates: {
					Lat: 44.811276,
					Lng: 20.454524
				},
				vimeo_id: 55932236
			},
			'Trg Republike: flashmob': {
				coordinates: {
					Lat: 44.816398,
					Lng: 20.460286
				},
				vimeo_id: 55932126
			},
			'Danube Savane (Casino)': {
				coordinates: {
					Lat: 44.833375,
					Lng: 20.424988
				},
				vimeo_id: 55932236
			},
			'Musée de la révolution (tableaux etc.)': {
				coordinates: {
					Lat: 44.788133,
					Lng: 20.45181
				},
				vimeo_id: 55932126
			},
			'Escalier extérieur à Novi Beograd': {
				coordinates: {
					Lat: 44.804303,
					Lng: 20.379873
				},
				vimeo_id: 55932236
			},
			'Par la fenètre à Molerova': {
				coordinates: {
					Lat: 44.804296,
					Lng: 20.475596
				},
				vimeo_id: 55932126
			},
			'Café Plato avec étudiants': {
				coordinates: {
					Lat: 44.818148,
					Lng: 20.457835
				},
				vimeo_id: 55932236
			},
			'Marché avec fontaine': {
				coordinates: {
					Lat: 44.818917,
					Lng: 20.467424
				},
				vimeo_id: 55932126
			},
			'Gare (bar timelapse)': {
				coordinates: {
					Lat: 44.808288,
					Lng: 20.457299
				},
				vimeo_id: 55932236
			},
			'Dans la gare de Belgrade: vieux sur banc': {
				coordinates: {
					Lat: 44.808985,
					Lng: 20.455448
				},
				vimeo_id: 55932126
			},
			'Hotel Beograd de nuit': {
				coordinates: {
					Lat: 44.807447,
					Lng: 20.457889
				},
				vimeo_id: 55932236
			},
			'Immeuble crade avec carrefour (Slatkich)': {
				coordinates: {
					Lat: 44.808669,
					Lng: 20.478118
				},
				vimeo_id: 55932126
			},
			'Jeunes à Ada': {
				coordinates: {
					Lat: 44.787942,
					Lng: 20.415975
				},
				vimeo_id: 53782406
			},
			'Kalamegdan: surplombant la ville': {
				coordinates: {
					Lat: 44.82502,
					Lng: 20.445941
				},
				vimeo_id: 53782406
			},
			'Koloseum (Novi beograd)': {
				coordinates: {
					Lat: 44.802979,
					Lng: 20.380716
				},
				vimeo_id: 55932236
			},
			'Lac pollen Ada': {
				coordinates: {
					Lat: 44.791928,
					Lng: 20.416529
				},
				vimeo_id: 53782406
			},
			'Marché avec blonde qui vend des oranges': {
				coordinates: {
					Lat: 44.814124,
					Lng: 20.457028
				},
				vimeo_id: 55932236
			},
			'Marcheur de nuit Slavija': {
				coordinates: {
					Lat: 44.80216,
					Lng: 20.465962
				},
				vimeo_id: 55932126
			},
			'Alex avec Emilija en pute': {
				coordinates: {
					Lat: 44.817281,
					Lng: 20.458532
				},
				vimeo_id: 53782406
			},
			'Alex dans café en gentleman': {
				coordinates: {
					Lat: 44.816836,
					Lng: 20.458929
				},
				vimeo_id: 55932126
			},
			'Papy sur un banc à Novi Beograd': {
				coordinates: {
					Lat: 44.804494,
					Lng: 20.381954
				},
				vimeo_id: 53782406
			},
			'Persiennes: maison décatie (vers ton café de Prague)': {
				coordinates: {
					Lat: 44.820842,
					Lng: 20.460779
				},
				vimeo_id: 55932126
			},
			'Portes d\'appartements à Novi Beograd': {
				coordinates: {
					Lat: 44.801959,
					Lng: 20.376332
				},
				vimeo_id: 53782406
			},
			'Ancienne gare routière': {
				coordinates: {
					Lat: 44.810378,
					Lng: 20.453868
				},
				vimeo_id: 55932126
			},
			'Slatkouch: serveuse': {
				coordinates: {
					Lat: 44.80884,
					Lng: 20.477909
				},
				vimeo_id: 55932236
			},
			'Eglise St. Slava de nuit qui clignote': {
				coordinates: {
					Lat: 44.797216,
					Lng: 20.466278
				},
				vimeo_id: 55932126
			},
			'Place Slavija de nuit': {
				coordinates: {
					Lat: 44.802689,
					Lng: 20.466278
				},
				vimeo_id: 55932236
			},
			'Jardin du mausolée de Tito': {
				coordinates: {
					Lat: 44.786503,
					Lng: 20.451301
				},
				vimeo_id: 53782406
			},
			'Bigz': {
				coordinates: {
					Lat: 44.796706,
					Lng: 20.446134
				},
				vimeo_id: 55932236
			},
			'Tondeur de pelouse au bord de l\'eau (Casino)': {
				coordinates: {
					Lat: 44.829517,
					Lng: 20.42156
				},
				vimeo_id: 55932126
			},
			'Dans le tramway vers le zoo': {
				coordinates: {
					Lat: 44.823582,
					Lng: 20.459513
				},
				vimeo_id: 55932236
			},
			'Vieux sur un banc (Casino)': {
				coordinates: {
					Lat: 44.834311,
					Lng: 20.419589
				},
				vimeo_id: 53782406
			},
			'Hotel Moskva (vert)': {
				coordinates: {
					Lat: 44.812828,
					Lng: 20.460629
				},
				vimeo_id: 55932236
			},
			'Jugo Export': {
				coordinates: {
					Lat: 44.815831,
					Lng: 20.461118
				},
				vimeo_id: 55932126
			},
			'MJC immeuble doré avec un éclair': {
				coordinates: {
					Lat: 44.815344,
					Lng: 20.462776
				},
				vimeo_id: 53782406
			}
      	}

      	// loop through mcnfpdo_places/places
      	var count = 0;
      	for(var key in mcnfpdo_places) {

      		var mcnfpdo_place = mcnfpdo_places[key]
	      	
	      	// create google maps Marker
	      	var mrkr = new google.maps.Marker({
	      		animation: google.maps.Animation.DROP,
	      		//title: key
	      	});

	      	var placeMarker = function() {
	      		var _mrkr = mrkr
	      		,	delay = 2000 + (count*50);
	      		count++;
	      		setTimeout(function() { _mrkr.setMap(map); }, delay);
	      	}
			
			mrkr.setPosition(new google.maps.LatLng(mcnfpdo_place.coordinates.Lat,mcnfpdo_place.coordinates.Lng));
			mrkr.setIcon(icon_image_on);

			placeMarker();

			// add mcnfpdo_id property to Marker
			// to be able to map the mcnfpdo_place object to a marker
			// this will be used in the function that opens the info window
			mrkr.mcnfpdo_id = key;

			// click listener
			google.maps.event.addListener(mrkr, 'click', function() {

	        	map.setZoom(15);

	        	// opening the window
	        	// see below for initialization code (in domready callback)
	          	infoWindow.open(map,this);

	        });

			// add a mrker property to the mcnfpdo_place object
			// so we are able to get the marker corresponding to a mcnfpdo_place
			mcnfpdo_place.mrkr = mrkr;

      	}

        // listening to event that indicates the info window has been attached to the dom
        // this happens every time it is opened or its content is changed
      	google.maps.event.addListener(infoWindow, 'domready', function() {
      		
      		var vw_content = this.getContent()
      		,	_this = this
      		,	src = 'http://player.vimeo.com/video/' + mcnfpdo_places[this.anchor.mcnfpdo_id].vimeo_id;

  			if(typeof this.player !== 'object') {
  				this.player = Popcorn.smart(vw_content, src);
  				this.player.media.autoplay = true;
  			}
  			else {
  				this.player.media.src = src;
  				setTimeout(this.player.media.play, 2000);
  			}

	        this.anchor.setIcon(icon_image_off);

      		google.maps.event.addListener(this, 'closeclick', function() {
	          //map.setZoom(13);
	        });

      	});

	}

}

$(document).ready(function(){
  application.init();
});