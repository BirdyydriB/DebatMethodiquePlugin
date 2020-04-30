/**
 * External libraries
 */
const _ = require('underscore');
const d3 = require('d3');

/**
 * A BarChart
 */
class BarChart {
  // --- Vars and accessors
  // BarChart style
  _margin;
  _width;
  _height;
  _innerClassPadding;
  _outerClassPadding;

  // BarChart datas
  _svg;
  _datas;
  _colors;
  _classSeparators;
  _yLabel;
  _xLabel;
  _maxScore;
  _xScale;
  _yScale;

  // --- Functions
  /**
   * Create the BarChart
   * @class
   * @returns {BarChart} this
   */
  constructor() {
    console.log('new BarChart');
    this._margin = { top: 10, right: 10, bottom: 40, left: 50 };
    this._width = 600;
    this._height = 300;
    this._innerClassPadding = 0.1;
    this._outerClassPadding = 0.3;

    this._datas = [];
    this._colors = [];
    this._classSeparators = [];
    this._xLabel = '';
    this._yLabel = '';
    this._maxCommentScore = 0;
    this._xScale;
    this._yScale;

    return this;
  }

  /**
    * Init the GraphView
    * @access public
    * @param {string} containerSelector - The selector for the container of the barChart
    * @returns {BarChart} this
    */
  init(containerSelector) {
    console.log('BarChart init');
    this._svg = d3.select(containerSelector)
      .append("svg")
      .attr("width", this._width)
      .attr("height", this._height)
      .attr("viewBox", [0, 0, this._width, this._height])
      .attr("style", "border: 2px solid red;");

    this._xScale = d3.scaleBand()
      .domain(this._datas.map((d, index) => index))
      .range([this._margin.left, this._width - this._margin.right])
      .paddingInner(this._innerClassPadding)
      .paddingOuter(this._outerClassPadding);

    this._yScale = d3.scaleLinear()
      .domain([-0.1, this._maxScore])
      .range([this._height - this._margin.bottom, this._margin.top]);

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

    this._svg.append("text")
      .attr("class", "xLabel")
      .attr("transform", `translate(${this._width / 2}, ${this._height - this._margin.top})`)
      .style("text-anchor", "middle")
      .text(this._xLabel);

    this._svg.append("g")
      .call(g => g
        .attr("transform", `translate(${this._margin.left}, 0)`)
        .attr("class", "axisLeft")
        .call(d3.axisLeft(this._yScale)
          .tickFormat(d3.format("d"))
          .ticks((this._maxScore > 10) ? 10 : this._maxScore)
        )
      );

    this._svg.append("text")
      .attr("class", "yLabel")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("x", 0 - ((this._height - this._margin.top) / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(this._yLabel);

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

    return this;
  }

  setDatas(datas, colors, xLabel, yLabel) {
    this._xLabel = xLabel;
    this._yLabel = yLabel;
    this._colors = _.map(colors, 'color');

    this._datas = [];
    _.each(datas, (data, commentId) => {
      data.commentId = commentId;
      this._datas.push(data);
    });
    this._datas = _.sortBy(this._datas, 'commentScore');

    this._maxScore = this._datas[this._datas.length - 1].commentScore;

    this._classSeparators = [-1];
    _.each(colors, (sortClass, index) => {
      this._classSeparators.push(sortClass.comments.length + this._classSeparators[index] + 1);
    });

    this._classSeparators = this._classSeparators.slice(1, this._classSeparators.length - 1);

    _.each(this._classSeparators, (classSeparatorIndex) => {
      this._datas.splice(classSeparatorIndex, 0, {classIndex: -1, commentScore: 0});
    });
  }

  changeSort() {
    this._colors = this._colors.reverse();
    this._svg.select(".barChart")
      .selectAll(".bar")
      .attr("fill", d => this._colors[d.classIndex])
  }

  render() {
    this._svg.select(".yLabel")
      .text(this._yLabel);
    this._svg.select(".xLabel")
      .text(this._xLabel);

    this._xScale.domain(this._datas.map((d, index) => index));

    this._svg.select(".axisBottom")
      .call(d3.axisBottom(this._xScale)
        .tickValues(this._classSeparators)
        .tickSize(-(this._height - this._margin.bottom - this._margin.top))
        .tickSizeOuter(10)
        .tickFormat((d, i) => (i + 1))
      );

    this._yScale.domain([-0.1, this._maxScore]);

    this._svg.select(".axisLeft")
        .call(d3.axisLeft(this._yScale)
          .tickFormat(d3.format("d"))
          .ticks((this._maxScore > 10) ? 10 : this._maxScore)
        );

    this._svg.select(".barChart")
      .selectAll("rect")
      .data(this._datas)
      .join("rect")
      .attr("class", d => ((d.classIndex == -1) ? "separator": "bar"))
      .attr("x", (d, index) => this._xScale(index))
      .attr("y", d => this._yScale(d.commentScore))
      .attr("height", d => this._yScale(0) - this._yScale(d.commentScore + 0.1))
      .attr("width", d => (d.classIndex == -1) ? 0 : this._xScale.bandwidth())
      .attr("fill", d => (d.classIndex == -1) ? "black": this._colors[d.classIndex]);
  }

}

module.exports = {
  BarChart: BarChart
};
