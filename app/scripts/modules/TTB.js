// Ttb module
define([
  // Application.
  "app"
],

// Map dependencies from above array.
function(app) {

  // Create a new module.
  var Ttb = app.module();

  // Default Model.
  Ttb.Model = Backbone.Model.extend({
  
  });

  // Default Collection.
  Ttb.Collection = Backbone.Collection.extend({
    model: Ttb.Model
  });

  // Default View.
  Ttb.Views.Layout = Backbone.Layout.extend({
    template: "ttb"
  });

  // Return the module for AMD compliance.
  return Ttb;

});
