const KEY = "attendance_cache";

export function getCached() {
  return JSON.parse(localStorage.getItem(KEY)) || [];
}

export function saveCached(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addRecord(record) {
  const list = getCached();
  list.push(record);
  saveCached(list);
}
