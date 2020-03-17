/**
 * External libraries
 */
const _ = require('underscore');
const d3 = require('d3-shape');
const d3s = require('d3-selection');

/**
 * Project requirements
 */
const {
  GRAPH_DISPLAY_ORIENTATION
} = require('../parameters/parameters');

/**
  * The line, given graph orientation
  * @access private
  */
const linkGen = ((orientation) => {
  switch (orientation) {
    case 'VERTICAL':
      return d3.linkHorizontal();
      break;
    case 'HORIZONTAL':
      return d3.linkVertical();
      break;
    default:
  }
})(GRAPH_DISPLAY_ORIENTATION.currentValue);

/**
 * Class that manage the drawn line between two comments
 */
class RelationView {
  // --- Vars and accessors
  _relationModel; // RelationModel | The model of this view
  get relationModel() {
    return this._relationModel;
  }
  _relationContainer; // d3 | Container of all relations views (<=> GraphView.d3RelactionContainer)
  get relationContainer() {
    return this._relationContainer;
  }
  _d3Path; // d3 | The drawn path
  get d3Path() {
    return this._d3Path;
  }
  _d3Rect; // d3 | The drawn rect in case of perfect vertical/horizontal relation
  get d3Rect() {
    return this._d3Rect;
  }
  _parentView; // $(DOM) | The parent of the relation
  get parentView() {
    return this._parentView;
  }
  _childView; // $(DOM) | The child of the relation
  get childView() {
    return this._childView;
  }
  _selectionDepth; // int | Not null if relation is in selectedPath. Show Depth of relation relative to selectedComment. If < 0 : relation is parent, > 0 : relation is child
  get selectionDepth() {
    return this._selectionDepth;
  }
  _visible; // boolean | True if visible
  get visible() {
    return this._visible;
  }

  // --- Functions
  /**
   * Create a new RelationView
   * @class
   */
  constructor() {
    return this;
  }

  /**
    * Init the RelationView
    * @access public
    * @param {RelationModel} relationModel - The model of this view
    * @param {object} relationContainer - svg container where the relation is drawn
    * @returns {RelationView} this
    */
  init(relationModel, relationContainer) {
    this._relationModel = relationModel;
    this._relationContainer = relationContainer;
    this._parentView = $('#comment-' + this.relationModel.parent.id);
    this._childView = $('#comment-' + this.relationModel.child.id);

    const positions = this.getLinkValues();
    this._d3Path = this.relationContainer.append('path')
      .data([positions])
      .attr('class', 'relation')
      .attr('d', linkGen);
    this._d3Rect = this.relationContainer.append('rect')
      .data([positions])
      .attr('display', 'none');
    this._visible = true;

    return this;
  }

  /**
    * Remove the RelationView from his container
    * @access public
    */
  remove() {
    this._visible = false;
    this.d3Path.attr('display', 'none');
    this.d3Rect.attr('display', 'none');
  }

  /**
    * Add the RelationView to his container
    * @access public
    */
  add() {
    this._visible = true;
    this.d3Path.attr('display', null);
    this.d3Rect.attr('display', null);
  }

  /**
    * Get the link coordinates, based on relation parent/child positions (and Graph orientation)
    * @access private
    * @returns {object} The link coordinates
    * @returns {object.source} Array of source coordinates [left, top]
    * @returns {object.target} Array of target coordinates [left, top]
    */
  getLinkValues() {
    var sourceLeft, sourceTop, targetLeft, targetTop;
    const parentLeft = parseInt(this.parentView.css('left'));
    const parentWidth = this.parentView.width();
    const parentTop = parseInt(this.parentView.css('top'));
    const parentHeight = this.parentView.height();
    const childLeft = parseInt(this.childView.css('left'));
    const childWidth = this.childView.width();
    const childTop = parseInt(this.childView.css('top'));
    const childHeight = this.childView.height();

    switch (GRAPH_DISPLAY_ORIENTATION.currentValue) {
      case 'VERTICAL':
        sourceLeft = Math.round(parentLeft + parentWidth - 2);
        sourceTop = Math.round(parentTop + (parentHeight / 2));
        targetLeft = Math.round(childLeft + 2);
        targetTop = Math.round(childTop + (childHeight / 2));
        break;
      case 'HORIZONTAL':
        sourceLeft = Math.round(parentLeft + (parentWidth / 2));
        sourceTop = Math.round(parentTop + parentHeight - 2);
        targetLeft = Math.round(childLeft + (childWidth / 2));
        targetTop = Math.round(childTop + 2);
        break;
      default:
    }

    return {
      source: [sourceLeft, sourceTop],
      target: [targetLeft, targetTop]
    };
  }

  /**
    * Re-draw the RelationView
    * @access public
    */
  refresh() {
    if(this._visible) {
      // Draw the path
      var positions = this.getLinkValues();
      this.d3Path.data([positions])
        .attr('d', linkGen);

      if(this.selectionDepth != null) {
        if((GRAPH_DISPLAY_ORIENTATION.currentValue == 'HORIZONTAL') && (positions.source[0] == positions.target[0])
          || (GRAPH_DISPLAY_ORIENTATION.currentValue == 'VERTICAL') && (positions.source[1] == positions.target[1])) {
          // Source and Target are perfectly aligned, cannot apply a linearGradient to a path stroke :
          // So hide it
          this.d3Path.attr('display', 'none');
          // Draw a rectangle instead
          this.d3Rect.data([positions])
            .attr('x', (d) => { return d.source[0]; })
            .attr('y', (d) => { return d.source[1]; })
            .attr('display', null);

          const gradientDirection = (this.selectionDepth < 0) ? '-r' : '';
          if(GRAPH_DISPLAY_ORIENTATION.currentValue == 'HORIZONTAL') {
            this.d3Rect.attr('width', 4)
              .attr('height', (d) => { return Math.abs(d.target[1] - d.source[1]); })
              .attr('fill', 'url(#relationGradient-' + Math.abs(this.selectionDepth) + '-v' + gradientDirection + ')');
          }
          else {
            this.d3Rect.attr('height', 4)
              .attr('width', (d) => { return Math.abs(d.target[0] - d.source[0]); })
              .attr('fill', 'url(#relationGradient-' + Math.abs(this.selectionDepth) + '-h' + gradientDirection + ')');
          }
        }
        else {
          // "Normal" behaviour :
          // Hide unneeded rectangle
          this.d3Rect.attr('display', 'none');
          // And apply correct linearGradient
          const gradientDirection = (((positions.source[0] > positions.target[0]) && (this.selectionDepth > 0))
            || ((positions.source[0] < positions.target[0]) && (this.selectionDepth < 0)))
            ? '-r'
            : '';
          this.d3Path.attr('display', null)
            .style('stroke', 'url(#relationGradient-' + Math.abs(this.selectionDepth) + gradientDirection + ')');
        }
      }
      else {
        // Hide unneeded rectangle
        this.d3Rect.attr('display', 'none');
        // Show path
        this.d3Path.attr('display', null)
          .style('stroke', null);
      }
    }
  }

  /**
    * Select the RelationView
    * @access public
    * @param {int} depth - Depth of relation relative to selectedComment. If < 0 : relation is parent, > 0 : relation is child
    */
  select(depth) {
    this._selectionDepth = depth;
    this.refresh();
  }

  /**
    * UnSelect the RelationView
    * @access public
    */
  unselect() {
    this._selectionDepth = null;
    this.refresh();
  }

}

module.exports = {
  RelationView: RelationView
};
