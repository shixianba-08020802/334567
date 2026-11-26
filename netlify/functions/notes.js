// netlify/functions/notes.js
// 使用 GitHub Gist 儲存交易筆記，跨裝置同步（不需要 npm 套件）

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  const GIST_ID = process.env.GIST_ID;
  const GIST_TOKEN = process.env.GIST_TOKEN;

  if (!GIST_ID || !GIST_TOKEN) {
    return { statusCode: 500, headers: HEADERS, body: 'GIST_ID or GIST_TOKEN not configured' };
  }

  const gistUrl = `https://api.github.com/gists/${GIST_ID}`;
  const authHeaders = {
    'Authorization': `token ${GIST_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'shixianba-notes',
  };

  // 讀取
  if (event.httpMethod === 'GET') {
    try {
      const r = await fetch(gistUrl, { headers: authHeaders });
      if (r.ok) {
        const data = await r.json();
        const content = (data.files && data.files['notes.txt'] && data.files['notes.txt'].content) || '';
        return {
          statusCode: 200,
          headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
          body: content,
        };
      }
      return { statusCode: 200, headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }, body: '' };
    } catch (e) {
      return { statusCode: 200, headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8' }, body: '' };
    }
  }

  // 儲存
  if (event.httpMethod === 'POST') {
    const text = event.body ?? '';
    try {
      const r = await fetch(gistUrl, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: { 'notes.txt': { content: text || ' ' } },
        }),
      });
      if (r.ok) {
        return { statusCode: 200, headers: HEADERS, body: 'OK' };
      }
      const errText = await r.text();
      return { statusCode: 500, headers: HEADERS, body: 'GitHub error: ' + errText };
    } catch (e) {
      return { statusCode: 500, headers: HEADERS, body: 'Error: ' + e.message };
    }
  }

  return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };
};
