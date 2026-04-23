const getSessionId = (session) => session._id || session.id || session.sessionId;
const getSessionKey = (session, index) => {
  const sessionId = getSessionId(session);
  return sessionId ? `${sessionId}-${index}` : `session-row-${index}`;
};
const formatDate = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};
const normalizeStatus = (status) => {
  if (!status || status === "not_marked") {
    return "Not marked";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};
const isMarkedPresent = (status) => status?.toLowerCase() === "present";

const AttendanceTable = ({ sessions, onMarkAttendance, userRole }) => (
  <table className="min-w-full bg-white rounded shadow overflow-hidden">
    <thead className="bg-gray-50">
      <tr>
        <th className="py-3 px-4 border-b text-left">Session</th>
        <th className="py-3 px-4 border-b text-left">Date</th>
        <th className="py-3 px-4 border-b text-left">Status</th>
        {userRole === "student" && <th className="py-3 px-4 border-b text-left">Action</th>}
      </tr>
    </thead>
    <tbody>
      {sessions.map((session, idx) => (
        <tr key={getSessionKey(session, idx)}>
          <td className="py-3 px-4 border-b">{session.name || session.title || "Untitled session"}</td>
          <td className="py-3 px-4 border-b">{formatDate(session.date)}</td>
          <td className="py-3 px-4 border-b">
            <span className={isMarkedPresent(session.attendanceStatus) ? "text-green-700 font-semibold" : "text-gray-500"}>
              {normalizeStatus(session.attendanceStatus)}
            </span>
          </td>
          {userRole === "student" && (
            <td className="py-3 px-4 border-b">
              {isMarkedPresent(session.attendanceStatus) ? (
                <span className="text-green-600 font-semibold">Marked</span>
              ) : (
                <button
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:cursor-not-allowed disabled:bg-gray-300"
                  onClick={() => onMarkAttendance(getSessionId(session))}
                  disabled={!getSessionId(session)}
                >
                  Mark Attendance
                </button>
              )}
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
);

export default AttendanceTable;
