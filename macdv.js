function plotMACDV(klines, dates) {
  const macdVLine = calculateMACDV(klines, 12, 26, 26)
  const signalLine = calculateEMA(macdVLine, 9);
  const macdHistogram = macdVLine.map((macd, i) => macd - signalLine[i]);

  const macdVTrace = {
    x: dates,
    y: macdVLine,
    name: "MACD-V Line",
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
    title: "Volatility Normalised Momentum (MACD-V)",
    xaxis: { title: "Day" },
    yaxis: { title: "MACD Value" },
    legend: { x: 0, y: 1 },
  };

  const data = [macdVTrace, signalTrace, histogramTrace];

  Plotly.newPlot("macdv", data, layout);
}



function calculateMACDV(data, fastEmaPeriod, slowEmaPeriod, atrPeriod) {
  let macdV = Array(data.close.length).fill(0);

  let fastEma = calculateEMA(data.close.map(d => d), fastEmaPeriod);
  let ema26 = calculateEMA(data.close.map(d => d), slowEmaPeriod);
  let atr = calculateATR(data, atrPeriod);

  for (let i = slowEmaPeriod - 1; i < data.close.length; i++) {
    let macd = fastEma[i] - ema26[i];
    let macdVVal = (macd / atr[i]) * 100.0;
    macdV[i] = macdVVal;
  }

  return macdV;
}

function calculateATR(data, period) {
  let atr = Array(data.close.length).fill(0);
  let tr = Array(data.close.length).fill(0);

  for (let i = 1; i < data.high.length; i++) {
    let h2l = Math.abs(data.high[i] - data.low[i]);
    let h2c1 = Math.abs(data.high[i] - data.close[i - 1]);
    let l2c1 = Math.abs(data.low[i] - data.close[i - 1]);

    tr[i] = Math.max(h2l, h2c1, l2c1);
  }

  return calculateSmoothedMovingAverage(tr, period);
}
