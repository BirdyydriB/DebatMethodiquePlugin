/**
 * External libraries
 */
const _ = require('underscore');

/**
 * A 2D array
 */
class Array2D {
  // --- Vars and accessors
  _width;
  get width() {
    return this._width;
  }
  _height;
  get height() {
    return this._height;
  }
  _grid;
  _reversedGrid;
  _coordinates;

  // --- Functions
  /**
   * Create a Array2D
   * @class
   * @returns {Array2D} this
   */
  constructor() {
    this._width = this._height = 0;
    this._grid = [[]];
    this._reversedGrid = [[]];
    this._coordinates = {};
    return this;
  }
  /**
    * Get column from grid
    * @access public
    * @param {int} c - Column index
    */
  column(c) {
    return _.isArray(this._reversedGrid[c]) ?
      this._reversedGrid[c] :
      [];
  }
  /**
    * Get row from grid
    * @access public
    * @param {int} r - Row index
    */
  row(r) {
    return _.isArray(this._grid[r]) ?
      this._grid[r] :
      [];
  }
  /**
    * Get element from coordinates
    * @access public
    * @param {int} r - Row index
    * @param {int} c - Column index
    * @returns {Object} Grid element
    */
  get(r, c) {
    if (!_.isArray(this._grid[r])) {
      return undefined;
    }

    return this._grid[r][c];
  }
  /**
    * Set element in grid, at given coordinates
    * @access public
    * @param {int} r - Row index
    * @param {int} c - Column index
    * @param {Object} value - Element to set
    */
  set(r, c, value) {
    if(!_.isArray(this._grid[r])) {
      this._grid[r] = [];
    }
    if(!_.isArray(this._reversedGrid[c])) {
      this._reversedGrid[c] = [];
    }

    this._grid[r][c] = value;
    this._reversedGrid[c][r] = value;
    this._coordinates[value] = {
      rowIndex: r,
      columnIndex: c
    };

    this._width = Math.max(this._width, this._grid[r].length);
    this._height = Math.max(this._height, this._reversedGrid[c].length);
  }

  getCoordinates(value) {
    return this._coordinates[value];
  }

  /**
    * Unshift element in grid, at given row
    * @access public
    * @param {int} r - Row index
    * @param {Object} value - Element to unshift
    */
  unshift(r, value) {
    // console.log('unshift', r, value);
    this._grid[r].unshift(value);
    this._width = Math.max(this._width, this._grid[r].length);

    if (this._grid[r].length > this._reversedGrid.length) {
      this._reversedGrid.push([]);
    }
    for (var i = this._grid[r].length - 1 ; i > 0 ; i--) {
      this._reversedGrid[i][r] = this._reversedGrid[i - 1][r];
      // Update index
      // console.log('Update index', r, i, this._grid[r][i], this._coordinates[this._grid[r][i]].columnIndex);
      this._coordinates[this._grid[r][i]].columnIndex++;
    }
    this._reversedGrid[0][r] = value;
    this._coordinates[value] = {
      rowIndex: r,
      columnIndex: 0
    };
  }

  /**
    * Find an element in grid
    * @access public
    * @param {function} finder - (Object) => boolean. Returns true if element finded.
    * @returns {Array} If founded : [row, column] of element. If not, empty Array.
    */
  find(finder) {
    for (var row in this._grid) {
      for (var col in this._grid[row]) {
        if (finder(this._grid[row][col])) {
          return [parseInt(row), parseInt(col)];
        }
      }
    }
    return [];
  }
  /**
    * Reverse the grid (switch rows with columns)
    * @access public
    */
  reverse() {
    const pivot = this._grid;
    this._grid = this._reversedGrid;
    this._reversedGrid = pivot;

    const dimPivot = this._width;
    this._width = this._height;
    this._height = dimPivot;

    _.each(this._coordinates, (coords, index, list) => {
      const indexPivot = coords.rowIndex;
      coords.rowIndex = coords.columnIndex;
      coords.columnIndex = indexPivot;
    });
  }

  /**
    * Apply a function on each grid element in the given area
    * @access public
    * @param {int} r - Starting row index
    * @param {int} c - Starting column index
    * @param {int} w - Area width
    * @param {int} h - Area height
    * @param {function} iterator - The function to apply
    */
  forArea(r, c, w, h, iterator) {
    const maxW = Math.min((r + h), this._height);
    for (var i = r ; i < maxW ; i++) {
      const row = this._grid[i];
      const maxH = Math.min((c + w), row.length);

      for (var j = c ; j < maxH ; j++) {
        iterator(row[j], i, j, this._grid);
      }
    }
  }
  /**
    * Apply a function on each grid element
    * @access public
    * @param {function} iterator - The function to apply on a cell
    */
  eachCell(iterator) {
    this.forArea(0, 0, this._width, this._height, iterator);
  }
  /**
    * Apply a function on each grid row
    * @access public
    * @param {function} iterator - The function to apply on a row
    */
  eachRow(iterator) {
    for (var i = 0 ; i < this._height; i++) {
      var row = this._grid[i];
      iterator(row, i, this._grid);
    }
  }

  deleteColumns(c, w) {
    this._width = 0;
    for (var i = this._height - 1 ; i >= 0 ; i--) {
      for (var j = c ; j < c + w ; j++) {
        const element = this._grid[i][j];
        if (element != undefined) {
          delete this._coordinates[element];
        }
      }

      this._grid[i].splice(c, w);
      this._width = Math.max(this._width, this._grid[i].length);

      const isEmpty = _.every(this._grid[i], (cell) => (cell === undefined));
      if (isEmpty) {
        // Remove empty row
        this._grid.splice(i, 1);
        this._height--;
      }
    }

    this._reversedGrid.splice(c, w);

    // Update indexes
    this.forArea(0, c, this._width, this._height, (element, row, col, grid) => {
      if (element != undefined) {
        this._coordinates[element].columnIndex -= w;
      }
    });
  }

  // Insert columns-array at the given column-coordinate (index), pushing the other columns ahead.
  spliceColumns(c, ...newColumns) {
    // Update indexes
    this.forArea(0, c, this._width, this._height, (element, row, col, grid) => {
      if (element != undefined) {
        this._coordinates[element].columnIndex += newColumns.length;
      }
    });

    for(var j = 0 ; j < newColumns.length ; j++) {
      this._height = Math.max(this._height, newColumns[j].length);

      for(var i = 0 ; i < this._height ; i++) {
        if(!_.isArray(this._grid[i])) {
          this._grid[i] = Array(this._width).fill(undefined);
          this._grid[i][c] = newColumns[j][i];
        }
        else {
          this._grid[i].splice(c + j, 0, newColumns[j][i]);
        }

        if(newColumns[j][i] != undefined) {
          this._coordinates[newColumns[j][i]] = {
            rowIndex: i,
            columnIndex: c + j
          }
        }
      }
    }
    this._width += newColumns.length;
    this._reversedGrid.splice(c, 0, ...newColumns);
  }

}

module.exports = {
  Array2D: Array2D
};
