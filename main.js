async function getKlines(symbol, interval) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=50`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}
function calculateBollingerBands(closeProces, period = 20, deviation = 2) {
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

    const chartElement = document.getElementById("chart");
    if (window.myChart) {
        window.myChart.destroy();
    }

    const labels = kline.date;
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
                data: movingAverages,
                borderColor: "rgb(255, 99, 132)",
                fill: false,
                tension: 0.1,
            },
            {
                label: "Upper Band",
                data: upperBands,
                borderColor: "rgb(75, 192, 192)",
                fill: false,
                tension: 0.1,
            },
            {
                label: "Lower Band",
                data: lowerBands,
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
  
