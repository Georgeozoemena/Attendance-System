export function connectToSSE(url) {
  const adminKey = localStorage.getItem('adminKey');
  const separator = url.includes('?') ? '&' : '?';
  const finalUrl = adminKey ? `${url}${separator}key=${encodeURIComponent(adminKey)}` : url;

  const full = finalUrl.startsWith('http') ? finalUrl : `${window.location.origin}${finalUrl}`;
  return new EventSource(full);
}