function calculateRSI(closePrices, period) {
  const changes = closePrices.map((price, i) => {
    if (i === 0) {
      return 0;
    } else {
      return price - closePrices[i - 1];
    }
  });

  const upChanges = changes.map((change) => Math.max(change, 0));
  const downChanges = changes.map((change) => Math.abs(Math.min(change, 0)));

  const avgUp = calculateEMA(upChanges, period);
  const avgDown = calculateEMA(downChanges, period);

  const rs = avgUp.map((avg, i) => avg / avgDown[i]);
  const rsi = rs.map((r) => 100 - 100 / (1 + r));

  return rsi;
}

function calculateRSIS(closePrices, rsiPeriod, stochasticPeriod) {
  const rsiSlice = closePrices.slice(rsiPeriod - 1);
  const rsiValues = calculateRSI(rsiSlice, rsiPeriod);

  const maxRSI = Math.max(...rsiValues.slice(0, stochasticPeriod));
  const minRSI = Math.min(...rsiValues.slice(0, stochasticPeriod));

  const rsis = rsiValues.map((rsi, i) => {
    if (i < stochasticPeriod - 1) {
      return null;
    } else {
      const slice = rsiValues.slice(i - stochasticPeriod + 1, i + 1);
      const max = Math.max(...slice);
      const min = Math.min(...slice);
      return (rsi - min) / (max - min);
    }
  });

  return rsis;
}

function calculateStochastic(rsis, stochasticPeriod, kPeriod) {
  const kValues = rsis.map((rsi, i) => {
    if (i < stochasticPeriod + kPeriod - 2) {
      return null;
    } else {
      const slice = rsis.slice(i - kPeriod + 1, i + 1);
      const sum = slice.reduce((acc, val) => acc + val, 0);
      return sum / kPeriod;
    }
  });

  return kValues;
}

function plotStochasticRSI(closePrices, rsiPeriod, stochasticPeriod, kPeriod) {
  const rsis = calculateRSIS(closePrices, rsiPeriod, stochasticPeriod);
  const kValues = calculateStochastic(rsis, stochasticPeriod, kPeriod);
  const dValues = calculateEMA(kValues, 3);

  const traceK = {
    x: [...Array(closePrices.length - rsiPeriod - stochasticPeriod - kPeriod + 3).keys()].map(i => i + rsiPeriod + stochasticPeriod + kPeriod - 3),
    y: kValues.slice(stochasticPeriod + kPeriod - 3),
    type: 'scatter',
    mode: 'lines',
    name: 'Stochastic K',
    line: {
      color: 'blue'
    }
  };

  const traceD = {
    x: [...Array(closePrices.length - rsiPeriod - stochasticPeriod - kPeriod + 3).keys()].map(i => i + rsiPeriod + stochasticPeriod + kPeriod - 3),
    y: dValues.slice(stochasticPeriod + kPeriod - 3),
    type: 'scatter',
    mode: 'lines',
    name: 'Stochastic D',
    line: {
      color: 'red'
    }
  };

  const layout = {
    title: 'Stochastic RSI',
    xaxis: {
      title: 'Date'
    },
    yaxis: {
      title: 'Value'
    }
  };

  const data = [traceK, traceD];

  Plotly.newPlot('stochastic-rsi', data, layout);
}
