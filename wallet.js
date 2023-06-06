async function doEvolution() {
    let apikey = document.getElementById("apikey").value;
    if (apikey == "") {
        apikey = getQueryParamValue("apiKey")
    }

    const itens = [
        { symbol: "XPCI11", count: 29 },
        { symbol: "CPTS11", count: 30 },
        { symbol: "KNCR11", count: 25 },
        { symbol: "PETR4", count: 71 },
        { symbol: "ITUB4", count: 38 },
    ]
    for (let index = 0; index < itens.length; index++) {
        const element = itens[index];
        element.task = getHistoricalPricesSA(element.symbol, apikey);
    }
    for (let index = 0; index < itens.length; index++) {
        const element = itens[index];
        element.klines = transformFIIResponse(await element.task);
    }

    const tudao = {
        date: itens[0].klines.date,
        close: Array(itens[0].klines.close.length).fill(0),
        high: Array(itens[0].klines.close.length).fill(0),
        open: Array(itens[0].klines.close.length).fill(0),
        low: Array(itens[0].klines.close.length).fill(0)
    }



    itens.forEach(element => {
        for (let index = 0; index < tudao.date.length; index++) {
            tudao.close[index] += element.klines.close[index] * element.count;
            tudao.high[index] += element.klines.high[index] * element.count;
            tudao.open[index] += element.klines.open[index] * element.count;
            tudao.low[index] += element.klines.low[index] * element.count;
        }
    });

    calculateAndPlotAll(tudao);
}

