import { useEffect, useState } from "react";

export default function UserDashboard() {
  const [entries, setEntries] = useState([]);
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName"); // 👈 naam uit localStorage

  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await fetch(`http://localhost:5000/api/entries?userId=${userId}`);
        const data = await res.json();
        setEntries(data);
      } catch (err) {
        console.error("Fout bij ophalen entries:", err);
      }
    }

    if (userId) {
      fetchEntries();
    }
  }, [userId]);

  if (!userId) {
    return <p>Log eerst in om je dashboard te bekijken.</p>;
  }

return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🐕 Pet Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Welcome back, {userName}! Here's your pet's health overview
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No pet entries yet</h3>
          <p className="text-gray-600 mb-6">Start tracking your pet's health by adding your first daily entry</p>
          <button 
            onClick={() => window.location.href = '/daily-entry'}
            className="btn-primary"
          >
            Add First Entry
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  📅 {entry.date}
                </h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  entry.emotion === 'happy' ? 'bg-green-100 text-green-800' :
                  entry.emotion === 'sad' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {entry.emotion}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">🍽️ Food</span>
                  <span className="text-sm font-medium">{entry.food}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">💧 Water</span>
                  <span className="text-sm font-medium">{entry.water}ml</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">💩 Poop</span>
                  <span className="text-sm font-medium">{entry.poop}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">🤮 Vomit</span>
                  <span className={`text-sm font-medium ${entry.vomit ? 'text-red-600' : 'text-green-600'}`}>
                    {entry.vomit ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">💊 Meds</span>
                  <span className={`text-sm font-medium ${entry.meds ? 'text-blue-600' : 'text-gray-400'}`}>
                    {entry.meds ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">🐾 Behavior</span>
                  <span className="text-sm font-medium">{entry.behavior}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic">
                  Summary: Your pet felt <strong>{entry.emotion}</strong>, 
                  ate <strong>{entry.food}</strong>, and was <strong>{entry.behavior}</strong>.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
