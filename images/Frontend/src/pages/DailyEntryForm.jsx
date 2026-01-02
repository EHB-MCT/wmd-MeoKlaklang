import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./DailyEntryForm.css";
import analytics from "../utils/analytics";

export default function DailyEntryForm() {
  const navigate = useNavigate();

  /* =========================
     BASIS
  ========================= */
  const userId = localStorage.getItem("userId");
  const storedSessionId = localStorage.getItem("sessionId");

  const [dogs, setDogs] = useState([]);
  const [dogId, setDogId] = useState("");
  const [dogSelected, setDogSelected] = useState(false);
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const pageStartTsRef = useRef(Date.now());
  const startTimeRef = useRef(Date.now());

  const [hoveredOptions, setHoveredOptions] = useState([]);
  const hoverStartTimesRef = useRef(new Map()); // key -> ts
  const hoverCountsRef = useRef(new Map()); // key -> count
  const optionChangeCountsRef = useRef(new Map()); // groupLabel -> count

  const changedFieldsRef = useRef(new Set()); // field names (bucket changes)
  const fieldBucketRef = useRef(new Map()); // fieldName -> lastBucket
  const fieldDebounceTimersRef = useRef(new Map()); // fieldName -> timerId

  const lastTrackedProgressRef = useRef(0);

  /* =========================
     DAGELIJKSE DATA
  ========================= */
  const [food, setFood] = useState("");
  const [water, setWater] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [walks, setWalks] = useState("");
  const [playtimeMinutes, setPlaytimeMinutes] = useState("");
  const [aloneHours, setAloneHours] = useState("");

  /* =========================
     GEZONDHEID & GEDRAG
  ========================= */
  const [poop, setPoop] = useState("");
  const [vomit, setVomit] = useState(false);
  const [meds, setMeds] = useState(false);
  const [behavior, setBehavior] = useState("");
  const [emotion, setEmotion] = useState("");
  const [appetite, setAppetite] = useState("");
  const [energyLevel, setEnergyLevel] = useState("");

  const [stressSignals, setStressSignals] = useState(false);
  const [painSignals, setPainSignals] = useState(false);
  const [trainingDone, setTrainingDone] = useState(false);
  const [leftAloneTooLong, setLeftAloneTooLong] = useState(false);

  /* =========================
     SUBJECTIEVE ZORG
  ========================= */
  const [ownerConcern, setOwnerConcern] = useState("");

  /* =========================
     PROGRESS CALCULATION
  ========================= */
  const calculateProgress = () => {
    const requiredFields = [food, poop, behavior, emotion];
    const optionalFields = [water, sleepHours, walks, playtimeMinutes, aloneHours];
    const checkboxFields = [vomit, meds, stressSignals, painSignals, trainingDone, leftAloneTooLong];

    const requiredFilled = requiredFields.filter((field) => field && field !== "").length;
    const optionalFilled = optionalFields.filter((field) => field && field !== "").length;
    const checkboxesFilled = checkboxFields.filter(Boolean).length;

    const totalFields = requiredFields.length + optionalFields.length + checkboxFields.length;
    const filledFields = requiredFilled + optionalFilled + checkboxesFilled;

    return Math.round((filledFields / totalFields) * 100);
  };

  const getCompletionStatus = () => {
    const progress = calculateProgress();
    if (progress === 100) return { text: "Volledig ingevuld", color: "#48bb78" };
    if (progress >= 75) return { text: "Bijna klaar", color: "#4299e1" };
    if (progress >= 50) return { text: "Goed bezig", color: "#ed8936" };
    return { text: "Net begonnen", color: "#718096" };
  };

  /* =========================
     ENTRIES OPHALEN
  ========================= */
  useEffect(() => {
    if (!userId) return;

    fetch(`/api/entries?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setEntries(data))
      .catch((err) => console.error("Error fetching entries:", err));
  }, [userId]);

  /* =========================
     DOGS OPHALEN
  ========================= */
  useEffect(() => {
    if (!userId) return;

    fetch(`/api/dogs/${userId}`)
      .then((res) => res.json())
      .then((data) => setDogs(data))
      .catch((err) => console.error(err));
  }, [userId]);

  /* =========================
     PAGE VIEW / EXIT
  ========================= */
  useEffect(() => {
    // If user refreshed and analytics was not started, try to start it from localStorage.
    // This is safe: analytics.start() will just enable tracking when IDs exist.
    if (userId && storedSessionId) {
      analytics.start(userId, storedSessionId);
    }

    // Track a page view for this page
    analytics.track("page_view", {
      route: "/daily-entry",
      selectedDate,
      dogSelected: false,
      dogId: null,
    });

    const buildExitPayload = () => {
      const timeOnPageMs = Date.now() - pageStartTsRef.current;
      const progressPercent = calculateProgress();

      const optionChangeCounts = {};
      optionChangeCountsRef.current.forEach((v, k) => {
        optionChangeCounts[k] = v;
      });

      return {
        route: "/daily-entry",
        timeOnPageMs,
        progressPercent,
        dogSelected,
        dogId: dogSelected ? dogId : null,
        selectedDate,
        changedFieldsCount: changedFieldsRef.current.size,
        optionChangeCounts,
        hoveredOptionsCount: hoveredOptions.length,
      };
    };

    const onBeforeUnload = () => {
      analytics.track("page_exit", buildExitPayload());
      analytics.flush(true); // beacon best-effort
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      analytics.track("page_exit", buildExitPayload());
      analytics.flush(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
     PROGRESS SNAPSHOTS (>=10% increase)
  ========================= */
  useEffect(() => {
    const progress = calculateProgress();
    const last = lastTrackedProgressRef.current;

    if (progress >= last + 10) {
      lastTrackedProgressRef.current = progress;
      analytics.track("progress_snapshot", {
        progressPercent: progress,
        dogId: dogSelected ? dogId : null,
        selectedDate,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    food,
    water,
    sleepHours,
    walks,
    playtimeMinutes,
    aloneHours,
    poop,
    behavior,
    emotion,
    appetite,
    energyLevel,
    vomit,
    meds,
    stressSignals,
    painSignals,
    trainingDone,
    leftAloneTooLong,
    ownerConcern,
  ]);

  /* =========================
     CALENDAR FUNCTIONS
  ========================= */
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay =
      new Date(year, month, 1).getDay() === 0
        ? 6
        : new Date(year, month, 1).getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getDogEntryCount = (dId) => entries.filter((entry) => entry.dogId === dId).length;

  const hasEntryOnDate = (day, checkMonth = currentMonth, checkYear = currentMonth.getFullYear()) => {
    const dateStr = `${checkYear}-${String(checkMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return entries.some((entry) => entry.dogId === dogId && entry.date === dateStr);
  };

  const isToday = (day) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === todayStr;
  };

  const isPastDateFromToday = (date) => {
    const checkDate = new Date(date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isPastDate = (day) => {
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate <= today;
  };

  const getDateStatus = (day) => {
    if (!day) return "disabled";
    if (isToday(day)) return "today";
    if (!isPastDate(day)) return "future";
    return "past";
  };

  /* =========================
     CALENDAR NAVIGATION (with analytics)
  ========================= */
  const handlePreviousMonth = () => {
    analytics.track("calendar_month_changed", {
      direction: "prev",
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
      dogId: dogSelected ? dogId : null,
      selectedDate,
    });

    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    analytics.track("calendar_month_changed", {
      direction: "next",
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
      dogId: dogSelected ? dogId : null,
      selectedDate,
    });

    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    if (!day) return;

    const newSelectedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const status = getDateStatus(day);
    const hasEntry = hasEntryOnDate(day);

    analytics.track("calendar_day_clicked", {
      day,
      status,
      hasEntry,
      newSelectedDate,
      dogId: dogSelected ? dogId : null,
      selectedDate,
    });

    setSelectedDate(newSelectedDate);
  };

  /* =========================
     DOG SELECT (sidebar)
  ========================= */
  const selectDog = (selectedDogId, source = "unknown") => {
    setDogId(selectedDogId);
    setDogSelected(!!selectedDogId);

    if (selectedDogId) {
      analytics.track("dog_selected", {
        dogId: selectedDogId,
        source,
        timeSinceLoadMs: Date.now() - startTimeRef.current,
        selectedDate,
      });
    }
  };

  /* =========================
     PRIVACY-SAFE FIELD BUCKETS
  ========================= */
  const bucketNumber = (fieldName, raw) => {
    const n = Number(raw);
    if (!raw || raw === "" || Number.isNaN(n)) return "empty";

    if (fieldName === "water") {
      if (n <= 0) return "0";
      if (n <= 100) return "1-100";
      if (n <= 300) return "101-300";
      if (n <= 700) return "301-700";
      return "700+";
    }

    if (fieldName === "sleepHours") {
      if (n <= 0) return "0";
      if (n <= 3) return "1-3";
      if (n <= 6) return "4-6";
      if (n <= 9) return "7-9";
      return "10+";
    }

    if (fieldName === "walks") {
      if (n <= 0) return "0";
      if (n === 1) return "1";
      if (n === 2) return "2";
      return "3+";
    }

    if (fieldName === "playtimeMinutes") {
      if (n <= 0) return "0";
      if (n <= 15) return "1-15";
      if (n <= 30) return "16-30";
      if (n <= 60) return "31-60";
      return "60+";
    }

    if (fieldName === "aloneHours") {
      if (n <= 0) return "0";
      if (n <= 2) return "1-2";
      if (n <= 5) return "3-5";
      if (n <= 8) return "6-8";
      return "9+";
    }

    if (n <= 0) return "0";
    if (n <= 10) return "1-10";
    return "10+";
  };

  const trackFieldChanged = (fieldName, rawValue, type = "number", debounceMs = 500) => {
    const prevTimer = fieldDebounceTimersRef.current.get(fieldName);
    if (prevTimer) clearTimeout(prevTimer);

    const timer = setTimeout(() => {
      let bucket = "unknown";
      if (type === "number") bucket = bucketNumber(fieldName, rawValue);
      if (type === "boolean") bucket = rawValue ? "true" : "false";
      if (type === "text") {
        const len = (rawValue || "").length;
        if (len === 0) bucket = "0";
        else if (len <= 3) bucket = "1-3";
        else if (len <= 10) bucket = "4-10";
        else bucket = "11+";
      }

      const lastBucket = fieldBucketRef.current.get(fieldName);
      if (bucket !== lastBucket) {
        fieldBucketRef.current.set(fieldName, bucket);
        changedFieldsRef.current.add(fieldName);

        analytics.track("field_changed", {
          fieldName,
          bucket,
          dogId: dogSelected ? dogId : null,
          selectedDate,
        });
      }
    }, debounceMs);

    fieldDebounceTimersRef.current.set(fieldName, timer);
  };

  /* =========================
     HOVER TRACKING (option buttons only)
  ========================= */
  const handleOptionHover = (groupLabel, option, isEntering) => {
    const hoverKey = `${groupLabel}_${option}`;

    if (isEntering) {
      hoverStartTimesRef.current.set(hoverKey, Date.now());
      if (!hoveredOptions.includes(hoverKey)) {
        setHoveredOptions((prev) => [...prev, hoverKey]);
      }
      return;
    }

    const start = hoverStartTimesRef.current.get(hoverKey);
    if (!start) return;

    const durationMs = Date.now() - start;
    hoverStartTimesRef.current.delete(hoverKey);

    if (durationMs >= 150) {
      const prevCount = hoverCountsRef.current.get(hoverKey) || 0;
      const nextCount = prevCount + 1;
      hoverCountsRef.current.set(hoverKey, nextCount);

      analytics.track("option_hover_duration", {
        groupLabel,
        option,
        durationMs,
        hoverCount: nextCount,
        dogId: dogSelected ? dogId : null,
        selectedDate,
      });
    }
  };

  /* =========================
     OPTION BUTTONS (with option_selected)
  ========================= */
  const renderOptionButtons = (label, options, selectedValue, setter) => {
    const groupLabel = label.toLowerCase().replace(/\s+/g, "_");

    return (
      <div>
        <strong>{label}</strong>
        <div className="option-buttons">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const previousOption = selectedValue;
                setter(opt);

                analytics.track("option_selected", {
                  groupLabel,
                  option: opt,
                  previousOption: previousOption || null,
                  timeSinceLoadMs: Date.now() - startTimeRef.current,
                  dogId: dogSelected ? dogId : null,
                  selectedDate,
                });

                const prev = optionChangeCountsRef.current.get(groupLabel) || 0;
                optionChangeCountsRef.current.set(groupLabel, prev + 1);
              }}
              onMouseEnter={() => handleOptionHover(groupLabel, opt, true)}
              onMouseLeave={() => handleOptionHover(groupLabel, opt, false)}
              className={`option-button ${selectedValue === opt ? "active" : ""}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  /* =========================
     LOGOUT (end session + stop analytics)
  ========================= */
  const handleLogout = async () => {
    try {
      const sid = localStorage.getItem("sessionId");
      if (sid) {
        await fetch(`/api/sessions/${sid}`, {
          method: "DELETE",
          credentials: "include",
        });
      }
    } catch (err) {
      // best effort
      console.warn("Logout session end failed:", err);
    }

    try {
      analytics.track("logout_clicked", { route: "/daily-entry" });
      analytics.flush(true);
      analytics.stop();
    } catch (_) {}

    localStorage.clear();
    navigate("/login");
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dogId) {
      alert("Selecteer eerst een hond");
      return;
    }

    const submitStart = Date.now();

    const fields = [
      food,
      water,
      sleepHours,
      walks,
      playtimeMinutes,
      aloneHours,
      poop,
      behavior,
      emotion,
      appetite,
      energyLevel,
      ownerConcern,
    ];

    const emptyFields = fields.filter((v) => !v || v === 0).length;

    analytics.track("submit_attempt", {
      progressPercent: calculateProgress(),
      emptyFields,
      timeOnPageMs: Date.now() - startTimeRef.current,
      dogId,
      selectedDate,
    });

    const entry = {
      userId,
      dogId,
      date: selectedDate,

      food,
      water,
      sleepHours,
      walks,
      playtimeMinutes,
      aloneHours,

      poop,
      vomit,
      meds,
      behavior,
      emotion,
      appetite,
      energyLevel,

      stressSignals,
      painSignals,
      trainingDone,
      leftAloneTooLong,

      ownerConcern,

      hoveredOptions,
      timeOnPage: Date.now() - startTimeRef.current,
      emptyFields,
    };

    setLoading(true);
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
        credentials: "include",
      });

      const requestDurationMs = Date.now() - submitStart;

      if (!response.ok) {
        let msg = "Fout bij opslaan";
        try {
          const errorData = await response.json();
          msg = errorData.error || msg;
        } catch {
          // ignore
        }

        analytics.track("submit_fail", {
          requestDurationMs,
          statusCode: response.status,
          errorMessageTrimmed: String(msg).substring(0, 100),
          dogId,
          selectedDate,
        });

        throw new Error(msg);
      }

      analytics.track("submit_success", {
        requestDurationMs,
        dogId,
        selectedDate,
      });

      alert("Dagelijkse log opgeslagen 🐾");

      // Reset fields
      setFood("");
      setWater("");
      setSleepHours("");
      setWalks("");
      setPlaytimeMinutes("");
      setAloneHours("");
      setPoop("");
      setVomit(false);
      setMeds(false);
      setBehavior("");
      setEmotion("");
      setAppetite("");
      setEnergyLevel("");
      setStressSignals(false);
      setPainSignals(false);
      setTrainingDone(false);
      setLeftAloneTooLong(false);
      setOwnerConcern("");

      // Refresh entries
      const entriesResponse = await fetch(`/api/entries?userId=${userId}`, { credentials: "include" });
      const entriesData = await entriesResponse.json();
      setEntries(entriesData);
    } catch (err) {
      console.error(err);
      alert(`Fout bij opslaan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="enhanced-daily-entry-container">
      {/* HEADER */}
      <header className="form-header">
        <h2>🐶 Honden Dagboek</h2>
        <p className="subtitle">Volg de gezondheid en het geluk van je honden</p>
      </header>

      {/* NAVIGATIE */}
      <nav className="nav-bar">
        <button onClick={() => navigate("/daily-entry")} className="nav-btn active">
          📓 Logboek
        </button>
        <button onClick={() => navigate("/my-dogs")} className="nav-btn">
          🐕 Mijn dieren
        </button>
        <button onClick={() => navigate("/profile")} className="nav-btn">
          👤 Profiel
        </button>
        <button onClick={() => navigate("/notifications")} className="nav-btn">
          🔔 Meldingen
        </button>
        <button onClick={handleLogout} className="nav-btn logout-button">
          🚪 Uitloggen
        </button>
      </nav>

      <div className="main-content">
        {/* LINKER KOLOM */}
        <div className="sidebar">
          <div className="dog-overview-section">
            <h3>🐕 Mijn Honden</h3>
            {dogs.length === 0 ? (
              <div className="no-dogs-card">
                <p>Je hebt nog geen honden toegevoegd</p>
                <button onClick={() => navigate("/my-dogs")} className="add-dog-btn">
                  ➕ Hond toevoegen
                </button>
              </div>
            ) : (
              <div className="dog-cards">
                {dogs.map((dog) => {
                  const entryCount = getDogEntryCount(dog._id);
                  const isSelected = dog._id === dogId;

                  return (
                    <div
                      key={dog._id}
                      className={`dog-card ${isSelected ? "selected" : ""}`}
                      onClick={() => selectDog(dog._id, "sidebar_card")}
                    >
                      <div className="dog-avatar">🐕</div>
                      <div className="dog-info">
                        <h4>{dog.name}</h4>
                        <p>{dog.breed}</p>
                        <div className="dog-stats">
                          <span className="stat">📊 {entryCount} entries</span>
                          {dog.age && <span className="stat">🎂 {dog.age} jaar</span>}
                        </div>
                      </div>
                      <div className="dog-select-indicator">{isSelected ? "✅" : "○"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RECENT ENTRIES & CALENDAR */}
          {dogSelected && (
            <div className="recent-entries-section">
              <h3>📊 Recent voor {dogs.find((d) => d._id === dogId)?.name}</h3>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{getDogEntryCount(dogId)}</div>
                  <div className="stat-label">Totaal entries</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {
                      entries.filter(
                        (e) => e.dogId === dogId && e.date === new Date().toISOString().split("T")[0]
                      ).length
                    }
                  </div>
                  <div className="stat-label">Vandaag</div>
                </div>
              </div>

              <div className="calendar-section">
                <div className="calendar-nav">
                  <button onClick={handlePreviousMonth} className="calendar-nav-btn">
                    ‹
                  </button>
                  <h4>
                    📅{" "}
                    {currentMonth.toLocaleDateString("nl-NL", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h4>
                  <button onClick={handleNextMonth} className="calendar-nav-btn">
                    ›
                  </button>
                </div>

                <div className="mini-calendar">
                  <div className="calendar-header">
                    {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => (
                      <div key={day} className="calendar-day-header">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="calendar-grid">
                    {getDaysInMonth(currentMonth).map((day, index) => {
                      const isSelected =
                        day === parseInt(selectedDate.split("-")[2], 10) &&
                        currentMonth.getMonth() === new Date(selectedDate).getMonth() &&
                        currentMonth.getFullYear() === new Date(selectedDate).getFullYear();

                      const hasEntry = day ? hasEntryOnDate(day) : false;
                      const today = day ? isToday(day) : false;
                      const status = day ? getDateStatus(day) : "disabled";
                      const isClickable = day && isPastDate(day);

                      return (
                        <div
                          key={index}
                          className={`calendar-day
                            ${isSelected ? "selected" : ""}
                            ${today ? "today" : ""}
                            ${hasEntry ? "has-entry" : ""}
                            ${status === "future" ? "future" : ""}
                            ${isClickable ? "clickable" : "disabled"}`}
                          onClick={() => isClickable && handleDateClick(day)}
                          title={status === "future" ? "Toekomstige data niet beschikbaar" : ""}
                        >
                          {day}
                          {hasEntry && <span className="entry-dot"></span>}
                          {today && !hasEntry && <span className="today-indicator"></span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="calendar-legend">
                  <div className="legend-item">
                    <span className="legend-dot selected-dot"></span>
                    <span>Geselecteerd</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot today-dot"></span>
                    <span>Vandaag</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot entry-dot-legend"></span>
                    <span>Heeft entry</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RECHTER KOLOM */}
        <div className="form-section">
          {!dogSelected ? (
            <div className="select-dog-prompt">
              <div className="prompt-icon">🐾</div>
              <h3>Kies eerst een hond</h3>
              <p>Selecteer een hond aan de linkerkant om het dagboek in te vullen</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="enhanced-form">
              {/* PROGRESS */}
              <div className="progress-section">
                <div className="progress-header">
                  <h4>Voortgang</h4>
                  <span className="progress-percentage">{calculateProgress()}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${calculateProgress()}%`,
                      backgroundColor: getCompletionStatus().color,
                    }}
                  ></div>
                </div>
                <p className="progress-text" style={{ color: getCompletionStatus().color }}>
                  {getCompletionStatus().text}
                </p>
              </div>

              <div className="form-header-info">
                <div className="form-title">
                  <h3>📋 Invoeren voor {dogs.find((d) => d._id === dogId)?.name}</h3>
                  <div className="selected-date-display">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("nl-NL", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {selectedDate === new Date().toISOString().split("T")[0] && (
                      <span className="today-badge">Vandaag</span>
                    )}
                    {isPastDateFromToday(selectedDate) &&
                      selectedDate !== new Date().toISOString().split("T")[0] && (
                        <span className="past-date-badge">Verleden</span>
                      )}
                  </div>
                </div>

                <div className="date-selector">
                  <label>Datum kiezen:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      const newDate = new Date(e.target.value);
                      setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth()));
                    }}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="form-sections">
                {/* BASIS */}
                <div className="form-section-card">
                  <h4>🍽️ Basisgegevens</h4>
                  <div className="form-row">
                    {renderOptionButtons("Voeding", ["Weinig", "Normaal", "Veel"], food, setFood)}
                    {renderOptionButtons("Eetlust", ["Slecht", "Normaal", "Goed", "Overmatig"], appetite, setAppetite)}
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label>💧 Water (ml)</label>
                      <input
                        type="number"
                        value={water}
                        onChange={(e) => {
                          setWater(e.target.value);
                          trackFieldChanged("water", e.target.value, "number", 500);
                        }}
                        placeholder="500"
                      />
                    </div>

                    <div className="input-group">
                      <label>💤 Slaap (uren)</label>
                      <input
                        type="number"
                        value={sleepHours}
                        onChange={(e) => {
                          setSleepHours(e.target.value);
                          trackFieldChanged("sleepHours", e.target.value, "number", 500);
                        }}
                        placeholder="8"
                      />
                    </div>
                  </div>
                </div>

                {/* ACTIVITEIT */}
                <div className="form-section-card">
                  <h4>🎾 Activiteit</h4>
                  <div className="form-row">
                    {renderOptionButtons("Energie", ["Laag", "Normaal", "Hoog"], energyLevel, setEnergyLevel)}
                    {renderOptionButtons("Gedrag", ["Actief", "Rustig", "Sloom", "Onrustig"], behavior, setBehavior)}
                  </div>

                  <div className="form-row">
                    <div className="input-group">
                      <label>🚶 Wandelingen</label>
                      <input
                        type="number"
                        value={walks}
                        onChange={(e) => {
                          setWalks(e.target.value);
                          trackFieldChanged("walks", e.target.value, "number", 500);
                        }}
                        placeholder="2"
                      />
                    </div>

                    <div className="input-group">
                      <label>🎾 Speeltijd (min)</label>
                      <input
                        type="number"
                        value={playtimeMinutes}
                        onChange={(e) => {
                          setPlaytimeMinutes(e.target.value);
                          trackFieldChanged("playtimeMinutes", e.target.value, "number", 500);
                        }}
                        placeholder="30"
                      />
                    </div>
                  </div>
                </div>

                {/* GEZONDHEID */}
                <div className="form-section-card">
                  <h4>🏥 Gezondheid</h4>
                  <div className="form-row">
                    {renderOptionButtons("Ontlasting", ["Geen", "Hard", "Normaal", "Zacht", "Diarree"], poop, setPoop)}
                    {renderOptionButtons("Emotie", ["Blij", "Neutraal", "Angstig", "Gestrest"], emotion, setEmotion)}
                  </div>

                  <div className="checkbox-grid">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={vomit}
                        onChange={(e) => {
                          setVomit(e.target.checked);
                          trackFieldChanged("vomit", e.target.checked, "boolean", 200);
                        }}
                      />
                      <span>🤮 Overgegeven</span>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={meds}
                        onChange={(e) => {
                          setMeds(e.target.checked);
                          trackFieldChanged("meds", e.target.checked, "boolean", 200);
                        }}
                      />
                      <span>💊 Medicatie</span>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={stressSignals}
                        onChange={(e) => {
                          setStressSignals(e.target.checked);
                          trackFieldChanged("stressSignals", e.target.checked, "boolean", 200);
                        }}
                      />
                      <span>😰 Stress-signalen</span>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={painSignals}
                        onChange={(e) => {
                          setPainSignals(e.target.checked);
                          trackFieldChanged("painSignals", e.target.checked, "boolean", 200);
                        }}
                      />
                      <span>🩹 Pijn-signalen</span>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={trainingDone}
                        onChange={(e) => {
                          setTrainingDone(e.target.checked);
                          trackFieldChanged("trainingDone", e.target.checked, "boolean", 200);
                        }}
                      />
                      <span>🎓 Training gedaan</span>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={leftAloneTooLong}
                        onChange={(e) => {
                          setLeftAloneTooLong(e.target.checked);
                          trackFieldChanged("leftAloneTooLong", e.target.checked, "boolean", 200);
                        }}
                      />
                      <span>⏰ Te lang alleen</span>
                    </label>
                  </div>
                </div>

                {/* ZORGEN */}
                <div className="form-section-card">
                  <h4>❤️ Zorgen</h4>
                  {renderOptionButtons("Maak je je zorgen?", ["Nee", "Een beetje", "Ja", "Veel"], ownerConcern, setOwnerConcern)}

                  <div className="form-row">
                    <div className="input-group">
                      <label>🏠 Alleen thuis (uren)</label>
                      <input
                        type="number"
                        value={aloneHours}
                        onChange={(e) => {
                          setAloneHours(e.target.value);
                          trackFieldChanged("aloneHours", e.target.value, "number", 500);
                        }}
                        placeholder="4"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "⏳ Bezig met opslaan..." : "✅ Opslaan"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
