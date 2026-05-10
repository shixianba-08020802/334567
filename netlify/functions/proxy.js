exports.handler = async function(event) {
  const target = event.queryStringParameters?.url;
  if (!target) {
    return { statusCode: 400, body: JSON.stringify({ error: 'missing url param' }) };
  }

  
  const allowed = [
    'openapi.taifex.com.tw',
    'mis.twse.com.tw',
    'www.twse.com.tw',
    'rate.bot.com.tw',
  ];

  if (!allowed.some(h => target.includes(h))) {
    return { statusCode: 403, body: JSON.stringify({ error: 'domain not allowed' }) };
  }

  try {
    const res = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-TW,zh;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: 'upstream HTTP ' + res.status }) };
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
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
