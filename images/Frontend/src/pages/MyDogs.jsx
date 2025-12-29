import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MyDogs.css";

export default function MyDogs() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [dogs, setDogs] = useState([]);

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

    fetch(`http://localhost:5001/api/dogs/${userId}`)
      .then((res) => res.json())
      .then((data) => setDogs(data))
      .catch((err) => console.error(err));
  }, [userId]);

  /* =========================
     SUBMIT NIEUWE HOND
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !breed) {
      alert("Naam en ras zijn verplicht");
      return;
    }

    const newDog = {
      userId,
      name,
      breed,
      age,
      weight,
      foodType,
      toys: toys.split(",").map((t) => t.trim()),
      notes,
    };

    try {
      const res = await fetch("http://localhost:5001/api/dogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDog),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Fout bij opslaan hond");
      }

      const data = await res.json();
      setDogs((prev) => [...prev, data]);

      // reset form
      setName("");
      setBreed("");
      setAge("");
      setWeight("");
      setFoodType("");
      setToys("");
      setNotes("");
    } catch (err) {
      console.error("Error adding dog:", err);
      alert(`Fout bij opslaan hond: ${err.message}`);
    }
  };

  return (
    <div className="my-dogs-container">
      <h2>🐕 Mijn Dieren</h2>
      <p className="soft-warning">
        Voeg eerst je hond(en) toe om het dagboek te kunnen gebruiken.
      </p>

      {/* NAVIGATIE */}
      <div className="nav-buttons">
        <button onClick={() => navigate("/my-dogs")}>🐕 Mijn dieren</button>
        <button onClick={() => navigate("/daily-entry")}>📓 Logboek</button>
        <button onClick={() => navigate("/profile")}>👤 Profiel</button>
      </div>

      {/* BESTAANDE HONDEN */}
      {dogs.length > 0 && (
        <div className="dog-list">
          <h3>Je honden</h3>
          {dogs.map((dog) => (
            <div key={dog._id} className="dog-card">
              <strong>{dog.name}</strong>
              <span>{dog.breed}</span>
              {dog.age && <span>Leeftijd: {dog.age}</span>}
            </div>
          ))}
        </div>
      )}

      {/* NIEUWE HOND TOEVOEGEN */}
      <form onSubmit={handleSubmit} className="dog-form">
        <h3>➕ Hond toevoegen</h3>

        <label>
          Naam *
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Ras *
          <input value={breed} onChange={(e) => setBreed(e.target.value)} />
        </label>

        <label>
          Leeftijd (jaren)
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>

        <label>
          Gewicht (kg)
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>

        <label>
          Voeding
          <input value={foodType} onChange={(e) => setFoodType(e.target.value)} />
        </label>

        <label>
          Speeltjes (komma-gescheiden)
          <input value={toys} onChange={(e) => setToys(e.target.value)} />
        </label>

        <label>
          Extra opmerkingen
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <button type="submit">✅ Hond opslaan</button>
      </form>
    </div>
  );
}
