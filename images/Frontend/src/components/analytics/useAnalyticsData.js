// src/components/analytics/useAnalyticsData.js
import { useEffect, useState } from "react";

export function useAnalyticsData({ userId, timeRange }) {
  const [dogs, setDogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [entries, setEntries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("Geen userId gevonden. Log opnieuw in.");
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      setError("");

      try {
        const [sessionsRes, entriesRes, dogsRes] = await Promise.all([
          fetch(`/api/sessions/user/${userId}?timeRange=${timeRange}`, { credentials: "include" }),
          fetch(`/api/entries?userId=${userId}`, { credentials: "include" }),
          fetch(`/api/dogs/${userId}`, { credentials: "include" }),
        ]);

        if (!sessionsRes.ok) throw new Error(`Sessions error (${sessionsRes.status})`);
        if (!entriesRes.ok) throw new Error(`Entries error (${entriesRes.status})`);
        if (!dogsRes.ok) throw new Error(`Dogs error (${dogsRes.status})`);

        const sessionsData = await sessionsRes.json();
        const entriesData = await entriesRes.json();
        const dogsData = await dogsRes.json();

        setSessions(Array.isArray(sessionsData?.sessions) ? sessionsData.sessions : []);
        setEntries(Array.isArray(entriesData) ? entriesData : []);
        setDogs(Array.isArray(dogsData) ? dogsData : []);
      } catch (e) {
        console.error(e);
        setError("❌ Kon analytics data niet laden. Check backend routes/logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [userId, timeRange]);

  return { loading, error, sessions, entries, dogs };
}
