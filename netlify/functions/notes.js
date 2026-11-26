// netlify/functions/notes.js
// 使用 Netlify Blobs 儲存交易筆記，跨裝置同步

const { getStore } = require('@netlify/blobs');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  let store;
  try {
    store = getStore('trading-notes');
  } catch (e) {
    return { statusCode: 500, headers: HEADERS, body: 'Store init error: ' + e.message };
  }

  // 讀取
  if (event.httpMethod === 'GET') {
    try {
      const text = await store.get('notes', { type: 'text' });
      return {
        statusCode: 200,
        headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
        body: text ?? '',
      };
    } catch (e) {
      return {
        statusCode: 200,
        headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
        body: '',
      };
    }
  }

  // 儲存
  if (event.httpMethod === 'POST') {
    const text = event.body ?? '';
    try {
      await store.set('notes', text);
      return { statusCode: 200, headers: HEADERS, body: 'OK' };
    } catch (e) {
      return { statusCode: 500, headers: HEADERS, body: 'Save error: ' + e.message };
    }
  }

  return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };
};
