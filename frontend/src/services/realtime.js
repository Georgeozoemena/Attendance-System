import { API_BASE } from './api';

export function connectToSSE(url) {
  const adminKey = localStorage.getItem('adminKey');
  // EventSource doesn't support custom headers; we pass the signed token as a query param.
  // The token is a signed HMAC (not the raw password), so this is acceptable.
  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = adminKey ? `${url}${separator}key=${encodeURIComponent(adminKey)}` : url;
  const full = finalUrl.startsWith('http') ? finalUrl : `${API_BASE}${finalUrl}`;
  return new EventSource(full);
}