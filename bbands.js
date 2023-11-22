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

    const traceClosePrice = {
        x: labels,
        y: closePrices,
        type: 'scatter',
        mode: 'lines',
        name: 'Close Price',
        line: {
            color: 'rgb(54, 162, 235)',
            width: 1
        }
    };

    const traceMovingAverage = {
        x: labels,
        y: klines.movingAverages,
        type: 'scatter',
        mode: 'lines',
        name: 'Moving Average',
        line: {
            color: 'rgb(255, 99, 132)',
            width: 1
        }
    };

    const traceUpperBand = {
        x: labels,
        y: klines.upper,
        type: 'scatter',
        mode: 'lines',
        name: 'Upper Band',
        line: {
            color: 'rgb(75, 192, 192)',
            width: 1
        }
    };

    const traceLowerBand = {
        x: labels,
        y: klines.lower,
        type: 'scatter',
        mode: 'lines',
        name: 'Lower Band',
        line: {
            color: 'rgb(153, 102, 255)',
            width: 1
        }
    };

    const layout = {
        title: 'Bollinger Bands',
        xaxis: { title: 'Date', },
        yaxis: { title: 'Price' },
        legend: { x: 0, y: 1 }
    };

    const data = [traceClosePrice, traceMovingAverage, traceUpperBand, traceLowerBand];

    Plotly.newPlot('bbands', data, layout);
}
