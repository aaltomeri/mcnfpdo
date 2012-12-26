// Bgdmap module
define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Bgdmap = app.module();

  // Default Model.
  Bgdmap.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  Bgdmap.Collection = Backbone.Collection.extend({
    model: Bgdmap.Model
  });

  // Default View.
  Bgdmap.Views.Layout = Backbone.Layout.extend({
    template: "bgdmap"
  });

  // Return the module for AMD compliance.
  return Bgdmap;

});
