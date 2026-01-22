import { addRecord } from "../services/localStore";
import { syncPending } from "../services/syncService";

export default function AttendanceForm() {
  function submit(e) {
    e.preventDefault();

    const record = {
      id: crypto.randomUUID(),
      name: e.target.name.value,
      service: e.target.service.value,
      timestamp: Date.now(),
      synced: false
    };

    addRecord(record);
    syncPending();
    alert("Attendance saved");
  }

  return (
    <form onSubmit={submit}>
      <input name="name" required />
      <select name="service">
        <option>Sunday Service</option>
      </select>
      <button>Submit</button>
    </form>
  );
}
