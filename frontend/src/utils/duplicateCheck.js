import { getCached } from "../services/localStore";
import { sameDay } from "./date";

export function isDuplicate(record) {
  const list = getCached();

  return list.some(r =>
    r.name === record.name &&
    r.service === record.service &&
    sameDay(r.timestamp, record.timestamp)
  );
}
