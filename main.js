async function getKlines(symbol, interval) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

function sortKlines(klines) {
    const sorted = {
        open: [],
        close: [],
        high: [],
        low: [],
        date: [],
    };

    for (let i = klines.open.length - 1; i >= 0; i--) {
        sorted.open.push(klines.open[i]);
        sorted.close.push(klines.close[i]);
        sorted.high.push(klines.high[i]);
        sorted.low.push(klines.low[i]);
        sorted.date.push(klines.date[i]);
    }

    return sorted;
}

async function doCalculate() {
    const symbol = document.getElementById("symbol").value;
    let klines = await getKlines(symbol, "1h");
    klines = transformKlinesResponse(klines);
    calculateAndPlotAll(klines);
}

function calculateAndPlotAll(klines) {
    const { movingAverages, upperBands, lowerBands } = calculateBollingerBands(klines.close);

    klines.upper = upperBands;
    klines.lower = lowerBands;
    klines.movingAverages = movingAverages;
    plotBBands(klines);
    plotCandles(klines);
    plotRSI(klines);
    calculateAndPlotMACD(klines.close, klines.date);
    plotMACDV(klines, 26);
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

    // Define the layout for the chart
    var title = "";
    if (document.getElementById("symbol") != undefined) {
        title = document.getElementById("symbol").value;
    } else {
        title = "Wallet";
    }
    var layout = {
        title: title,
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
    Plotly.newPlot('candles', [prices], layout);
}

function calculateRSI(values, period = 14) {
    const rsiArray = [];
    const deltas = [];
    for (let i = 1; i < values.length; i++) {
        deltas.push(values[i] - values[i - 1]);
        if (i >= period) {
            const gains = deltas.slice(i - period, i).map((delta) => delta > 0 ? delta : 0);
            const losses = deltas.slice(i - period, i).map((delta) => delta < 0 ? delta : 0);
            const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / period;
            const avgLoss = Math.abs(losses.reduce((sum, loss) => sum + loss, 0) / period);
            const RS = avgGain / avgLoss;
            const RSI = 100 - (100 / (1 + RS));
            rsiArray.push(RSI);
        } else {
            rsiArray.push(null);
        }
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

function calculateEMA(data, period) {
    const k = 2 / (period + 1);
    const ema = [data[0]];
    for (let i = 1; i < data.length; i++) {
        ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
}

function calculateSmoothedMovingAverage(data, period) {
    let sum = 0;
    let multiplier = 1;
    let sma = Array(data.length).fill(0);

    // Calculate the sum of the prices
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }

    // Calculate the SMA for the first period
    sma[period - 1] = sum / period;

    // Calculate the SMA for the remaining periods
    for (let i = period; i < data.length; i++) {
        sum += data[i] - data[i - period];
        multiplier = 2 / (period + 1);
        sma[i] = (data[i] - sma[i - 1]) * multiplier + sma[i - 1];
    }

    return sma;
}

function getQueryParamValue(paramName) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get(paramName);
}