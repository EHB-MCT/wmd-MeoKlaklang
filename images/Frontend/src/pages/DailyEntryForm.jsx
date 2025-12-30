import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DailyEntryForm.css";

export default function DailyEntryForm() {
  const navigate = useNavigate();
  
  /* =========================
     BASIS
  ========================= */
  const userId = localStorage.getItem("userId");
  const [dogs, setDogs] = useState([]);
  const [dogId, setDogId] = useState("");
  const [dogSelected, setDogSelected] = useState(false);
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [startTime] = useState(Date.now());
  const [hoveredOptions, setHoveredOptions] = useState([]);

  /* =========================
     DOG SELECTION HANDLER
  ========================= */
  const handleDogSelection = (e) => {
    const selectedDogId = e.target.value;
    setDogId(selectedDogId);
    setDogSelected(!!selectedDogId);
  };

  /* =========================
     PROGRESS CALCULATION
  ========================= */
  const calculateProgress = () => {
    const requiredFields = [food, poop, behavior, emotion];
    const optionalFields = [water, sleepHours, walks, playtimeMinutes, aloneHours];
    const checkboxFields = [vomit, meds, stressSignals, painSignals, trainingDone, leftAloneTooLong];
    
    const requiredFilled = requiredFields.filter(field => field && field !== "").length;
    const optionalFilled = optionalFields.filter(field => field && field !== "").length;
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
     CALENDAR FUNCTIONS
  ========================= */
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // Adjust for Monday-first week (getDay() returns 0 for Sunday, but we want Monday first)
    const firstDay = new Date(year, month, 1).getDay() === 0 ? 6 : new Date(year, month, 1).getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getDogEntryCount = (dogId) => {
    return entries.filter(entry => entry.dogId === dogId).length;
  };

  /* =========================
     CALENDAR NAVIGATION
  ========================= */
  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    if (!day) return;
    
    const newSelectedDate = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(newSelectedDate);
  };

  const hasEntryOnDate = (day, checkMonth = currentMonth, checkYear = currentMonth.getFullYear()) => {
    const dateStr = `${checkYear}-${String(checkMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entries.some(entry => 
      entry.dogId === dogId && entry.date === dateStr
    );
  };

  const isToday = (day) => {
    const today = new Date();
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const todayStr = today.toISOString().split('T')[0];
    return dateStr === todayStr;
  };

  const isPastDateFromToday = (date) => {
    const checkDate = new Date(date + 'T00:00:00');
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
    if (!day) return 'disabled';
    if (isToday(day)) return 'today';
    if (!isPastDate(day)) return 'future';
    return 'past';
  };

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
     SUBJECTIEVE ZORG (WEAPON)
  ========================= */
  const [ownerConcern, setOwnerConcern] = useState("");

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
     HOVER TRACKING
  ========================= */
  const handleHover = (value) => {
    if (!hoveredOptions.includes(value)) {
      setHoveredOptions((prev) => [...prev, value]);
    }
  };

  /* =========================
     OPTION BUTTONS
  ========================= */
  const renderOptionButtons = (label, options, selectedValue, setter) => (
    <div>
      <strong>{label}</strong>
      <div className="option-buttons">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setter(opt)}
            onMouseEnter={() => handleHover(opt)}
            className={`option-button ${selectedValue === opt ? "active" : ""}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dogId) {
      alert("Selecteer eerst een hond");
      return;
    }

    const timeOnPage = Date.now() - startTime;

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
      timeOnPage,
      emptyFields,
    };

    setLoading(true);
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fout bij opslaan");
      }

      alert("Dagelijkse log opgeslagen 🐾");
      
      // Reset form fields
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
      
      // Refresh entries to update calendar and stats
      const entriesResponse = await fetch(`/api/entries?userId=${userId}`);
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
        <button onClick={() => navigate("/daily-entry")} className="nav-btn active">📓 Logboek</button>
        <button onClick={() => navigate("/my-dogs")} className="nav-btn">🐕 Mijn dieren</button>
        <button onClick={() => navigate("/profile")} className="nav-btn">👤 Profiel</button>
        <button onClick={() => navigate("/notifications")} className="nav-btn">🔔 Meldingen</button>
      </nav>

      <div className="main-content">
        {/* LINKER KOLOM - OVERZICHT */}
        <div className="sidebar">
          {/* DOG OVERVIEW CARDS */}
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
                      className={`dog-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setDogId(dog._id);
                        setDogSelected(true);
                      }}
                    >
                      <div className="dog-avatar">
                        🐕
                      </div>
                      <div className="dog-info">
                        <h4>{dog.name}</h4>
                        <p>{dog.breed}</p>
                        <div className="dog-stats">
                          <span className="stat">
                            📊 {entryCount} entries
                          </span>
                          {dog.age && <span className="stat">🎂 {dog.age} jaar</span>}
                        </div>
                      </div>
                      <div className="dog-select-indicator">
                        {isSelected ? '✅' : '○'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RECENT ENTRIES & STATS */}
          {dogSelected && (
            <div className="recent-entries-section">
              <h3>📊 Recent voor {dogs.find(d => d._id === dogId)?.name}</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{getDogEntryCount(dogId)}</div>
                  <div className="stat-label">Totaal entries</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">
                    {entries.filter(e => e.dogId === dogId && e.date === new Date().toISOString().split('T')[0]).length}
                  </div>
                  <div className="stat-label">Vandaag</div>
                </div>
              </div>
              
              {/* ENHANCED CALENDAR */}
              <div className="calendar-section">
                <div className="calendar-nav">
                  <button onClick={handlePreviousMonth} className="calendar-nav-btn">‹</button>
                  <h4>📅 {currentMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}</h4>
                  <button onClick={handleNextMonth} className="calendar-nav-btn">›</button>
                </div>
                <div className="mini-calendar">
                  <div className="calendar-header">
                    {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                      <div key={day} className="calendar-day-header">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-grid">
                    {getDaysInMonth(currentMonth).map((day, index) => {
                      const isSelected = day === parseInt(selectedDate.split('-')[2]) && 
                                     currentMonth.getMonth() === new Date(selectedDate).getMonth() &&
                                     currentMonth.getFullYear() === new Date(selectedDate).getFullYear();
                      const hasEntry = day ? hasEntryOnDate(day) : false;
                      const today = day ? isToday(day) : false;
                      const status = day ? getDateStatus(day) : 'disabled';
                      const isClickable = day && isPastDate(day);
                      
                      return (
                        <div 
                          key={index} 
                          className={`calendar-day 
                            ${isSelected ? 'selected' : ''} 
                            ${today ? 'today' : ''} 
                            ${hasEntry ? 'has-entry' : ''} 
                            ${status === 'future' ? 'future' : ''}
                            ${isClickable ? 'clickable' : 'disabled'}`}
                          onClick={() => isClickable && handleDateClick(day)}
                          title={status === 'future' ? 'Toekomstige data niet beschikbaar' : ''}
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

        {/* RECHTER KOLOM - FORM */}
        <div className="form-section">
          {!dogSelected ? (
            <div className="select-dog-prompt">
              <div className="prompt-icon">🐾</div>
              <h3>Kies eerst een hond</h3>
              <p>Selecteer een hond aan de linkerkant om het dagboek in te vullen</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="enhanced-form">
              {/* PROGRESS INDICATOR */}
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
                      backgroundColor: getCompletionStatus().color 
                    }}
                  ></div>
                </div>
                <p className="progress-text" style={{ color: getCompletionStatus().color }}>
                  {getCompletionStatus().text}
                </p>
              </div>

              <div className="form-header-info">
                <div className="form-title">
                  <h3>📋 Invoeren voor {dogs.find(d => d._id === dogId)?.name}</h3>
                  <div className="selected-date-display">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('nl-NL', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                    {selectedDate === new Date().toISOString().split('T')[0] && (
                      <span className="today-badge">Vandaag</span>
                    )}
                    {isPastDateFromToday(selectedDate) && selectedDate !== new Date().toISOString().split('T')[0] && (
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
                      // Update calendar to show the selected month
                      const newDate = new Date(e.target.value);
                      setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth()));
                    }}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="form-sections">
                {/* BASIS SECTIE */}
                <div className="form-section-card">
                  <h4>🍽️ Basisgegevens</h4>
                  <div className="form-row">
                    {renderOptionButtons("Voeding", ["Weinig", "Normaal", "Veel"], food, setFood)}
                    {renderOptionButtons("Eetlust", ["Slecht", "Normaal", "Goed", "Overmatig"], appetite, setAppetite)}
                  </div>
                  <div className="form-row">
                    <div className="input-group">
                      <label>💧 Water (ml)</label>
                      <input type="number" value={water} onChange={(e) => setWater(e.target.value)} placeholder="500" />
                    </div>
                    <div className="input-group">
                      <label>💤 Slaap (uren)</label>
                      <input type="number" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="8" />
                    </div>
                  </div>
                </div>

                {/* ACTIVITEIT SECTIE */}
                <div className="form-section-card">
                  <h4>🎾 Activiteit</h4>
                  <div className="form-row">
                    {renderOptionButtons("Energie", ["Laag", "Normaal", "Hoog"], energyLevel, setEnergyLevel)}
                    {renderOptionButtons("Gedrag", ["Actief", "Rustig", "Sloom", "Onrustig"], behavior, setBehavior)}
                  </div>
                  <div className="form-row">
                    <div className="input-group">
                      <label>🚶 Wandelingen</label>
                      <input type="number" value={walks} onChange={(e) => setWalks(e.target.value)} placeholder="2" />
                    </div>
                    <div className="input-group">
                      <label>🎾 Speeltijd (min)</label>
                      <input type="number" value={playtimeMinutes} onChange={(e) => setPlaytimeMinutes(e.target.value)} placeholder="30" />
                    </div>
                  </div>
                </div>

                {/* GEZONDHEID SECTIE */}
                <div className="form-section-card">
                  <h4>🏥 Gezondheid</h4>
                  <div className="form-row">
                    {renderOptionButtons("Ontlasting", ["Geen", "Hard", "Normaal", "Zacht", "Diarree"], poop, setPoop)}
                    {renderOptionButtons("Emotie", ["Blij", "Neutraal", "Angstig", "Gestrest"], emotion, setEmotion)}
                  </div>
                  <div className="checkbox-grid">
                    <label className="checkbox-item">
                      <input type="checkbox" onChange={e => setVomit(e.target.checked)} />
                      <span>🤮 Overgegeven</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" onChange={e => setMeds(e.target.checked)} />
                      <span>💊 Medicatie</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" onChange={e => setStressSignals(e.target.checked)} />
                      <span>😰 Stress-signalen</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" onChange={e => setPainSignals(e.target.checked)} />
                      <span>🩹 Pijn-signalen</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" onChange={e => setTrainingDone(e.target.checked)} />
                      <span>🎓 Training gedaan</span>
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" onChange={e => setLeftAloneTooLong(e.target.checked)} />
                      <span>⏰ Te lang alleen</span>
                    </label>
                  </div>
                </div>

                {/* ZORGEN SECTIE */}
                <div className="form-section-card">
                  <h4>❤️ Zorgen</h4>
                  {renderOptionButtons("Maak je je zorgen?", ["Nee", "Een beetje", "Ja", "Veel"], ownerConcern, setOwnerConcern)}
                  <div className="form-row">
                    <div className="input-group">
                      <label>🏠 Alleen thuis (uren)</label>
                      <input type="number" value={aloneHours} onChange={(e) => setAloneHours(e.target.value)} placeholder="4" />
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
