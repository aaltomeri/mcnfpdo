// BgdBook module
define([
  // Application.
  "app",
  "modules/Video",
  "https://www.googleapis.com/customsearch/v1?key=AIzaSyCZyjGSINj8G5wX1RnCX-si_9xptWYRdnU&cx=011524589172753646057:qnfoalr-ilu&q=belgrade+fisera&lr=lang_fr&callback=define",
  "css!../../styles/bgd-book.css"
],

// Map dependencies from above array.
function(app, Video, SearchEngine) {

  // Create a new module.
  var BgdBook = app.module()
  ,   layout

  BgdBook.init = function() {

    console.log('BgdBook INIT');

    BgdBook.soundtrack.pause();

    var videos = new BgdBook.Collection();

    videos.on('reset', function() {
      layout = new BgdBook.Views.Layout({ collection: this });
    });

    videos.fetchData();

  }

  // Default Model.
  BgdBook.Model = Backbone.Model.extend({

  });

  // Default Collection.
  BgdBook.Collection = Backbone.Collection.extend({

    model: Video.Model,

    fetchData: function() {

      var _this = this;
      $.get('data/bgdbook-videos.txt').done(

        function(data) { 

          _this.reset($.parseJSON(data));

        }
      );

    }

  });

  /**
   * InfoPanel View
   */
  BgdBook.Views.InfoPanel = Backbone.LayoutView.extend({

      className: "infos",
      template: "modules/bgd-book/infos",

      initialize: function() {

        // hide at start
        this.$el.css({opacity: 0});

      },

      afterRender: function() {

        if(this.options.title) {
          this.$el.find('.title').html(this.options.title);
        }

        if(this.options.text) {
          this.$el.find('.body').html(this.options.text);
        }

      }

  });


  /**
   * SearchResults View
   * extends InfoPanel View and inserts search results
   */
  BgdBook.Views.SearchResults = BgdBook.Views.InfoPanel.extend({
    
    initialize: function() {

      // calls parent intialize method
      BgdBook.Views.InfoPanel.prototype.initialize.apply(this, arguments);

    },

    afterRender: function() {

      // calls parent afterRender method
      BgdBook.Views.InfoPanel.prototype.afterRender.apply(this, arguments);

      if(!SearchEngine.items && SearchEngine.error) {
        this.$el.find('.body').append('<div><p>' + SearchEngine.error.message + '</p></div>');
        return;
      }

      var results = SearchEngine.items;

      for(var index = 0; index < results.length; index++) {
        this.$el.find('.body').append('<div><p><a href="' + results[index].link + '">' + results[index].htmlTitle + '</a></p></div>');
      }

    }

  });

  // Default View.
  BgdBook.Views.Layout = Backbone.Layout.extend({

    template: "bgd-book",
    id: "bgd-book",

    currentVideoIndex: null,
    previousVideo: null,
    currentVideo: null,

    initialize: function() {

      this.$el.css({ 
        width: '100%', 
        height: '100%'
      });

      $('#module-container').css({opacity: 0});

      // looping through video models
      this.collection.each(function(model) {

        // temporary
        // replacing Vimeo base url to allow for tests with local .mp4 videos with same ID
        // ex: http://player.vimeo.com/video/57062884
        // becomes medias/videos/57062884.mp4
        var sources = model.get('sources');
        _.each(sources, function(el, index, list) { 
          sources[index] = el.replace('http://player.vimeo.com/video/','medias/videos/') + '.mp4';
        });

        // setting views on Layout - adding true as last argument to append rather than replace
        //this.setView(new Video.Views.Main({model : model, className: model.get('className')}), true);

      }, this);

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // render layout
      this.render();

      $('#module-container').transition({opacity: 1}, 2000);

      // play first video
      this.playNext(0);
        

    },

    playNext: function(index) {

      this.currentVideoIndex = index;

      // SHOW PANELS
      // -----------
      
      // show info panel
      // hard coded index of video to show this panel after
      if(this.currentVideoIndex == 4) {
        this.showInfos();
      }

      // show credits panel
      // hard coded index of video to show this panel after
      if(this.currentVideoIndex == this.collection.models.length - 3) {
        this.showCredits();
      }

       // if there is no next video we dont need to setup the mechanism that launches it
      // but we display the search results
      if(this.currentVideoIndex > this.collection.models.length - 1) {

        // this.showSearchResults();
        // return;
        
      };



      // INIT VIDEO
      // ----------

      var model = this.collection.at(index)
      ,   vv = this.currentVideo = this.setView(new Video.Views.Main({model : model, className: 'bgd-book-video'}), true)

      vv.render();
      this.initVideoViewBehavior(vv, index);

      var left_delta = 20
      ,   top_delta = 20;

      // play next video
      vv.$el.transition({
        opacity: 1,
        left: vv.$el.position().left + (Math.floor(Math.random() * ((left_delta + left_delta + 1)) - left_delta) + 2),
        top: vv.$el.position().top + (Math.floor(Math.random() * ((top_delta + top_delta + 1)) - top_delta) + 2)
      }, 1000);

      // PLAY VIDEO
      vv.popcorn.play();

      if(this.previousVideo)
        vv.$el.css({"z-index": parseInt(this.previousVideo.$el.css("z-index")) + 1});

      this.previousVideo = this.currentVideo;

    },

    initVideoViewBehavior: function(view, index) {

        var _this = this

        // init view - i.e. create popcorn instance
        view.init();

        var styles = {
            position: 'absolute',
            top: view.model.get('position').top,
            left: view.model.get('position').left,
            "z-index": index
          }

        // position view
        view.$el.css(styles);

        // set video element dimensions to match containers
        // add border
        view.$el.find('video').css({
          width: "100%", 
          height: "auto"
        });

        // wrap behavior init in 'canplay' event handler because we need video duration
        view.popcorn.on('canplay', function() {

          var slice = null;
          // set random out_point
          view.model.set('out_point', view.model.get('out_point')? view.model.get('out_point') : (slice? slice : view.popcorn.duration()));
          
          // define timeupdate handler used to play next video if out_point has been overshot
          var playnext_handler = function() {

            var time = null;

            // overshooting out_point
            if(this.currentTime() >= view.model.get('out_point')) {

              // remove handler
              this.off('timeupdate', playnext_handler);

              if(view.model.get('out_point') > this.duration()) {
                view.model.set('out_point', slice);
                time = 0;
              }

              view.popcorn.pause(time);

              var rotation_delta = 1;

              // remove video or whole view
              if(!view.model.get('keep')) {

                view.$el.transition({
                  opacity:0,
                  scale: 0.9,
                  rotate3d: '0, 0, 1, ' + (Math.floor(Math.random() * ((rotation_delta + rotation_delta + 1)) - rotation_delta) + 2) + 'deg',
                }, function() { 

                  view.popcorn.destroy();
                  view.$el.remove();

                });

              }
              else {

                // show still
                var still = view.createStill();
                view.showStill(still, true, {top: 0, left: 0}, function() {

                    view.popcorn.destroy();
                    view.$el.find('video').remove();

                      view.$el.transition({
                        duration: 1000,
                        opacity: 0.99,
                        scale: 0.9,
                        rotate3d: '0, 0, 1, ' + (Math.floor(Math.random() * ((rotation_delta + rotation_delta + 1)) - rotation_delta) + 2) + 'deg',
                      });

                });

              }

              _this.currentVideoIndex++;

              _this.playNext(_this.currentVideoIndex);
            
            }
          }

          // make videos start next video on ending
          view.popcorn.on('timeupdate', playnext_handler);

        });

    },

    showPanel: function(id, title, text, panelRotate3dParams, delay) {

      // set Search  Results View
      var view = this.setView(
        '#' + id, 
        new BgdBook.Views.InfoPanel(
          {
            title: title,
            text: text
          }), true
      )
      view.render();

      // display Search Results View
      view.$el.transition({
        delay: delay? delay : 0,
        opacity: 0.99,
        rotate3d: panelRotate3dParams? panelRotate3dParams : '-1, 0, 0, -4deg'
      }, 600);

    },

    showSearchResults: function(title) {

      // set Search  Results View
      var view = this.setView('#search-results', new BgdBook.Views.SearchResults({title: "Belgrade / Liens"}), true)
      view.render();

      // display Search Results View
      view.$el.transition({
        opacity: 0.99,
        rotate3d: '4, -20, 11, 4deg'
      }, 600);

    },

    showInfos: function() {

      this.showPanel(
          "infos",
          "Répétitions de \"Belgrade\"",
          "<p>Images des répétitions de la pièce \"Belgrade\".</p><p>Avec les comédiens Julie Denisse, Vladislav Galard, Alexandre Pallu, Laurent Sauvage.</p><p>Septembre 2012.</p>"
          , '-1, 0, -2, -2deg'
          , 4000
        );

    },

    showCredits: function() {

      this.showPanel(
          "credits",
          "\"Belgrade\" d'Angélica Liddell",
          "<p>traduction Christilla Vasserot</p>"
          + "<p>Mise en scène <strong>Julien Fišera</strong></o>"
          + "<p>Avec <strong>Julie Denisse</strong>, <strong>Vladislav Galard</strong>, <strong>Alexandre Pallu</strong>, <strong>Laurent Sauvage</strong></p>"
          + "<p>Editions Théâtrales / Maison Antoine Vitez (2010)</p>"
          + "<p>Dates de représentation :<br/>"
          + "<strong>Du 18 au 22 mars 2013</strong> - La Comédie de Saint-Etienne CDN<br/>"
          + "<strong>Du 28 mai au 1er juin 2013</strong> - Théâtre de Vanves SC<br/>"
          + "<strong>Septembre 2013</strong> - Festival BITEF Belgrade <br/>"
          + "<strong>3 octobre 2013</strong> - Le Grand R, Scène nationale de La Roche-sur-Yon<br/>"
          + "<strong>Octobre</strong> - Reprise au Théâtre de Vanves SC</p>"
          + "<a href=\"http://www.compagnieespacecommun.com\" target=\"\_blank\">Compagnie Espace commun</a><br/>"
          + "<a href=\"http://www.thomas-mery.net\" target=\"\_blank\">Thomas Mery</a><br/>"
          + "<a href=\"http://jeremiescheidler.com\" target=\"\_blank\">Jérémie Scheidler</a><br/>"
          + "<a href=\"http://www.magnanerie-spectacle.com/la_magnanerie.html\" target=\"\_blank\">La Magnanerie</a><br/>"
          + "<a href=\"http://www.lacomedie.fr/index.php/fr/les-productions/coproductions/icalrepeat.detail/2013/03/18/181/-/belgrade\" target=\"\_blank\">La Comédie de Saint-Etienne</a><br/>"
          + "<a href=\"http://www.theatre-vanves.fr/fiche-simple.php?cle=belgrade\" target=\"\_blank\">Le Théâtre de Vanves</a><br/>"
          + "<a href=\"http://www.bitef.rs/festival/?pg=predstave&jez=en\" target=\"\_blank\">Bitef Festival</a><br/>"
        , "-1, -1, 1, -1deg");

    }

  });

  

  BgdBook.destroy = function() {

    console.log('BgdBook destroy');

  }

  // Return the module for AMD compliance.
  return BgdBook;

});
