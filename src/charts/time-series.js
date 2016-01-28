const createClickForTooltip = require("./c3-click-for-tooltip");

plotTimeSeries.isTimeSeries = isTimeSeries;

module.exports = plotTimeSeries;

function plotTimeSeries(selector, data, { maxWidth }) {
  let { columns } = data;

  let xName = columns[0][0];
  let yName = columns[1][0];

  let chart = c3.generate({
      size: {
        width: maxWidth,
        height: maxWidth / 1.7,
      },
      bindto: selector,
      data: {
        x: xName,
        columns: columns,
        onclick: createClickForTooltip(),
      },
      axis: {
        x: {
          type: "timeseries",
          tick: {
              format: '%Y'
          }
        }
      },
      tooltip: {
        show: false,
      },
  });
}

// Fixme
function isTimeSeries(data) {
  let columns = data.columns;
  let yearMonthDateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/; // matches YYYY-MM-DD, where MM and DD do not need leading zeroes

  return columns.some(function(column) {
    return column.some(function(datum) {
      return yearMonthDateRegex.test(datum);
    })
  });
}