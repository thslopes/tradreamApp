class Stock {
    constructor(data) {
        this.symbol = data.symbol;
        this.purchases = data.purchases;
        this.splits = data.splits;
        this.ignoreDates = data.ignoreDates;
        this.sales = data.sales;
    }
    firstPurchaseDate() {
        let firstDate = null;
        for (let i = 0; i < this.purchases.length; i++) {
            if (firstDate == null || this.purchases[i].date < firstDate) {
                firstDate = this.purchases[i].date;
            }
        }
        return firstDate;
    }

    investedAmount(date) {
        let amount = 0;
        for (let i = 0; i < this.purchases.length; i++) {
            if (this.purchases[i].date <= date) {
                amount += this.purchases[i].investedAmount;
            }
        }
        return amount;
    }
    purchasesQtt(date) {
        let qtt = 0;
        for (let i = 0; i < this.purchases.length; i++) {
            if (this.purchases[i].date <= date) {
                const split = this.split(this.purchases[i].date);
                qtt += (this.purchases[i].qtt / split);
            }
        }
        return qtt;
    }
    split(date) {
        if (this.splits == null) {
            return 1;
        }
        let split = 1;
        for (let i = 0; i < this.splits.length; i++) {
            if (this.splits[i].splitDate <= date) {
                split *= this.splits[i].split;
            }
        }
        return split;
    }
    ignoreDate(date) {
        if (this.ignoreDates == null) {
            return false;
        }
        return this.ignoreDates.includes(date);
    }
    salesAmount(date) {
        if (this.sales == null) {
            return 0;
        }
        let amount = 0;
        for (let i = 0; i < this.sales.length; i++) {
            if (this.sales[i].saleDate <= date) {
                amount += this.sales[i].seleValue;
            }
        }
        return amount;
    }
    salesQtt(date) {
        if (this.sales == null) {
            return 0;
        }
        let qtt = 0;
        for (let i = 0; i < this.sales.length; i++) {
            if (this.sales[i].saleDate <= date) {
                qtt += this.sales[i].qtt;
            }
        }
        return qtt;
    }
}

let data = {};

apiKey = getQueryParamValue("apiKey");
doWallet();

async function doWallet() {
    if (document.getElementById("walletData").value != "") {
        const walletData = document.getElementById("walletData").value;
        console.log(walletData);
        data = JSON.parse(walletData);
        localStorage.setItem('walletData', walletData);
    } else if (localStorage.getItem('walletData') != null) {
        const walletData = localStorage.getItem('walletData');
        data = JSON.parse(walletData);
    } else return;
    var merged = [];
    for (let i = 0; i < data.length; i++) {
        let prices = document.createElement("div");
        prices.id = data[i].symbol;
        document.body.appendChild(prices);

        let profits = document.createElement("div");
        profits.id = data[i].symbol + "Profit";
        document.body.appendChild(profits);

        const stock = data[i];
        const historicalData = await getHistoricalStockData(new Stock(stock));
        plotCandlestickChart(historicalData, stock.symbol);
        plotCandlestickChart(historicalData, stock.symbol, true);

        merged = merge(merged, historicalData);
        if (!localStorage.getItem('cached')) {
            await sleep(15000);
        }
    }

    localStorage.setItem('cached', true);

    plotCandlestickChart(merged, "Tudao", true);
}

async function getHistoricalStockData(stock) {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stock.symbol}.SA&apikey=${apiKey}`;

    try {
        const data = await fromCache(url);

        if ("Error Message" in data) {
            throw new Error(data["Error Message"]);
        }

        let firstPurchaseDate = stock.firstPurchaseDate();

        const seriesKey = "Time Series (Daily)";
        const stockData = [];
        for (const [date, values] of Object.entries(data[seriesKey])) {
            if (stock.ignoreDate(date)) {
                continue;
            }
            if (firstPurchaseDate < date) {
                stockData.push(parsePrices(stock, date, values));
            }
        }

        return stockData;
    } catch (error) {
        console.log(`An error occurred: ${error}`);
        return null;
    }
}

function parsePrices(stock, date, values) {
    let qtt = stock.purchasesQtt(date) - stock.salesQtt(date);
    let investedAmount = stock.investedAmount(date) - stock.salesAmount(date);
    var factor = stock.split(date);
    if (qtt == 0) {
        investedAmount = 0;
    }
    return {
        date,
        open: factor * parseFloat(values["1. open"]),
        high: factor * parseFloat(values["2. high"]),
        low: factor * parseFloat(values["3. low"]),
        close: factor * parseFloat(values["4. close"]),
        openProfit: factor * parseFloat(values["1. open"]) * qtt - investedAmount,
        highProfit: factor * parseFloat(values["2. high"]) * qtt - investedAmount,
        lowProfit: factor * parseFloat(values["3. low"]) * qtt - investedAmount,
        closeProfit: factor * parseFloat(values["4. close"]) * qtt - investedAmount,
    };
}

function getQueryParamValue(paramName) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get(paramName);
}

function plotCandlestickChart(prices, symbol, profit = false) {
    let sufix = '';
    let title = "Price";
    if (profit) {
        sufix = 'Profit';
        title = "Profit";
    }

    // Extract the necessary data from the stock data
    const dates = prices.map(item => item.date);
    const opens = prices.map(item => item['open' + sufix]);
    const highs = prices.map(item => item['high' + sufix]);
    const lows = prices.map(item => item['low' + sufix]);
    const closes = prices.map(item => item['close' + sufix]);

    // Create the candlestick trace
    const trace = {
        x: dates,
        open: opens,
        high: highs,
        low: lows,
        close: closes,
        type: 'candlestick'
    };

    // Create the layout
    const layout = {
        title: symbol,
        yaxis: {
            title: title
        }
    };

    // Create the figure and add the trace
    const data = [trace];
    const config = { responsive: true };
    Plotly.newPlot(symbol + sufix, data, layout, config);
}

function merge(d1, d2) {
    const d3 = [];
    map = {}
    for (let i = 0; i < d1.length; i++) {
        map[d1[i].date] = d1[i];
    }
    for (let i = 0; i < d2.length; i++) {
        if (d2[i].date in map) {
            map[d2[i].date] = {
                date: d2[i].date,
                open: d2[i].open,
                high: d2[i].high,
                low: d2[i].low,
                close: d2[i].close,
                openProfit: d2[i].openProfit + map[d2[i].date].openProfit,
                highProfit: d2[i].highProfit + map[d2[i].date].highProfit,
                lowProfit: d2[i].lowProfit + map[d2[i].date].lowProfit,
                closeProfit: d2[i].closeProfit + map[d2[i].date].closeProfit,
            };
        } else {
            map[d2[i].date] = d2[i];
        }
    }

    for (const [key, value] of Object.entries(map)) {
        d3.push(value);
    }

    let sorted = d3.sort((a, b) => (a.date > b.date) ? 1 : -1)

    return sorted;
}

function sleep(ms) {
    setTimeleft(true);
    return new Promise(resolve => setTimeout(resolve, ms));
}
let timeLeft = 0;
function setTimeleft(init = false) {
    if (init) {
        timeLeft = 15;
    } else {
        timeLeft--;
    }
    document.getElementById("timeLeft").innerHTML = timeLeft;
    if (timeLeft > 0) {
        setTimeout(setTimeleft, 1000)
    }
}
