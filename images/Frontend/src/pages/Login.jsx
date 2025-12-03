import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
	const [name, setName] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const navigate = useNavigate();

	async function handleLogin(e) {
		e.preventDefault();

		const res = await fetch("http://localhost:5000/api/users/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name, password }),
		});

		const data = await res.json();

		if (res.ok) {
			// ⬅️ BELOANGRIJK: USER ID OPSLAAN
			localStorage.setItem("userId", data._id);
			localStorage.setItem("userName", data.name); // 👈 nieuw

			setMessage(`✅ Welkom, ${data.name}`);
			setTimeout(() => {
				navigate("/daily-entry");
			}, 1000);
		} else {
			setMessage(`❌ Fout: ${data.error}`);
		}
	}

	return (
		<div>
			<h2>Login</h2>
			<form onSubmit={handleLogin}>
				<input type="text" placeholder="Naam" value={name} onChange={(e) => setName(e.target.value)} required />
				<br />
				<input type="password" placeholder="Wachtwoord" value={password} onChange={(e) => setPassword(e.target.value)} required />
				<br />
				<button type="submit">Inloggen</button>
			</form>
			<p>{message}</p>

			<p>
				Nog geen account?{" "}
				<Link to="/register">
					<button>Registreer</button>
				</Link>
			</p>
		</div>
	);
}
