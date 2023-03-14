async function getKlines(symbol, interval) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=30`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}
function calculateBollingerBands(klines, period = 20, deviation = 2) {
    const closePrices = klines.map((kline) => parseFloat(kline[4]));

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
    const chartElement = document.getElementById("chart");
    if (window.myChart) {
        window.myChart.destroy();
    }
    window.myChart = await calculate("BNBBTC", chartElement);
    
    const chartElement2 = document.getElementById("chart2");
    if (window.myChart2) {
        window.myChart2.destroy();
    }
    window.myChart2 = await calculate("BTCUSDT", chartElement2);
}

async function calculate(symbol, chartElement) {
    const klines = await getKlines(symbol, "5m");
    const { movingAverages, upperBands, lowerBands } = calculateBollingerBands(klines);


    const labels = klines.map(kline => new Date(kline[0]));
    const closePrices = klines.map(kline => kline[4]);

    const data = {
        labels: labels,
        datasets: [
            {
                label: symbol,
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

    return new Chart(chartElement.getContext('2d'), config);
}
