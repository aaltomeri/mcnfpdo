// News module
define([
  // Application.
  "app",

  "modules/Soundtrack",

    "css!../../styles/mail.css"
],

// Map dependencies from above array.
function(app, Soundtrack) {

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


  /**
   * View for displaying slices of the Kafka letter
   */
  Mail.Views.Brief = Backbone.LayoutView.extend({

    /**
     * the letter image source
     */
    brief_src: "medias/images/Brief_An_Der_Vater.jpg",

    /**
     * The source image
     */
    brief_image: new Image(),

    /**
     * canvas element that contains the scaled image
     * we need it to be able to slice into a scaled to stage image
     * @type {[type]}
     */
    canvas_src: null,

    /**
     * an array of data for all the letter slices
     * to be used when actually creating the canvas elements
     * @type {Array}
     */
    brief_slices_data: new Array(),

    /**
     * integer that represents the slice being shown
     */
    brief_slice_current_index: 0,

    /**
     * an array of canvas elements, each containing a slice of the letter
     * @type {Array}
     */
    brief_slices: new Array(),

    /**
     * the Soundtrack that we synchronize the displaying of the slices to
     */
    soundtrack: null,

    initialize: function() {

      this.soundtrack = new Soundtrack.View({
        model: app.sounds.find(function(model) { return model.get('name') == "Kafka" })
      });

      this.soundtrack.popcorn.loop(false);

      

    },

    init_sliced_brief: function(a) {

      // resize brief so that its width equals the container's
      //$(this.brief_image).width(this.$el.width());

      var view = this
      ,   i = a.target
      ,   offset_dx = 0
      ,   offset_dy = 0
      ,   iw = i.width - offset_dx*2
      ,   ih = Math.floor(i.height*(iw/i.width)) - offset_dy*2
      ,   rows = 80
      ,   cols = 6
      ,   n_slices = rows*cols
      ,   slice_w = Math.floor(iw/cols)
      ,   slice_h = Math.round(ih/rows)
      ,   max_lines = Math.floor(this.$el.height()/rows) - 1
      ,   index = 0
      ,   delta_ox = 0
      ,   delta_oy = 0
      ,   delta_dx = 10
      ,   delta_dy = 10

      // create a canvas that holds the scaled down image we will use to create the slices
      // if we use the original image we can't slice into a properly sized image
      var canvas_src = this.canvas_src = document.createElement('canvas')
      ,   ctx_src = canvas_src.getContext('2d')

      canvas_src.width = iw;
      canvas_src.height = ih;

      ctx_src.drawImage(i, 0, 0, iw, ih);

      // this.$el.append(this.brief_image);
      // return;

      for(var row_index = 0; row_index < rows; row_index++) {

        this.brief_slices[row_index] = new Array();

        var dy = (row_index%max_lines)*slice_h + (Math.floor(Math.random() * delta_dy) - delta_dy) + offset_dy;

        for(var col_index = 0; col_index < cols; col_index++) {

          this.brief_slices_data[index] = {
            row_index: row_index,
            col_index: col_index,
            slice_w: slice_w,
            slice_h: slice_h,
            ox: col_index*slice_w,// + (Math.floor(Math.random() * (delta_ox*2)) - delta_ox),
            oy: row_index*slice_h,// + (Math.floor(Math.random() * (delta_oy*2)) - delta_oy),
            dx: col_index*slice_w + (Math.floor(Math.random() * (delta_dx)) - delta_dx) + offset_dx,
            dy: dy
          } 

          index++;

        }

      }

      var start_time = new Date;

      for(var i = 0; i < view.brief_slices_data.length; i++){
        view.drawSlice(i);
        //view.insertSlice(i);
      }

      //return;

      var time = new Date;
      console.log((time.getTime()-start_time.getTime())/1000);

      view.soundtrack.play();
      
      var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
      window.requestAnimationFrame = requestAnimationFrame;

      this.soundtrack.popcorn.on('play', function() {

        console.log('play');

        var time_intvl;

        function _startAnimation() {
          console.log('start animation');
          time_intvl = Math.ceil((view.soundtrack.popcorn.duration() / view.brief_slices_data.length) * 1000);
          _insertSlice();
        }

        if(this.duration()) {
          _startAnimation();
        }
        else {
          this.on('canplay', function() {
            _startAnimation();
          })
        }
        

        console.log(time_intvl);

        function _insertSlice(time) {
            
          if(view.brief_slice_current_index < view.brief_slices_data.length) {

              setTimeout(function() {

                  var to_be_deleted_slice;

                  // insert slice
                  view.insertSlice(view.brief_slice_current_index++);

                  //delete old slices
                  if(view.brief_slice_current_index > cols*max_lines + 10) {
                    to_be_deleted_slice = view.brief_slices[view.brief_slice_current_index - (cols*max_lines) - 10];
                    $(to_be_deleted_slice).remove();
                  }

                  webkitRequestAnimationFrame(_insertSlice);

              }, time_intvl);

          }

        }

        

      });

    },

    drawSlice: function(index) {

      var c, $c, ctx
      ,   row_index = this.brief_slices_data[index].row_index
      ,   col_index = this.brief_slices_data[index].col_index
      ,   slice_w = this.brief_slices_data[index].slice_w
      ,   slice_h = this.brief_slices_data[index].slice_h
      ,   ox = this.brief_slices_data[index].ox
      ,   oy = this.brief_slices_data[index].oy
      ,   dx = this.brief_slices_data[index].dx
      ,   dy = this.brief_slices_data[index].dy

      $c = $('<canvas id="brief-slice-'+row_index+'-'+col_index+'" width="'+slice_w+'" height="'+slice_h+'"></canvas>')
      c = $c.get(0);
      ctx = c.getContext('2d');

      ctx.webkitImageSmoothingEnabled = false;

      this.brief_slices[index] = c;

      ctx.fillStyle = 'rgb(' + Math.floor(255-42.5*Math.random()*10) + ',' +
                       Math.floor(255-42.5*Math.random()*10) + ',0)';

      var di = ctx.drawImage(this.brief_image, ox, oy, slice_w, slice_h, 0, 0, slice_w, slice_h);
      //ctx.fillRect(0, 0, slice_w, slice_h);
      

    },

    insertSlice: function(index) {

      var c = this.brief_slices[index]
      ,   $c = $(c)
      ,   row_index = this.brief_slices_data[index].row_index
      ,   col_index = this.brief_slices_data[index].col_index
      ,   slice_w = this.brief_slices_data[index].slice_w
      ,   slice_h = this.brief_slices_data[index].slice_h
      ,   ox = this.brief_slices_data[index].ox
      ,   oy = this.brief_slices_data[index].oy
      ,   dx = this.brief_slices_data[index].dx + 26
      ,   dy = this.brief_slices_data[index].dy + 40

      $c.css({
        top: dy - (Math.floor(Math.random() * (100)) - 20),
        left: dx,// - (Math.floor(Math.random() * (100)) - 200),
        "z-index": index,
        opacity: 0,
        "-webkit-box-shadow": "1px 1px 5px rgba(0, 0, 0, 0.5)",
        //"-webkit-transform": "rotateX(180deg)"
      })

      this.$el.append(c);

      $c.transition({
        opacity: 1,
        top: dy,
        left: dx,
        //width: slice_w
        rotateX: '0deg',
        rotate: (Math.floor(Math.random() * (6)) - 3) + 'deg'
      }, 200, 'out');

    },

    afterRender: function() {

      // all operations relying on the container's dimensions are placed here 
      // because dimensions are set in % and container needs to be rendered for us to get its actual width

      this.brief_image.src = this.brief_src;

      $(this.brief_image).on('load', $.proxy(this.init_sliced_brief, this));

    }

  });


  // Default View.
  Mail.Views.Layout = Backbone.Layout.extend({

    template: "mail",

    initialize: function() {

      this.$el.css({height: '100%'});

      $('#module-container').css({opacity: 0});

      // add layout to the dom
      $('#module-container').empty().append(this.el);

      this.setView(new Mail.Views.Brief({id: 'brief'}));

      

      // render layout
      this.render();

      $('#module-container').transition({opacity: 1}, 2000);

    }

  });

  Mail.destroy = function() {

    console.log('Mail destroy');

  }

  // Return the module for AMD compliance.
  return Mail;

});
