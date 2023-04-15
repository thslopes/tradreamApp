function calculateMACDATR(data, period) {
  let macdatr = Array(period).fill(0);

  let ema12 = calculateEMA(data.close.map(d => d), 12);
  let ema26 = calculateEMA(data.close.map(d => d), 26);
  let atr = calculateATR(data, period);

  for (let i = period - 1; i < data.close.length; i++) {
    let macd = ema12[i] - ema26[i];
    let macdatrVal = (macd / atr[i]) * 100.0;
    macdatr.push(macdatrVal);
  }

  return macdatr;
}

function calculateATR(data, period) {
  let atr = Array(period).fill(0);
  let tr = [];

  for (let i = 1; i < data.high.length; i++) {
    let h2l = Math.abs(data.high[i] - data.low[i]);
    let h2c1 = Math.abs(data.high[i] - data.close[i - 1]);
    let l2c1 = Math.abs(data.low[i] - data.close[i - 1]);

    tr.push(Math.max(h2l, h2c1, l2c1));
  }

  let sma = calculateSMA(tr, period);

  for (let i = period - 1; i < data.low.length; i++) {
    atr.push(sma[i] * period);
  }

  return atr;
}

function calculateSMA(data, period) {
  let sma = Array(period).fill(0);

  for (let i = period - 1; i < data.length; i++) {
    let sum = data.slice(i - period + 1, i + 1).reduce((sum, val) => sum + val, 0);
    sma.push(sum / period);
  }

  return sma;
}

function plotMACDATR(data, period) {
  let macdatr = calculateMACDATR(data, period);

  let trace = {
    x: data.date.slice(period - 1).map(d => d),
    y: macdatr,
    type: 'scatter',
    mode: 'lines',
    line: {
      color: 'blue'
    },
    name: 'MACD/ATR'
  };

  let layout = {
    title: 'MACD/ATR',
    xaxis: {
      title: 'Date'
    },
    yaxis: {
      title: 'MACD/ATR'
    }
  };

  Plotly.newPlot('macdv', [trace], layout);
}
