export function connectToSSE(url) {
  const full = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  return new EventSource(full);
}