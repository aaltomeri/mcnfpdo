require([
  // Application.
  "app",

  // Main Router.
  "router"
],

function(app, Router) {

  // Define your master router on the application namespace and trigger all
  // navigation from this instance.
  app.router = new Router();

  app.resizeMain();

  app.debug = function() {
    console.log('--------------------------');
    console.log('Popcorn instances: ' + Popcorn.instances.length);
    console.log(Popcorn.instances);
    console.log('--------------------------');
  }

  app.on('goto', function(data) {
    Backbone.history.navigate('#' + data, true);
  });

  app.on('module:ttb:ready', function(module) {
    //app.resizeMain();
  });

  $(window).on('resize', function() { 
    app.resizeMain(); 
  });

  // global mute
  $('#global-mute').on('click', function() {

    if(!app.muted) {
      $(this).find('i').toggleClass('icon-volume-off icon-volume-up');
      _.each(Popcorn.instances, function(instance) { instance.mute(true); });
      app.muted = true;
    }
    else {
      $(this).find('i').toggleClass('icon-volume-off icon-volume-up');
      _.each(Popcorn.instances, function(instance) { instance.mute(false); });
      app.muted = false;
    }


  });
  
  // Devices redirections
  // ====================

  if(app.isPhone()) {
    window.location.replace('/blog/mcnfpdo-pour-telephone/');
    return;
  }

  // Trigger the initial route and enable HTML5 History API support, set the
  // root folder to '/' by default.  Change in app.js.
  Backbone.history.start({ pushState: false, root: app.root });

  // All navigation that is relative should be passed through the navigate
  // method, to be processed by the router. If the link has a `data-bypass`
  // attribute, bypass the delegation completely.
  $(document).on("click", "a:not([data-bypass])", function(evt) {
    // Get the absolute anchor href.
    var href = $(this).attr("href");

    // If the href exists and is a hash route, run it through Backbone.
    if (href && href.indexOf("#") === 0) {
      // Stop the default event to ensure the link will not cause a page
      // refresh.
      evt.preventDefault();

      // `Backbone.history.navigate` is sufficient for all Routers and will
      // trigger the correct events. The Router's internal `navigate` method
      // calls this anyways.  The fragment is sliced from the root.
      Backbone.history.navigate(href, true);
    }
  });

  window.app = app;

});
