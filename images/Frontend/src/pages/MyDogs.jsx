import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEventTracker } from "../hooks/useEventTracker";
import "./MyDogs.css";

export default function MyDogs() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const { trackFormField, trackFormSubmit, trackNavigation } = useEventTracker();

  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingDog, setEditingDog] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [foodType, setFoodType] = useState("");
  const [toys, setToys] = useState("");
  const [notes, setNotes] = useState("");

  /* =========================
     DOGS OPHALEN
  ========================= */
  useEffect(() => {
    if (!userId) return;

    fetch(`http://localhost:5002/api/dogs/${userId}`)
      .then((res) => res.json())
      .then((data) => setDogs(data))
      .catch((err) => console.error(err));
  }, [userId]);

  /* =========================
     FORM CONTROLS
  ========================= */
  const resetForm = () => {
    setName("");
    setBreed("");
    setAge("");
    setWeight("");
    setFoodType("");
    setToys("");
    setNotes("");
    setEditingDog(null);
  };

  const editDog = (dog) => {
    setEditingDog(dog);
    setName(dog.name);
    setBreed(dog.breed);
    setAge(dog.age || "");
    setWeight(dog.weight || "");
    setFoodType(dog.foodType || "");
    setToys(dog.toys ? dog.toys.join(", ") : "");
    setNotes(dog.notes || "");
  };

  const deleteDog = async (dogId) => {
    if (!confirm("Weet je zeker dat je deze hond wilt verwijderen?")) return;

    try {
      const res = await fetch(`http://localhost:5002/api/dogs/${dogId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Fout bij verwijderen hond");
      }

      setDogs(prev => prev.filter(d => d._id !== dogId));
    } catch (err) {
      console.error("Error deleting dog:", err);
      alert(`Fout bij verwijderen hond: ${err.message}`);
    }
  };

  /* =========================
     SUBMIT NIEUWE/UPDATE HOND
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !breed) {
      alert("Naam en ras zijn verplicht");
      return;
    }

    setLoading(true);
    const dogData = {
      userId,
      name,
      breed,
      age: age ? Number(age) : null,
      weight: weight ? Number(weight) : null,
      foodType,
      toys: toys.split(",").map((t) => t.trim()).filter(t => t),
      notes,
    };

    try {
      let res;
      if (editingDog) {
        // Update existing dog
        res = await fetch(`http://localhost:5002/api/dogs/${editingDog._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dogData),
        });
      } else {
        // Add new dog
        res = await fetch("http://localhost:5002/api/dogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dogData),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Fout bij opslaan hond");
      }

      const data = await res.json();
      
      if (editingDog) {
        // Update the dog in state with the response data
        setDogs(prev => prev.map(d => d._id === editingDog._id ? data : d));
      } else {
        setDogs(prev => [...prev, data]);
      }

      resetForm();
      alert(editingDog ? "Hond bijgewerkt! 🐕" : "Hond toegevoegd! 🐕");
    } catch (err) {
      console.error("Error saving dog:", err);
      alert(`Fout bij opslaan hond: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="enhanced-my-dogs-container">
      {/* HEADER */}
      <header className="page-header">
        <h1>🐕 Mijn Honden</h1>
        <p className="subtitle">Beheer je hondenprofielen en dagboekgegevens</p>
      </header>

      {/* NAVIGATIE */}
        <nav className="nav-bar">
          <button onClick={() => trackNavigation("/my-dogs", "/my-dogs")}>🐕 Mijn dieren</button>
          <button onClick={() => trackNavigation("/my-dogs", "/daily-entry")}>📓 Logboek</button>
          <button className="active">🐕 Mijn dieren</button>
          <button onClick={() => trackNavigation("/my-dogs", "/dashboard")}>📈 Dashboard</button>
          <button onClick={() => trackNavigation("/my-dogs", "/profile")}>👤 Profiel</button>
          <button onClick={() => trackNavigation("/my-dogs", "/analytics")}>📊 Analyse</button>
        </nav>

      <div className="main-content">
        {/* DOGS OVERVIEW */}
        <section className="dogs-overview">
          <div className="section-header">
            <h2>🐾 Hondenprofielen</h2>
            <span className="dog-count">{dogs.length} hond{dogs.length !== 1 ? 'en' : ''}</span>
          </div>

          {dogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🐕</div>
              <h3>Geen honden toegevoegd</h3>
              <p>Voeg je eerste hond toe om het dagboek te kunnen gebruiken</p>
              <button 
                onClick={() => document.querySelector('.dog-form-section').scrollIntoView({ behavior: 'smooth' })}
                className="cta-button"
              >
                ➕ Eerste hond toevoegen
              </button>
            </div>
          ) : (
            <div className="dogs-grid">
              {dogs.map((dog) => (
                <div key={dog._id} className="dog-profile-card">
                  <div className="dog-card-header">
                    <div className="dog-avatar">
                      {dog.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="dog-status">
                      <span className="status-dot"></span>
                    </div>
                  </div>
                  
                  <div className="dog-info">
                    <h3>{dog.name}</h3>
                    <p className="breed">{dog.breed}</p>
                    
                    <div className="dog-details">
                      {dog.age && (
                        <div className="detail-item">
                          <span className="detail-icon">🎂</span>
                          <span>{dog.age} jaar</span>
                        </div>
                      )}
                      {dog.weight && (
                        <div className="detail-item">
                          <span className="detail-icon">⚖️</span>
                          <span>{dog.weight} kg</span>
                        </div>
                      )}
                    </div>
                    
                    {dog.toys && dog.toys.length > 0 && (
                      <div className="toys-section">
                        <span className="toys-label">Speeltjes:</span>
                        <div className="toys-list">
                          {dog.toys.slice(0, 3).map((toy, index) => (
                            <span key={index} className="toy-tag">{toy}</span>
                          ))}
                          {dog.toys.length > 3 && (
                            <span className="toy-tag more">+{dog.toys.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {dog.notes && (
                      <div className="notes-section">
                        <span className="notes-label">Opmerkingen:</span>
                        <p className="notes-text">{dog.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="dog-actions">
                    <button 
                      onClick={() => editDog(dog)}
                      className="action-btn edit-btn"
                      title="Bewerken"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => navigate(`/daily-entry?dogId=${dog._id}`)}
                      className="action-btn log-btn"
                      title="Logboek invullen"
                    >
                      📝
                    </button>
                    <button 
                      onClick={() => deleteDog(dog._id)}
                      className="action-btn delete-btn"
                      title="Verwijderen"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FORM SECTION */}
        <section className="dog-form-section">
          <div className="form-header">
            <h2>{editingDog ? '✏️ Hond bewerken' : '➕ Nieuwe hond toevoegen'}</h2>
            {editingDog && (
              <button 
                onClick={resetForm}
                className="cancel-btn"
              >
                Annuleren
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="enhanced-dog-form">
            <div className="form-grid">
              <div className="form-column">
                <div className="form-group">
                  <label className="form-label">Naam *</label>
                  <input 
                    type="text"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="form-input"
                    placeholder="Bijv: Max"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ras *</label>
                  <input 
                    type="text"
                    value={breed} 
                    onChange={(e) => setBreed(e.target.value)} 
                    className="form-input"
                    placeholder="Bijv: Golden Retriever"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Leeftijd (jaren)</label>
                    <input 
                      type="number"
                      value={age} 
                      onChange={(e) => setAge(e.target.value)} 
                      className="form-input"
                      placeholder="5"
                      min="0"
                      max="30"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gewicht (kg)</label>
                    <input 
                      type="number"
                      value={weight} 
                      onChange={(e) => setWeight(e.target.value)} 
                      className="form-input"
                      placeholder="25"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              <div className="form-column">
                <div className="form-group">
                  <label className="form-label">Voeding</label>
                  <input 
                    type="text"
                    value={foodType} 
                    onChange={(e) => setFoodType(e.target.value)} 
                    className="form-input"
                    placeholder="Bijv: Royal Canin, brokken"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Speeltjes (komma-gescheiden)</label>
                  <textarea 
                    value={toys} 
                    onChange={(e) => setToys(e.target.value)} 
                    className="form-textarea"
                    placeholder="Bijv: bal, knuffel, frisbee"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Extra opmerkingen</label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    className="form-textarea"
                    placeholder="Bijv: allergieën, speciale behoeften..."
                    rows="4"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={resetForm}
                className="secondary-btn"
              >
                Wissen
              </button>
              <button 
                type="submit" 
                className="primary-btn"
                disabled={loading}
              >
                {loading ? '⏳ Opslaan...' : (editingDog ? '✅ Bewerken' : '➕ Toevoegen')}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
