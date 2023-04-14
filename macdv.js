function calculateMACDATR(data, period) {
  let macdatr = [];

  let ema12 = calculateEMA(data.map(d => d.close), 12);
  let ema26 = calculateEMA(data.map(d => d.close), 26);
  let atr = calculateATR(data, period);

  for (let i = period - 1; i < data.length; i++) {
    let macd = ema12[i] - ema26[i];
    let macdatrVal = (macd / atr[i]) * 100.0;
    macdatr.push(macdatrVal);
  }

  return macdatr;
}

function calculateEMA(data, period) {
  let ema = [];

  let sma = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  ema.push(sma);

  for (let i = period; i < data.length; i++) {
    let emaVal = (data[i] * (2 / (period + 1))) + (ema[i - period] * (1 - (2 / (period + 1))));
    ema.push(emaVal);
  }

  return ema;
}

function calculateATR(data, period) {
  let atr = [];
  let tr = [];

  for (let i = 1; i < data.length; i++) {
    let h2l = Math.abs(data[i].high - data[i].low);
    let h2c1 = Math.abs(data[i].high - data[i - 1].close);
    let l2c1 = Math.abs(data[i].low - data[i - 1].close);

    tr.push(Math.max(h2l, h2c1, l2c1));
  }

  let sma = calculateSMA(tr, period);

  for (let i = period - 1; i < data.length; i++) {
    atr.push(sma[i] * period);
  }

  return atr;
}

function calculateSMA(data, period) {
  let sma = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = data.slice(i - period + 1, i + 1).reduce((sum, val) => sum + val, 0);
    sma.push(sum / period);
  }

  return sma;
}

function plotMACDATR(data, period) {
  let macdatr = calculateMACDATR(data, period);

  let trace = {
    x: data.slice(period - 1).map(d => d.date),
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
