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
