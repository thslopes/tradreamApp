async function doEvolution() {
    const apikey = document.getElementById("apikey").value;
    
    const itens = [
        { symbol: "XPCI11", count: 29 },
        { symbol: "CPTS11", count: 30 },
        { symbol: "KNCR11", count: 25 },
    ]
    for (let index = 0; index < itens.length; index++) {
        const element = itens[index];
        element.klines = transformFIIResponse(await getHistoricalPricesSA(element.symbol, apikey));
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

