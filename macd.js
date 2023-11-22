function calculateAndPlotMACD(closePrices, dates) {
  const ema12 = calculateEMA(closePrices, 12);
  const ema26 = calculateEMA(closePrices, 26);
  const macdLine = ema12.map((ema, i) => ema - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  const macdHistogram = macdLine.map((macd, i) => macd - signalLine[i]);

  const macdTrace = {
    x: dates,
    y: macdLine,
    name: "MACD Line",
    type: "scatter",
    mode: "lines",
    line: { color: "blue" },
  };

  const signalTrace = {
    x: dates,
    y: signalLine,
    name: "Signal Line",
    type: "scatter",
    mode: "lines",
    line: { color: "red" },
  };

  const histogramTrace = {
    x: dates,
    y: macdHistogram,
    name: "MACD Histogram",
    type: "bar",
    marker: { color: "green" },
  };

  const layout = {
    title: "Moving Average Convergence Divergence (MACD)",
    xaxis: { title: "Day" },
    yaxis: { title: "MACD Value" },
    legend: { x: 0, y: 1 },
  };

  const data = [macdTrace, signalTrace, histogramTrace];

  Plotly.newPlot("macdChart", data, layout);
}

