// netlify/functions/proxy.js
// 伺服器端 proxy — 不受 CORS 限制，直接從 Netlify 後端抓取資料

exports.handler = async function(event) {
  const target = event.queryStringParameters?.url;
  if (!target) {
    return { statusCode: 400, body: JSON.stringify({ error: 'missing url param' }) };
  }

  // 白名單：只允許特定來源
  const allowed = [
    'query1.finance.yahoo.com',
    'query2.finance.yahoo.com',
    'openapi.taifex.com.tw',
    'mis.twse.com.tw',
    'www.twse.com.tw',
    'rate.bot.com.tw',
  ];
  const isAllowed = allowed.some(h => target.includes(h));
  if (!isAllowed) {
    return { statusCode: 403, body: JSON.stringify({ error: 'domain not allowed' }) };
  }

  try {
    const res = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        'Referer': 'https://finance.yahoo.com/',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: `upstream HTTP ${res.status}` })
      };
    }

    const data = await res.text();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30',
      },
      body: data,
    };
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
