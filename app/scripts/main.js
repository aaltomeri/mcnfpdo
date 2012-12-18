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

	scPlayer: null,

	init: function() {

		//this.getYoutubeFeed();

		//$.subscribe('app::videosReady', $.proxy(this.makeVideo, this));

		//this.initSounCloudAPI(); 
		
		//this.initWebcam();
		
		//this.initTestVideoSeek();
		
		this.initTestSwitchVideos();

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

	}

}

$(document).ready(function(){
  application.init();
});