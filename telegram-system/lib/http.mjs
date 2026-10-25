import { HttpError } from './security.mjs';

export async function readJson(req, maxBytes = 16000) {
  if (req.method !== 'POST') throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Use POST.');
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw new HttpError(415, 'JSON_REQUIRED', 'JSON is required.');
  const length = Number(req.headers['content-length']);
  if (length > maxBytes) throw new HttpError(413, 'REQUEST_TOO_LARGE', 'The request is too large.');
  let raw = req.body;
  if (raw === undefined) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      const buffer = Buffer.from(chunk);
      size += buffer.length;
      if (size > maxBytes) throw new HttpError(413, 'REQUEST_TOO_LARGE', 'The request is too large.');
      chunks.push(buffer);
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  try {
    if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
    if (typeof raw === 'string') {
      if (Buffer.byteLength(raw) > maxBytes) throw new HttpError(413, 'REQUEST_TOO_LARGE', 'The request is too large.');
      return JSON.parse(raw);
    }
    if (Buffer.byteLength(JSON.stringify(raw)) > maxBytes) throw new HttpError(413, 'REQUEST_TOO_LARGE', 'The request is too large.');
    return raw;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'INVALID_JSON', 'The request is invalid.');
  }
}

export function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (status === 405) res.setHeader('Allow', 'POST');
  if (status === 429) res.setHeader('Retry-After', '60');
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

export function respondError(res, error) {
  if (error instanceof HttpError) return json(res, error.status, { error: error.code, message: error.message });
  // Do not log request headers, Telegram initData, fetch URLs or SDK errors;
  // these can contain live bot credentials and member data.
  console.error('System request failed unexpectedly.');
  return json(res, 500, { error: 'UNAVAILABLE', message: 'System is temporarily unavailable. Please try again.' });
}
