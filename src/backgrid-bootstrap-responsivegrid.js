/*
 * Version 0.1.0
 */
(function (root, factory) {

  if (typeof define === "function" && define.amd) {
    // AMD (+ global for extensions)
    define(["jquery", "underscore", "backbone", "backgrid"], function ($, _, Backbone, Backgrid) {
      return (Backgrid.ResponsiveGrid = factory($, _, Backbone, Backgrid));
    });
  } else if (typeof exports === "object") {
    // CommonJS
    module.exports = factory(require("jquery"), require("underscore"), require("backbone"), require("backgrid"));
  } else {
    // Browser
   root.Backgrid.ResponsiveGrid = factory(root.$, root._, root.Backbone, root.Backgrid);
  }}(this, function ($, _, Backbone, Backgrid) {



  /**
   * ResponsiveCell is an extension of Backgrid.Cell which supports the ResponsiveGrid
   *
   * @class Backgrid.ResponsiveCell
   * @extends Backgrid.Cell
   */
  Backgrid.ResponsiveCell = Backgrid.Cell.extend({

    /** @property {String} default cell class*/
    class: 'responsive-cell',

    /**
     * Render the Cell
     *
     * @function render
     */
    render: function()
    {
        // empty the element
        this.$el.empty();

        // add the hide class defined on the column
        this.$el.addClass(this.column.get('hideClass'));

        // append a label div that has the description that normally displays in the table header cells
        this.$el.append('<label class="responsive-header-label" style="margin-right:0; width:40%; float:left; position:relative; min-height:1px;">' + this.column.get("label") + ': </label>');

        // get the raw data, pass it to the formatter and append the results to the $el
        this.$el.append(this.formatter.fromRaw(this.getRawData()));

        // manually call responsive break handler on initial render
        this.handleResponsiveBreak(this.column.get('initialGridType'));

        // listen for resize events on the grid (event name is available on the column object)
        this.listenTo(Backbone, this.column.get('resizeEventName'), this.handleResponsiveBreak, this);

        // deleget events...
        this.delegateEvents();

        // for call chaining
        return this;
    },

    /**
     * Performs actions necessary for the Cell to respond to Responsive Grid resize events
     *
     * @function handleResponsiveBreak
     * @property {String} responsive mode ('FULL' or 'CONDNSED')
     */
    'handleResponsiveBreak': function(responsiveMode)
    {
      // get the responsive header class from the column to apply or remove as neccessary
      var responsiveHeaderClass = this.column.get("responsiveHeaderClass");

      if(responsiveMode === "FULL"){
        // in FULL-mode hide the responsive heder labels
        this.$el.find(".responsive-header-label").addClass("hidden");

        // in FULL-mode remove the CONDENSED inline styles applied
        this.$el.removeAttr("style");

        if(responsiveHeaderClass){
          // in FULL-mode remove the responsice header class if applicable
          this.$el.removeClass(responsiveHeaderClass);
        }
      } else {
        // in CONDENSED-mode show the responsive header label
        this.$el.find(".responsive-header-label").removeClass("hidden");

        // in CONDENSED-mode apply our condensed styles inline
        this.$el.css({
                        "border": "none",
                        "display": "block",
                        "width": "100%",
                        "text-align": "left",
                        "text-decoration": "none",
                        "max-width": "none",
                        "height": "auto"
                    });

        if (responsiveHeaderClass) {
          // in CONDENSED-mode add the responsice header class if applicable
          this.$el.addClass(responsiveHeaderClass);

          // in CONDENSED-mode add some padding to the responsice header label if applicable
          this.$el.css("padding-top","8px");
        }
      }
    },

    /**
     * Basic function to return the data we will pass to the formatter, this can
     * also be used in a sense to avoid having to create any custom formatters. Override
     * this function as necessary otherwise it will just return the model attribute for the
     * column's name attribute
     *
     * @function getRawData
     */
    'getRawData': function()
    {
      // get model attribute based on the columns name attribute
      return this.model.get(this.column.get("name"));
    }
  });



  /**
   * ResponsiveHeaderCell is an extension of Backgrid.HeaderCell which supports the ResponsiveGrid
   *
   * @class Backgrid.ResponsiveHeaderCell
   * @extends Backgrid.HeaderCell
   */
  Backgrid.ResponsiveHeaderCell = Backgrid.HeaderCell.extend({

    /**
     * Render the Cell
     *
     * @function render
     */
    render: function()
    {
      // Call render on Backgrid.HeaderCell so we don't have to duplicate code that is already there
      Backgrid.HeaderCell.prototype.render.call(this);

      // Add the hide class defined on the column
      this.$el.addClass(this.column.get('hideClass'));

      // For call chaining
      return this;
    }
  });



  /**
   * ResponsiveGrid is an extension of Backgrid.Grid which takes out all the boilerplate needed to create a responsive grid,
   * while providing consistency in the look/feel of your application grids.
   *
   * @class Backgrid.ResponsiveGrid
   * @extends Backgrid.Grid
   */
  var ResponsiveGrid = Backgrid.Grid.extend({

    /** @property {Object} pixel breakpoints for each of the standard bootstrap sizes */
    breakpoints: {
      "none" : undefined,
      "xs" : 768,
      "sm" : 991,
      "md" : 991,
      "lg" : 991
    },

    /** @property {String} point at which we will break between mobile and non-mobile widths */
    responsiveBreakSize: "xs",

    /**
     * @property {boolean} to switch back to the backgrid behavior of defaulting cells
     *                      to be editable, set this to true
    */
    defaultColumnsToBeEditable: false,

    /**
     * Initialize the Grid object
     *
     * @function initialize
     * @param  {Object} options
     */
    initialize: function( options )
    {
      // for accessing 'this' inside inner functions
      var that = this;

      // prevent an error when no options are passed in
      options = options || {};

      // set the breakpoints for all screen widths from options or default
      this.breakpoints.xs = options.xsBreakpoint || this.breakpoints.xs;
      this.breakpoints.sm = options.smBreakpoint || this.breakpoints.sm;
      this.breakpoints.md = options.mdBreakpoint || this.breakpoints.md;
      this.breakpoints.lg = options.lgBreakpoint || this.breakpoints.lg;

      // set whether columns should be editable by default (ability to override backgrids default of true)
      this.defaultColumnsToBeEditable = options.defaultColumnsToBeEditable || this.defaultColumnsToBeEditable;

      // set the responsive break size from options or default and use that to determine the mobile breakpoint
      this.responsiveBreakSize = options.responsiveBreakSize || this.responsiveBreakSize;
      this.breakpoint = this.breakpoints[this.responsiveBreakSize];

      // set the resize event name which will be specific to the grid instance
      this.resizeEventName = "ResponsiveGrid-" + this.cid + ":responsiveBreak";

      // get the grid type so we can set the initial type on all the columns
      var gridType = this.getGridType();

      // iterate over all the columns passed in
      _.each(options.columns, function(column){

        // set the initial grid type so we can update the cells as they are rendered
        column.initialGridType = gridType;

        // set each column without a header cell defined to use Backgrid.ResponsiveHeaderCell
        column.headerCell = column.headerCell || Backgrid.ResponsiveHeaderCell;

        // set each column without a cell defined to use Backgrid.ResponsiveCell
        column.cell = column.cell || Backgrid.ResponsiveCell;

        // set the default editable state of a column
        column.editable = column.editable || that.defaultColumnsToBeEditable;

        // set the resize event name that the cells should be listening to
        column.resizeEventName = that.resizeEventName;

      });

      // call Backgrid.Grid's initialize function
      Backgrid.Grid.prototype.initialize.call(this, options);

      // do not add event handlers if we have no breakpoint
      if(this.breakpoint) {

        // add window resize event handling
        $( window ).resize(function() {
          that.handleWindowResizeEvent();
        });

        // listen to other backgrid events that would require us to manually trigger a resize event
        this.listenTo(this.body.collection, 'backgrid:refresh', this.handleWindowResizeEvent, this);
        this.listenTo(this.header.collection, 'backgrid:sort', this.handleWindowResizeEvent, this);
      }
    },

    /**
     * Determine the grid type ('FULL' or 'CONDENSED')
     *
     * @function getGridType
     */
    getGridType: function()
    {
      // default grid type to 'FULL'
      var gridType = "FULL",
          windowSize = $( window ).width()

      // if window size is less than our mobile breakpoint, set grid type to 'CONDENSED'
      if (windowSize < this.breakpoint) {
        gridType = "CONDENSED";
      }

      return gridType;
    },

    /**
     * Performs actions necessary for the table to respond to window dimension changes
     *
     * @function handleWindowResizeEvent
     */
    handleWindowResizeEvent: function()
    {
      // get the previous grid type and new grid type
      var previousGridType = this.gridType;
      this.gridType = this.getGridType();

      // show the table header if the new grid type is 'FULL' else hide it
      if (this.gridType === "FULL" ) {
        this.$el.find("thead").first().show();
      } else {
        this.$el.find("thead").first().hide();
      }

      // only trigger the break event when the grid type has changed from the last event
      if(this.gridType !== previousGridType){
        Backbone.trigger(this.resizeEventName, this.gridType);
      }
    },

    /**
     * Render the Grid
     *
     * @function render
     */
    render: function()
    {
      // Call render on Backgrid.Grid so we don't have to duplicate code that is already there
      Backgrid.Grid.prototype.render.call(this);

      // check to see if there is an actual breakpoint set before we do our initial manual resize event
      if(this.breakpoint) {
        this.handleWindowResizeEvent();
      }

      // for call chaining
      return this;
    }

  });
  return ResponsiveGrid;
}));
