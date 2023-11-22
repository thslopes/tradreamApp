function initCache() {
  console.log('initCache');
  let cacheDate = localStorage.getItem('cacheDate');
  if (cacheDate == null) {
    console.log('cacheDate == null');
    localStorage.setItem('cacheDate', new Date());
    return;
  }
  let today = new Date();
  let cacheDateParsed = new Date(cacheDate);
  const fromYesterday = cacheDateParsed.toISOString().substring(0,10) < today.toISOString().substring(0,10);
  const beforeTwenty = cacheDateParsed.getHours() < 20 && today.getHours() >= 20;
  if (fromYesterday || beforeTwenty) {
    console.log('fromYesterday || beforeTwenty', fromYesterday, beforeTwenty);
    const walletData = localStorage.getItem('walletData');
    localStorage.clear();
    localStorage.setItem('walletData', walletData);
    localStorage.setItem('cacheDate', today);
    return
  }
  console.log('fresh cache');
}

initCache();

async function fromCache(url) {
  let cachedData = localStorage.getItem(url);
  if (cachedData) {
    console.log('fromCache', url);
    return JSON.parse(cachedData);
  }
  console.log('fromFetch', url);
  let response = await fetch(url);
  let data = await response.json();
  localStorage.setItem(url, JSON.stringify(data));
  return data;
}