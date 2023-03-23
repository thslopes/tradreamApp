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
    // plotRSI(klines);
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
    var trace1 = {
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
    var trace2 = {
        type: 'scatter',
        x: klines.date,
        y: klines.upper,
        mode: 'lines',
        line: { color: '#FFA07A' }
    };

    // Define the data for the lower Bollinger Band
    var trace3 = {
        type: 'scatter',
        x: klines.date,
        y: klines.lower,
        mode: 'lines',
        line: { color: '#FFA07A' }
    };

    // Combine the data for the candlestick chart and Bollinger Bands
    var data = [trace1, trace2, trace3];

    // Define the layout for the chart
    var layout = {
        title: 'Candlestick Chart with Bollinger Bands',
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

function calculateRSI(prices, period = 14) {
    if (prices.length < period) {
        throw new Error(`Not enough prices provided for period ${period}`);
    }

    const gains = [0];
    const losses = [0];

    for (let i = 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff > 0) {
            gains.push(diff);
            losses.push(0);
        } else {
            gains.push(0);
            losses.push(-diff);
        }
    }

    let avgGain = sum(gains.slice(1, period + 1)) / period;
    let avgLoss = sum(losses.slice(1, period + 1)) / period;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    const rr = []

    for (let i = period + 1; i < prices.length; i++) {
        const gain = gains[i];
        const loss = losses[i];

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        rr.push(rsi);
    }

    return rr;
}


function sum(values) {
    return values.reduce((total, value) => total + value, 0);
}

function plotRSI(klines) {
    // Define the data for the candlestick chart

    // Define the data for the lower Bollinger Band
    var rsi = {
        type: 'scatter',
        x: klines.date,
        y: calculateRSI(klines.close),
        mode: 'lines',
        line: { color: '#FFA07A' }
    };

    // Combine the data for the candlestick chart and Bollinger Bands

    // Define the layout for the chart
    var layout = {
        title: 'Candlestick Chart with Bollinger Bands',
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
    Plotly.newPlot('rsi', rsi, layout);
}
