ignore = [{
    "stock": "CPTS11",
    "dates": ["2023-05-06", "2023-09-02", "2023-09-09", "2023-09-20", "2023-09-21"]
}]

splits = [{
    "stock": "CPTS11",
    "date": "2023-09-22",
    "ratio": 10
}, {
    "stock": "CPTR11",
    "date": "2023-09-19",
    "ratio": 10
}]

async function doCalculateStock(symbol) {
    if (symbol == undefined || symbol == "") {
        symbol = document.getElementById("symbol").value;
    } else {
        document.getElementById("symbol").value = symbol;
    }
    let apikey = document.getElementById("apikey").value;
    if (apikey == "") {
        apikey = getQueryParamValue("apiKey")
    }
    var klines = transformStockResponse(await getHistoricalPricesSA(symbol, apikey))
    klines = sortKlines(klines);
    calculateAndPlotAll(klines);
    let dividends = await getDividends(symbol, apikey)
    plotDividends(dividends);
}

function plotDividends(dividends) {
    dividends = dividends.filter(d => d.dividend > 0);
    const dates = dividends.map(d => d.date);
    const amounts = dividends.map(d => d.dividend);
    const percents = dividends.map(d => d.percent);
    const maxPercent = Math.max(...percents);

    const dividendAmounts = {
        x: dates,
        y: amounts,
        type: 'bar',
        name: 'Dividendos',
    };

    const dividendPercents = {
        x: dates,
        y: percents,
        type: 'scatter',
        mode: 'lines',
        yaxis: 'y2',
        name: 'Percentual',
    };

    const layout = {
        title: 'Dividendos',
        xaxis: {
            title: 'Data',
            showgrid: false,
            zeroline: false
        },
        yaxis: {
            title: 'Dividendos',
            showline: false
        },
        yaxis2: {
            overlaying: 'y',
            side: 'right',
            title: 'Dividendos',
            showline: false,
            range: [0, maxPercent]
        }
    };

    const data = [dividendAmounts, dividendPercents]

    Plotly.newPlot('dividends', data, layout);
}

async function getDividends(symbol, apiKey) {
    const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${symbol}.SA&apikey=${apiKey}`;
    try {
        const data = await fromCache(apiUrl);

        if (data['Error Message']) {
            throw new Error(data['Error Message']);
        }

        var yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);

        var dividends = []
        const seriesKey = "Monthly Adjusted Time Series";
        for (const [date, values] of Object.entries(data[seriesKey])) {
            if (date >= yearAgo.toISOString().slice(0, 10)) {
                const dividend = Number(values['7. dividend amount']);
                const adjustedClose = Number(values['5. adjusted close']);
                const percent = (dividend / adjustedClose) * 100;
                dividends.push({
                    date: date,
                    dividend,
                    percent: percent
                })
            }
        }

        return dividends;
    } catch (error) {
        console.error(error);
    }
}

async function getHistoricalPricesSA(symbol, apiKey) {
    const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}.SA&apikey=${apiKey}`;
    try {
        const data = await fromCache(apiUrl);

        if (data['Error Message']) {
            throw new Error(data['Error Message']);
        }

        const seriesKey = "Time Series (Daily)";
        const marketData = Object.entries(data[seriesKey]).map(([date, values]) => ({
            date,
            open: Number(values['1. open']),
            high: Number(values['2. high']),
            low: Number(values['3. low']),
            close: Number(values['4. close']),
            volume: Number(values['5. volume']),
        }));

        return marketData;
    } catch (error) {
        console.error(error);
    }
}

function transformStockResponse(response) {
    const openPrices = [];
    const closePrices = [];
    const highPrices = [];
    const lowPrices = [];
    const dates = [];

    const stock = document.getElementById("symbol").value;
    var ignoreDates = [];
    for (let i = 0; i < ignore.length; i++) {
        if (ignore[i].stock == stock) {
            ignoreDates = ignore[i].dates;
        }
    }

    var split = 1
    var splitDate = new Date(2030, 1, 1).toISOString().slice(0, 10);
    for (let i = 0; i < splits.length; i++) {
        if (splits[i].stock == stock) {
            split = splits[i].ratio;
            splitDate = splits[i].date;
        }
    }

    for (let i = 0; i < response.length; i++) {
        var factor = 1;

        const data = response[i];
        if (ignoreDates.includes(data.date)) {
            continue;
        }
        if (response[i].date > splitDate) {
            factor = split;
        }
        openPrices.push(parseFloat(data.open) * factor);
        highPrices.push(parseFloat(data.high) * factor);
        lowPrices.push(parseFloat(data.low) * factor);
        closePrices.push(parseFloat(data.close) * factor);
        dates.push(new Date(data.date));
    }

    return {
        open: openPrices,
        close: closePrices,
        high: highPrices,
        low: lowPrices,
        date: dates,
    };
}
