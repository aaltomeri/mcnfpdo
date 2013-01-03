// News module
define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Mail = app.module();

  Mail.init = function() {

    console.log('Mail INIT');

    var layout = new Mail.Views.Layout();

  }

  // Default Model.
  Mail.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  Mail.Collection = Backbone.Collection.extend({
    model: Mail.Model
  });

  // Default View.
  Mail.Views.Layout = Backbone.Layout.extend({

    template: "mail",

    initialize: function() {

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      // render layout
      this.render();

      $('#module-container').transition({opacity: 1}, 2000);

    },

  });

  Mail.destroy = function() {

    console.log('Mail destroy');

  }

  // Return the module for AMD compliance.
  return Mail;

});
