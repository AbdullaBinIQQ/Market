async function updateSignal() {
  const pair = document.getElementById("pair").value.replace("_OTC", "");
  const url = `https://api.twelvedata.com/time_series?symbol=${pair}&interval=1min&apikey=3d8d4d9b2326435ab29e99b86fae4076&outputsize=25`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.values) {
      document.getElementById("signal-output").innerText = "⚠️ No data available.";
      return;
    }

    const values = data.values.reverse();
    const close = values.map(v => parseFloat(v.close));
    const rsi = calculateRSI(close);
    const ema9 = calculateEMA(close, 9);
    const ema21 = calculateEMA(close, 21);

    let decision = "WAIT";
    let reason = "Market uncertain";

    if (rsi > 55 && ema9[ema9.length - 1] > ema21[ema21.length - 1]) {
      decision = "BUY";
      reason = "RSI>55, EMA9>EMA21";
    } else if (rsi < 45 && ema9[ema9.length - 1] < ema21[ema21.length - 1]) {
      decision = "SELL";
      reason = "RSI<45, EMA9<EMA21";
    }

    const now = new Date();
    const time = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const output = `${pair} ➤ ${decision} at ${time}\nReason: ${reason}`;
    document.getElementById("signal-output").innerText = output;
    logSignal(pair, decision, reason);
  } catch (err) {
    document.getElementById("signal-output").innerText = "⚠️ Error fetching data.";
  }
}

function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  let ema = [prices.slice(0, period).reduce((a, b) => a + b) / period];
  for (let i = period; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[ema.length - 1] * (1 - k));
  }
  return ema;
}

function calculateRSI(prices, period = 14) {
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function updateChart() {
  const pair = document.getElementById("pair").value.replace("_OTC", "").replace("/", "");
  const chart = document.getElementById("tv-chart");
  chart.src = `https://s.tradingview.com/widgetembed/?symbol=FX:${pair}&interval=1&theme=dark&style=1`;
}

function logSignal(pair, decision, reason) {
  const now = new Date();
  const time = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const log = `[${time}] ${pair} ➤ ${decision} — ${reason}`;
  const historyBox = document.getElementById("signal-history");
  const entry = document.createElement("div");
  entry.innerText = log;
  historyBox.prepend(entry);
}

function refreshWithLoading() {
  const output = document.getElementById("signal-output");
  output.innerText = "Refreshing signal...";
  setTimeout(updateSignal, 1000);
}

updateSignal();
setInterval(updateSignal, 30000);