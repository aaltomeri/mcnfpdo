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
      ,   container_w = this.$el.width()
      ,   container_h = this.$el.height()
      ,   rows = 80
      ,   cols = 6
      ,   n_slices = rows*cols
      ,   o_slice_w = Math.floor(iw/cols)
      ,   o_slice_h = Math.round(ih/rows)
      ,   max_lines = Math.round(this.$el.height()/o_slice_h)
      ,   d_slice_w = Math.round(container_w/cols)
      ,   d_slice_h = Math.round(container_h/max_lines)
      ,   index = 0
      ,   delta_ox = 0
      ,   delta_oy = 0
      ,   delta_dx = 20
      ,   delta_dy = 20

      // this.$el.append(this.brief_image);
      // return;

      for(var row_index = 0; row_index < rows; row_index++) {

        this.brief_slices[row_index] = new Array();


        for(var col_index = 0; col_index < cols; col_index++) {

          var  random_y = (Math.floor(Math.random() * delta_dy) - delta_dy)
          ,    random_x = (Math.floor(Math.random() * delta_dx) - delta_dx)
          ,    ox = col_index*o_slice_w + random_x
          ,    dx = col_index*d_slice_w + random_x
          ,    oy = row_index*o_slice_h + random_y
          ,    dy = (row_index%max_lines)*d_slice_h + random_y

          // make sure ox is > 0 and ox+slice_w is within bounds so that drawImage works
          if(ox < 0) ox = 0;
          if(ox + o_slice_w > iw) ox = iw - o_slice_w;

          // make sure oy is > 0 and oy+slice_h < ih so that drawImage works
          if(oy < 0) oy = 0;
          if(oy + o_slice_h > ih) oy = ih - o_slice_h;

          this.brief_slices_data[index] = {
            row_index: row_index,
            col_index: col_index,
            o_slice_w: o_slice_w,
            o_slice_h: o_slice_h,
            d_slice_w: d_slice_w,
            d_slice_h: d_slice_h,
            ox: ox,// + (Math.floor(Math.random() * (delta_ox*2)) - delta_ox),
            oy: oy, //row_index*slice_h,// + (Math.floor(Math.random() * (delta_oy*2)) - delta_oy),
            dx: col_index*d_slice_w + (Math.floor(Math.random() * (delta_dx)) - delta_dx) + offset_dx,
            dy: dy
          } 

          index++;

        }

      }

      var start_time = new Date;

      for(var i = 0; i < view.brief_slices_data.length; i++){
        view.drawSlice(i);
        //view.animateSlice(i);
      }

      //return;

      var time = new Date;
      console.log((time.getTime()-start_time.getTime())/1000);

      view.soundtrack.play();
      
      var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
      window.requestAnimationFrame = requestAnimationFrame;

      this.soundtrack.popcorn.on('play', function() {

        var time_intvl;

        function _startAnimation() {

          time_intvl = Math.ceil((view.soundtrack.popcorn.duration() / view.brief_slices_data.length) * 1000);

          _animateSlice(time_intvl);

        }

        if(this.duration()) {
          _startAnimation();
        }
        else {
          this.on('canplay', function() {
            _startAnimation();
          })
        }

        var current_page = 0;

        function _animateSlice() {
          

                 
              setTimeout(function() {

                var index = parseInt(view.brief_slice_current_index) + 1
                ,   slices_on_page = cols*max_lines
                ,   page = Math.ceil(index/slices_on_page)
                ,   index_on_page = index - slices_on_page*(page-1)
                ,   index_to_be_deleted = (slices_on_page*(page-1)) - index_on_page
                ,   to_be_deleted_slice = $(view.brief_slices[index_to_be_deleted])
                ,   index_to_be_faded = view.brief_slice_current_index - slices_on_page
                ,   to_be_faded_slice = $(view.brief_slices[index_to_be_faded])

                if(view.brief_slice_current_index < view.brief_slices_data.length) {
                  
                  //delete old slices
                  if(page > 1) {

                    // console.log("page:" + page);
                    // console.log("showing:" + index);
                    // console.log("deleting: " + index_to_be_deleted);
                    // console.log('----');

                    // to_be_deleted_slice.transition({
                    //   opacity: 0
                    // }, time_intvl, 'in', function() { to_be_deleted_slice.remove() });
                  
                    //to_be_deleted_slice.remove();

                    // to_be_faded_slice.css({ 
                    //   //transformOrigin: to_be_faded_slice.width() + 'px 0px',
                    //   //"z-index": 2000
                    // });

                    // to_be_faded_slice.transition({
                    //   opacity: 0,
                    //   //scale: [0, 1],
                    //   //left: view.$el.width()
                    // }, time_intvl, 'out', function() { to_be_faded_slice.remove() });

                  }


                  // modify previous slices on previous page
                  if(current_page != page) {

                    //console.log(page + " :: " + current_page);

                    current_page = page;

                    if(page > 1) {

                      var i = index - 1
                      ,   slice
                      ,   delay
                      ,   delay_factor
                      ,   delay_base = time_intvl * 0.5
                      ,   bottom_limit = i - slices_on_page

                      while(i > bottom_limit) {

                        slice = $(view.brief_slices[i]);

                        delay_factor = ((slices_on_page*(page-1))-i)
                        delay = delay_base * delay_factor * Math.random();

                        slice.transition({opacity: 0, delay: delay}, time_intvl, function() { slice.remove() });

                        i--;

                      }

                    }

                  }

                  if(view.brief_slice_current_index < view.brief_slices_data.length) {
                    // insert slice
                    view.animateSlice(view.brief_slice_current_index, time_intvl);
                  } 

                  view.brief_slice_current_index++;

                  requestAnimationFrame(_animateSlice);

                }

              }, view.brief_slice_current_index? time_intvl : 0);


        }

        

      });

    },

    drawSlice: function(index) {

      var c, $c, ctx
      ,   row_index = this.brief_slices_data[index].row_index
      ,   col_index = this.brief_slices_data[index].col_index
      ,   o_slice_w = this.brief_slices_data[index].o_slice_w
      ,   o_slice_h = this.brief_slices_data[index].o_slice_h
      ,   d_slice_w = this.brief_slices_data[index].d_slice_w
      ,   d_slice_h = this.brief_slices_data[index].d_slice_h
      ,   ox = this.brief_slices_data[index].ox
      ,   oy = this.brief_slices_data[index].oy
      ,   dx = this.brief_slices_data[index].dx
      ,   dy = this.brief_slices_data[index].dy

      $c = $('<canvas id="brief-slice-'+row_index+'-'+col_index+'" width="'+o_slice_w+'" height="'+o_slice_h+'"></canvas>')
      c = $c.get(0);
      ctx = c.getContext('2d');

      ctx.webkitImageSmoothingEnabled = false;

      var $container = $('<div class="c" id="slice-container-'+ index +'"></div>');

       $container.append(c);
       this.$el.append($container);

      $c.css({
        //x: -d_slice_w,
        //scale: [0, 1],
        width: d_slice_w,
        height: d_slice_h

      })

       $container.css({
        top: dy,// - (Math.floor(Math.random() * (40)) - 20),
        left: dx,// - 1000,// - (Math.floor(Math.random() * (100)) - 200),
        "z-index": index,
        opacity: 0,
        width: d_slice_w,
        height: d_slice_h,
        //scale: [0,1],
        //transformOrigin: '0px 0px'
        "-webkit-box-shadow": "5px 5px 5px rgba(0, 0, 0, 0.4)",
        //"-webkit-transform": "rotateX(180deg)"
        //"-webkit-transform": "scale(0.95, 0.95)"
        //"-webkit-transform": "rotate("+(Math.floor(Math.random() * (6)) - 3) + "deg)"
      })

      this.brief_slices[index] = $container;

      ctx.fillStyle = 'rgb(' + Math.floor(255-42.5*Math.random()*10) + ',' +
                       Math.floor(255-42.5*Math.random()*10) + ',0)';

      var di = ctx.drawImage(this.brief_image, ox, oy, o_slice_w, o_slice_h, 0, 0, o_slice_w, o_slice_h);
      //ctx.fillRect(0, 0, o_slice_w, o_slice_h);
      

    },

    animateSlice: function(index, time_intvl) {

      var $container = this.brief_slices[index]
      //,   $c = $container.children('canvas')
      ,   row_index = this.brief_slices_data[index].row_index
      ,   col_index = this.brief_slices_data[index].col_index
      ,   o_slice_w = this.brief_slices_data[index].o_slice_w
      ,   o_slice_h = this.brief_slices_data[index].o_slice_h
      ,   d_slice_w = this.brief_slices_data[index].d_slice_w
      ,   d_slice_h = this.brief_slices_data[index].d_slice_h
      ,   ox = this.brief_slices_data[index].ox
      ,   oy = this.brief_slices_data[index].oy
      ,   dx = this.brief_slices_data[index].dx
      ,   dy = this.brief_slices_data[index].delta_dy

      $container.transition({
        opacity: 1,
        //top: dy,
        //left: dx,
        //width: d_slice_w,
        //scale: [1, 1],
        //rotateX: '0deg',
        //"-webkit-transform":" translateZ(0)"
        //scale: 0.9
        //rotate: (Math.floor(Math.random() * (6)) - 3) + 'deg'
      }, time_intvl, 'linear');

      // $c.transition({
      //   //x: 0,
      //   //scale: [1, 1]
      // }, time_intvl, 'linear');

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
