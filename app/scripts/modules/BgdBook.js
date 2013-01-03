// News module
define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var BgdBook = app.module();

  BgdBook.init = function() {

    console.log('BgdBook INIT');

    var layout = new BgdBook.Views.Layout();

  }

  // Default Model.
  BgdBook.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  BgdBook.Collection = Backbone.Collection.extend({
    model: BgdBook.Model
  });

  // Default View.
  BgdBook.Views.Layout = Backbone.Layout.extend({

    template: "bgd-book",

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

  BgdBook.destroy = function() {

    console.log('BgdBook destroy');

  }

  // Return the module for AMD compliance.
  return BgdBook;

});
