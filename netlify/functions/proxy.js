// netlify/functions/proxy.js
// 更新版：加入瀏覽器 header，解決 TAIFEX 等網站擋 server-side request 的問題

exports.handler = async (event) => {
  const url = event.queryStringParameters?.url;
  if (!url) {
    return { statusCode: 400, body: 'Missing url parameter' };
  }

  let decoded;
  try {
    decoded = decodeURIComponent(url);
  } catch (e) {
    return { statusCode: 400, body: 'Invalid url encoding' };
  }

  // 安全白名單（可依需求增加）
  const allowed = [
    'query1.finance.yahoo.com',
    'query2.finance.yahoo.com',
    'openapi.taifex.com.tw',
    'www.taifex.com.tw',
    'docs.google.com',
    'spreadsheets.google.com',
  ];
  const host = new URL(decoded).hostname;
  if (!allowed.some(h => host === h || host.endsWith('.' + h))) {
    return { statusCode: 403, body: 'Host not allowed: ' + host };
  }

  try {
    const response = await fetch(decoded, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*;q=0.9',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
      // 轉送客戶端的 Accept（讓 JSON API 優先回 JSON）
      ...(event.headers?.accept ? { headers: { Accept: event.headers.accept } } : {}),
    });

    const contentType = response.headers.get('content-type') || 'text/plain';
    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      },
      body,
    };
  } catch (e) {
    return {
      statusCode: 502,
      body: 'Proxy fetch error: ' + e.message,
    };
  }
};
