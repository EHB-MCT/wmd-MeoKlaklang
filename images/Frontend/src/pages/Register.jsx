import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/users/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("✅ Account aangemaakt!");
      setTimeout(() => {
        navigate("/daily-entry");
      }, 1000);
    } else {
      setMessage(`❌ Fout: ${data.error}`);
    }
  }

  return (
    <div>
      <h2>Registreer</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Naam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <br />
        <input
          type="password"
          placeholder="Wachtwoord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit">Account aanmaken</button>
      </form>
      <p>{message}</p>
      <p>
        Heb je al een account?{" "}
        <Link to="/login">
          <button>Inloggen</button>
        </Link>
      </p>
    </div>
  );
}
