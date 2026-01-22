import { getCached, saveCached } from "./localStore";
import { sendAttendance } from "./apiClient";

export async function syncPending() {
  const records = getCached();

  for (let r of records) {
    if (!r.synced) {
      try {
        await sendAttendance(r);
        r.synced = true;
      } catch {
        break;
      }
    }
  }

  saveCached(records);
}
