/**
 * External libraries
 */
const _ = require('underscore');
const d3 = require('d3');

/**
 * Project requirements
 */
const localize = require('../parameters/localization/localize');

/**
 * A BarChart
 */
 class BarChart {
   // --- Vars and accessors
   // BarChart style
   _margin; // Object<{top: integer, right: integer, bottom: integer, left: integer }> | Margins beetween viewBox and barChart
   _width; // integer | Width of the viewBox
   _height; // integer | Height of the viewBox
   _innerClassPadding; // Number | Padding beetween bars
   _outerClassPadding; // Number | Padding before first bar and after last bar

   // BarChart datas
   _sortFunction; // SortFunction | The sort function from which datas came from
   _svg; // d3.select | The <svg> whre the barChart is drawn
   _datas; // Array<Object<{commentScore: integer, commentId: string, classIndex: integer}>> | The ordered datas of the barChart
   _colors; // Array<Hexa> | Classes and there colors
   _classSeparators; // Array<integer> | Indexes of all "fake" datas to split barChart "real" datas into distinct classes
   _xLabel; // string | Absciss Label
   _yLabel; // string | Ordinate Label
   _maxScore; // integer | Maximum datas score (last bar score)
   _xScale; // d3.scaleBand | The linear scale for absciss
   _yScale; // d3.scaleLinear | The linear scale for ordinate
   _minimumFilter; // integer | Each data < to this should be filtered
   _currentMinimumFilter; // integer | current _minimumFilter
   _bottomFilterCursor; // d3.select | Cursor to set _minimumFilter
   _maximumFilter; // integer | Each data >= to this should be filtered
   _currentMaximumFilter; // integer | current _maximumFilter
   _topFilterCursor; // d3.select | Cursor to set _maximumFilter
   _allFilteredComments; // Object<Array<String>> | All the comments filtered, Key : the filtered comment id, Value : the sort functions ids that filter this comment

   // --- Functions
   /**
    * Create the BarChart
    * @class
    * @returns {BarChart} this
    */
   constructor() {
     // Default style values
     this._margin = { top: 10, right: 50, bottom: 40, left: 50 };
     this._width = 1200; //600;
     this._height = 300;
     this._innerClassPadding = 0.2;
     this._outerClassPadding = 0.4;

     // Init barChart datas
     this._datas = [];
     this._colors = [];
     this._classSeparators = [];
     this._xLabel = '';
     this._yLabel = '';
     this._maxScore = 0;
     this._currentMinimumFilter = this._minimumFilter = 0;
     this._currentMaximumFilter = this._maximumFilter = 0;
     this._allFilteredComments = {};

     return this;
   }

   /**
     * Init the BarChart
     * @access public
     * @param {string} containerSelector - The selector for the container of the barChart
     * @returns {BarChart} this
     */
   init(containerSelector) {
     console.log('BarChart init');
     // Adjust barChart width on container resize
     $(window).resize(() => {
       this.adjustToMainContainerWidth();
     });

     // Draw the viewBox
     this._svg = d3.select(containerSelector)
       .append("svg")
       .attr("width", this._width)
       .attr("height", this._height)
       .attr("viewBox", [0, 0, this._width, this._height])

     // Init the scales
     this._xScale = d3.scaleBand()
       .domain(this._datas.map((d, index) => index))
       .range([this._margin.left, this._width - this._margin.right])
       .paddingInner(this._innerClassPadding)
       .paddingOuter(this._outerClassPadding);
     this._yScale = d3.scaleLinear()
       .domain([-0.1, this._maxScore + 0.1])
       .range([this._height - this._margin.bottom, this._margin.top]);

     // Bottom axis
     this._svg.append("g")
       .call(g => g
         .attr("transform", `translate(0, ${this._height - this._margin.bottom})`)
         .attr("class", "axisBottom")
         .call(d3.axisBottom(this._xScale)
           .tickValues(this._classSeparators)
           .tickSize(-(this._height - this._margin.bottom - this._margin.top))
           .tickSizeOuter(10)
           .tickFormat((d, i) => (i + 1))
         )
       );
     // And label
     this._svg.append("text")
       .attr("class", "xLabel")
       .attr("transform", `translate(${this._width / 2}, ${this._height - this._margin.top})`)
       .style("text-anchor", "middle")
       .text(this._xLabel);

     // Left axis
     this._svg.append("g")
       .call(g => g
         .attr("transform", `translate(${this._margin.left}, 0)`)
         .attr("class", "axisLeft")
         .call(d3.axisLeft(this._yScale)
           .tickFormat(d3.format("d"))
           .ticks((this._maxScore > 10) ? 10 : this._maxScore)
           .tickSizeOuter(0)
         )
       );
     // And label
     this._svg.append("text")
       .attr("class", "yLabel")
       .attr("transform", "rotate(-90)")
       .attr("y", 0)
       .attr("x", 0 - ((this._height - this._margin.top) / 2))
       .attr("dy", "1em")
       .style("text-anchor", "middle")
       .text(this._yLabel);

     // Right axis (for filtering)
     this._svg.append("g")
       .call(g => g
         .attr("transform", `translate(${this._width - this._margin.right}, 0)`)
         .attr("class", "axisRight")
         .call(d3.axisRight(this._yScale)
           .tickSizeOuter(0)
           .tickSizeInner(0)
           .tickFormat((d, i) => (i == 0 ? localize("SORT_FUNCTION_BARCHART_FILTER_MIN") : localize("SORT_FUNCTION_BARCHART_FILTER_MAX")))
           .tickValues([-0.1, 0.1])
         )
       );
     // And there cursors
     this._svg.select(".axisRight")
       .selectAll(".tick")
       .append("polygon")
       .attr("y", 0)
       .attr("id", (d, i) => "filterCursor-" + (i == 0 ? "bottom" : "top"))
       .attr("cursor", (d, i) => (i == 0 ? "n-resize" : "s-resize")) //TODO remove
       .attr("class", (d, i) => (i == 0 ? "cursor-n-resize" : "cursor-s-resize"))
       .attr("points", (d, i) => (i == 0 ? "1,0 10,-6 19,0 19,6 1,6" : "1,0 10,6 19,0 19,-6 1,-6"))
       .attr("stroke", "currentColor")
       .attr("fill", "currentColor");

     // Draw the empty barChart
     this._svg.append("g")
       .attr("class", "barChart")
       .selectAll("rect")
       .data(this._datas)
       .join("rect")
 	    .attr("class", "bar")
       .attr("x", (d, index) => this._xScale(index))
       .attr("y", d => this._yScale(d.commentScore))
       .attr("height", d => this._yScale(0) - this._yScale(d.commentScore + 0.1))
       .attr("width", d => (d.classIndex == -1) ? 0 : this._xScale.bandwidth())
       .attr("fill", d => (d.classIndex == -1) ? 'black': d.color);

     // Minimum filter rectangle
     this._svg.append("rect")
       .attr("id", "minimumFilter")
       .attr("x", this._margin.left)
       .attr("width", this._width - this._margin.right - this._margin.left)
       .attr("class", "fill-current text-gray-700 opacity-25");

     // Maximum filter rectangle
     this._svg.append("rect")
       .attr("id", "maximumFilter")
       .attr("x", this._margin.left)
       .attr("y", 0)
       .attr("width", this._width - this._margin.right - this._margin.left)
       .attr("class", "fill-current text-gray-700 opacity-25");

     // Pattern for filtered bars
     const filteredPatternThis = this._svg.append("pattern")
       .attr("id", "filteredPatternThis")
       .attr("width", 4)
       .attr("height", 4)
       .attr("patternTransform", "rotate(45)")
       .attr("patternUnits", "userSpaceOnUse");
     filteredPatternThis.append("rect")
       .attr("width", 4)
       .attr("height", 4)
       .attr("class", "fill-current text-black");
     filteredPatternThis.append("rect")
       .attr("width", 2)
       .attr("height", 4)
       .attr("class", "fill-current text-gray-400");

     const filteredPatternOther = this._svg.append("pattern")
       .attr("id", "filteredPatternOther")
       .attr("width", 4)
       .attr("height", 4)
       .attr("patternTransform", "rotate(45)")
       .attr("patternUnits", "userSpaceOnUse");
     filteredPatternOther.append("rect")
       .attr("width", 4)
       .attr("height", 4)
       .attr("class", "fill-current text-red-600");
     filteredPatternOther.append("rect")
       .attr("width", 2)
       .attr("height", 4)
       .attr("class", "fill-current text-gray-400");

     // Legend
     var legend = this._svg.append("g")
       .attr("class", "legend")
       .attr("transform", "translate(75, 25)");
     legend.selectAll('g')
       .data([1, 2])
       .enter()
       .append('g')
       .each(function(d, i) {
         var g = d3.select(this);
         g.append("rect")
           .attr("x", 0)
           .attr("y", i * 25)
           .attr("width", 20)
           .attr("height", 20)
           .style("fill", (d == 1) ? "url(#filteredPatternThis)" : "url(#filteredPatternOther)");
         g.append("text")
           .attr("x", 25)
           .attr("y", i * 25 + 12)
           .attr("text-anchor", "left")
           .style("alignment-baseline", "middle")
           .text((d == 1) ? localize("SORT_FUNCTION_BARCHART_LEGEND_THIS") : localize("SORT_FUNCTION_BARCHART_LEGEND_OTHER"));
       });

     return this;
   }

   adjustToMainContainerWidth() {
     this._width = $('#sortFunctionDistributionBarChart').width();
     this._svg.attr("width", this._width)
       .attr("viewBox", [0, 0, this._width, this._height]);

     this._xScale = d3.scaleBand()
       .range([this._margin.left, this._width - this._margin.right])
       .paddingInner(this._innerClassPadding)
       .paddingOuter(this._outerClassPadding);

     this._svg.select(".xLabel")
         .attr("transform", `translate(${this._width / 2}, ${this._height - this._margin.top})`);
     this._svg.select(".axisRight")
       .attr("transform", `translate(${this._width - this._margin.right}, 0)`);

     this._svg.select("#minimumFilter")
       .attr("width", this._width - this._margin.right - this._margin.left);
     this._svg.select("#maximumFilter")
       .attr("width", this._width - this._margin.right - this._margin.left);

     this._minimumFilter = this._currentMinimumFilter;
     this._maximumFilter = this._currentMaximumFilter;

     this.render();
   }

   /**
     * Set all filtered comments
     * @access public
     * @param {Object} allFilteredComments - All filtered comments (by all sort functions)
     */
   setAllFilteredComments(allFilteredComments) {
     this._allFilteredComments = allFilteredComments;
   }

   /**
     * Set datas of the BarChart
     * @access public
     * @param {SortFunctionModel} sortFunctionModel - The sortFunctionModel
     */
   setDatas(sortFunctionModel) {
     this._sortFunction = sortFunctionModel;
     this._xLabel = localize("SORT_FUNCTION_BARCHART_X_LABEL");
     this._yLabel = sortFunctionModel.measurementLabel;
     this._colors = _.map(sortFunctionModel.classes, 'color');
     this._datas = _.clone(sortFunctionModel.sortedCommentsScore);
     this._maxScore = this._datas[this._datas.length - 1].commentScore;
     this._currentMinimumFilter = this._minimumFilter = sortFunctionModel.minimumFilter;
     this._currentMaximumFilter = this._maximumFilter = sortFunctionModel.maximumFilter;

     // Calculate each classSeparators indexes, to splice them at right index in this._datas
     this._classSeparators = [-1];
     _.each(sortFunctionModel.classes, (sortClass, index) => {
       this._classSeparators.push(sortClass.comments.length + this._classSeparators[index] + 1);
     });
     // Remove first and last classSeparators
     this._classSeparators = this._classSeparators.slice(1, this._classSeparators.length - 1);
     // Insert "fake" bars into datas, to split them into classes
     _.each(this._classSeparators, (classSeparatorIndex) => {
       this._datas.splice(classSeparatorIndex, 0, {classIndex: -1, commentScore: this._datas[classSeparatorIndex - 1].commentScore});
     });
   }

   /**
     * Draw the chartBar based on its datas
     * @access public
     */
   render() {
     // Update labels
     this._svg.select(".yLabel")
       .text(this._yLabel);
     this._svg.select(".xLabel")
       .text(this._xLabel);

     // Update Absciss Scale
     this._xScale.domain(this._datas.map((d, index) => index));

     // Draw ticks, at each class separation
     this._svg.select(".axisBottom")
       .call(d3.axisBottom(this._xScale)
         .tickValues(this._classSeparators)
         .tickSize(-(this._height - this._margin.bottom - this._margin.top))
         .tickSizeOuter(10)
         .tickFormat((d, i) => (i + 1))
       );

     // Update Ordinate Scale
     this._yScale.domain([-0.1, this._maxScore + 0.1]);

     // Draw ticks
     this._svg.select(".axisLeft")
       .call(d3.axisLeft(this._yScale)
         .tickFormat(d3.format("d"))
         .ticks((this._maxScore > 10) ? 10 : this._maxScore)
         .tickSizeOuter(0)
       );

     // Reset and remove MIN/MAX cursors, to "save them"
     this._bottomFilterCursor = d3.select("#filterCursor-bottom")
       .attr("y", 0)
       .attr("transform", "")
       .remove();
     this._topFilterCursor = d3.select("#filterCursor-top")
       .attr("y", 0)
       .attr("transform", "")
       .remove();
     // Draw filtering ticks
     this._svg.select(".axisRight")
       .call(d3.axisRight(this._yScale)
         .tickSizeOuter(0)
         .tickSizeInner(0)
         .tickFormat((d, i) => (i == 0 ? localize("SORT_FUNCTION_BARCHART_FILTER_MIN") : localize("SORT_FUNCTION_BARCHART_FILTER_MAX")))
         .tickValues([this._minimumFilter, this._maximumFilter])
       );

     // Moove again MIN/MAX cursors into it's .tick
     this._svg.select(".axisRight")
       .selectAll(".tick")
       .append((d, i) => {
         if(i == 0) {
           return this._bottomFilterCursor.node();
         }
         else {
           return this._topFilterCursor.node();
         }
       });
     // Add dragging listener on filtering cursors
     this._bottomFilterCursor.call(this.dragFilterCursor("bottom"));
     this._topFilterCursor.call(this.dragFilterCursor("top"));
     // And labels (MIN / MAX)
     this._svg.select(".axisRight")
       .selectAll("text")
       .attr("class", "select-none")
       .attr("y", 0)
       .attr("x", 22);

     // Update filtering rectangles size and position
     this._svg.select("#minimumFilter")
       .attr("y", this._yScale(this._minimumFilter))
       .attr("height", Math.max(1, this._yScale(-0.1) - this._yScale(this._minimumFilter) + 1));
     this._svg.select("#maximumFilter")
       .attr("y", this._yScale(this._maxScore + 0.1))
       .attr("height", Math.max(1, this._yScale(this._maximumFilter) - this._yScale(this._maxScore + 0.1) + 1))

     // Draw the bar chart, with datas
     this._svg.select(".barChart")
       .selectAll("rect")
       .data(this._datas)
       .join("rect")
       .attr("class", d => {
         if(d.classIndex == -1) {
           return "separator";
         }
         return "bar";
       })
       .attr("x", (d, index) => this._xScale(index))
       .attr("y", d => this._yScale(d.commentScore))
       .attr("height", d => this._yScale(0) - this._yScale(d.commentScore + 0.1))
       .attr("width", d => (d.classIndex == -1) ? 0 : this._xScale.bandwidth())
       .attr("fill", (d, i) => this.fillColor(d, i));
   }


   /**
     * Drag a filtering cursor
     * @access private
     * @param {string} draggedCursor - bottom|top the draggedCursor
     * @returns {function} d3.drag() function
     */
   dragFilterCursor(draggedCursor) {
     return d3.drag()
     .on("start", (d) => {
       if(draggedCursor == "bottom") {
         this._bottomFilterCursor.classed("dragging", true);
       }
       else {
         this._topFilterCursor.classed("dragging", true);
       }
     })
     .on("drag", (d) => {
       var minY, maxY, cursor;
       if(draggedCursor == "bottom") {
         minY = this._yScale(-0.1) - this._yScale(this._minimumFilter);
         maxY = this._yScale(this._maximumFilter) - this._yScale(this._minimumFilter) + parseInt(this._topFilterCursor.attr("y")) + 9;
         cursor = this._bottomFilterCursor;
       }
       else {
         minY = -(this._yScale(this._maximumFilter) - this._yScale(this._minimumFilter) - parseInt(this._bottomFilterCursor.attr("y")) + 8);
         maxY = this._yScale(this._maxScore + 0.1) - this._yScale(this._maximumFilter);
         cursor = this._topFilterCursor;
       }

       const newY = Math.floor(
                     Math.max(maxY,
                       Math.min(minY,
                         d3.event.y)));

       cursor.attr("y", newY)
         .attr("transform", "translate(0," + newY + ")");

       d3.select(cursor.node().parentNode)
         .select("text")
         .attr("y", newY);

       if(draggedCursor == "bottom") {
         d3.select("#minimumFilter")
           .attr("y", this._yScale(this._minimumFilter) + newY)
           .attr("height", this._yScale(-0.1) - this._yScale(this._minimumFilter) - newY + 1);

         this._currentMinimumFilter = this._yScale.invert(this._yScale(this._minimumFilter) + newY);

         $("#sortFunctionDistributionBarChart").trigger({
           type: "minimumFilterChange",
           minimumFilter: this._currentMinimumFilter
         });
       }
       else {
         d3.select("#maximumFilter")
           .attr("height", this._yScale(this._maximumFilter) - this._yScale(this._maxScore + 0.1) + newY + 1);

         this._currentMaximumFilter = this._yScale.invert(this._yScale(this._maximumFilter) + newY);

         $("#sortFunctionDistributionBarChart").trigger({
           type: "maximumFilterChange",
           maximumFilter: this._currentMaximumFilter
         });
       }
     })
     .on("end", (d) => {
       if(draggedCursor == "bottom") {
         this._bottomFilterCursor.classed("dragging", false);
       }
       else {
         this._topFilterCursor.classed("dragging", false);
       }
     });
   }

   fillColor(d, i) {
     if(d.classIndex == -1) {
       // "fake" bars (classSeparators)
       return "";
     }
     if(this._allFilteredComments[d.commentId]) {
       // Filtered comment
       return (this._allFilteredComments[d.commentId][0] == this._sortFunction.id) ?
         "url(#filteredPatternThis)" :
         "url(#filteredPatternOther)";
     }

     return this._colors[d.classIndex];
   }

   updateCommentsColors(newColors) {
     this._colors = _.map(newColors, 'color');

     this._svg.select(".barChart")
       .selectAll("rect")
       .data(this._datas)
       .join("rect")
       .attr("fill", (d, i) => this.fillColor(d, i));
   }


 }

module.exports = {
  BarChart: BarChart
};
