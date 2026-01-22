export async function sendAttendance(record) {
  const res = await fetch("/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record)
  });

  if (!res.ok) throw new Error("Network error");
}
