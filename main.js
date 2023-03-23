async function getKlines(symbol, interval) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=50`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}
function calculateBollingerBands(closePrices, period = 20, deviation = 2) {
    const movingAverages = [];
    const upperBands = [];
    const lowerBands = [];

    for (let i = 0; i < closePrices.length; i++) {
        if (i < period - 1) {
            movingAverages.push(null);
            upperBands.push(null);
            lowerBands.push(null);
            continue;
        }

        const slice = closePrices.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, val) => acc + val, 0);
        const movingAverage = sum / period;
        const standardDeviation =
            Math.sqrt(
                slice.reduce((acc, val) => acc + (val - movingAverage) ** 2, 0) /
                period
            ) || 0;

        movingAverages.push(movingAverage);
        upperBands.push(movingAverage + deviation * standardDeviation);
        lowerBands.push(movingAverage - deviation * standardDeviation);
    }

    return { movingAverages, upperBands, lowerBands };
}

async function doCalculate() {
    const symbol = document.getElementById("symbol").value;
    let klines = await getKlines(symbol, "5m");
    klines = transformKlinesResponse(klines);
    const { movingAverages, upperBands, lowerBands } = calculateBollingerBands(klines.close);

    klines.upper = upperBands;
    klines.lower = lowerBands;
    klines.movingAverages = movingAverages;
    plotBBands(klines);
    plotCandles(klines);
    plotRSI(klines);
}

function plotBBands(klines) {
    const labels = klines.date;
    const closePrices = klines.close;

    const data = {
        labels: labels,
        datasets: [
            {
                label: "Close Price",
                data: closePrices,
                borderColor: "rgb(54, 162, 235)",
                tension: 0.1,
            },
            {
                label: "Moving Average",
                data: klines.movingAverages,
                borderColor: "rgb(255, 99, 132)",
                fill: false,
                tension: 0.1,
            },
            {
                label: "Upper Band",
                data: klines.upper,
                borderColor: "rgb(75, 192, 192)",
                fill: false,
                tension: 0.1,
            },
            {
                label: "Lower Band",
                data: klines.lower,
                borderColor: "rgb(153, 102, 255)",
                fill: false,
                tension: 0.1,
            },
        ],
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            scales: {
                x: {
                    type: 'time',
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 5
                    },
                    time: {
                        // Luxon format string
                        tooltipFormat: 'HH mm'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
        },
    };

    const chartElement = document.getElementById("chart");
    if (window.myChart) {
        window.myChart.destroy();
    }
    window.myChart = new Chart(chartElement, config);
}

function transformKlinesResponse(response) {
    const openPrices = [];
    const closePrices = [];
    const highPrices = [];
    const lowPrices = [];
    const dates = [];

    for (let i = 0; i < response.length; i++) {
        const kline = response[i];
        openPrices.push(parseFloat(kline[1]));
        highPrices.push(parseFloat(kline[2]));
        lowPrices.push(parseFloat(kline[3]));
        closePrices.push(parseFloat(kline[4]));
        dates.push(new Date(kline[0]));
    }

    return {
        open: openPrices,
        close: closePrices,
        high: highPrices,
        low: lowPrices,
        date: dates,
    };
}

function plotCandles(klines) {
    // Define the data for the candlestick chart
    var prices = {
        type: 'candlestick',
        x: klines.date,
        open: klines.open,
        high: klines.high,
        low: klines.low,
        close: klines.close,
        increasing: { line: { color: '#00CC94' } },
        decreasing: { line: { color: '#F50000' } }
    };

    // Define the data for the upper Bollinger Band
    var upper = {
        type: 'scatter',
        x: klines.date,
        y: klines.upper,
        mode: 'lines',
        line: { color: '#FFA07A' }
    };

    // Define the data for the lower Bollinger Band
    var lower = {
        type: 'scatter',
        x: klines.date,
        y: klines.lower,
        mode: 'lines',
        line: { color: '#FFA07A' }
    };

    // Combine the data for the candlestick chart and Bollinger Bands
    var data = [prices, upper, lower];

    // Define the layout for the chart
    var layout = {
        title: 'Candlestick with Bollinger Bands',
        showlegend: false,
        xaxis: {
            rangeslider: {
                visible: false
            }
        },
        yaxis: {
            title: 'Price'
        }
    };

    // Plot the chart
    Plotly.newPlot('chart_div', data, layout);
}

function calculateRSI(values, period = 14) {
  const rsiArray = [];
  const deltas = [];
  
  for (let i = 1; i < values.length; i++) {
    deltas.push(values[i] - values[i - 1]);
  }
  for (let i = 0; i <period; i++) {
    rsiArray.push(null);
  }
  for (let i = period; i <= values.length; i++) {
    const gains = deltas.slice(i - period, i).filter((delta) => delta > 0);
    const losses = deltas.slice(i - period, i).filter((delta) => delta < 0);

    const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = Math.abs(losses.reduce((sum, loss) => sum + loss, 0) / period);

    const RS = avgGain / avgLoss;
    const RSI = 100 - (100 / (1 + RS));

    rsiArray.push(RSI);
  }

  return rsiArray;
}


function sum(values) {
    return values.reduce((total, value) => total + value, 0);
}

function plotRSI(klines) {

    // Define the data for the lower Bollinger Band
    var rsi = {
        type: 'scatter',
        x: klines.date,
        y: calculateRSI(klines.close),
        mode: 'lines',
        line: { color: '#FFA07A' }
    };

    // Define the layout for the chart
    var layout = {
        title: 'RSI',
        xaxis: {
            rangeslider: {
                visible: false
            }
        },
        yaxis: {
            title: 'RSI',
            range: [0, 100],
        }
    };

    // Plot the chart
    Plotly.newPlot('rsi', [rsi], layout);
}
