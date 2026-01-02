import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
	const [name, setName] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const navigate = useNavigate();

	async function handleLogin(e) {
		e.preventDefault();

		const res = await fetch("/api/users/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name, password }),
		});

		const data = await res.json();

		if (res.ok) {
			// ⬅️ BELOANGRIJK: USER ID & ROLE OPSLAAN
			const userId = data._id;
			localStorage.setItem("userId", userId);
			localStorage.setItem("userUID", `uid_${userId}`); // Always match current user
			localStorage.setItem("userName", data.name);
			localStorage.setItem("userRole", data.role || 'user');
			
			// Generate frontend sessionId
			const sessionId = `session_${Math.random().toString(36).slice(2)}_${Date.now()}`;
			localStorage.setItem("sessionId", sessionId);
			
			// Store backend sessionId if returned (for cookie consistency)
			if (data.sessionId) {
				localStorage.setItem("backendSessionId", data.sessionId);
			}
			
			console.log('🔑 Login successful:', { userId, userUID: `uid_${userId}`, sessionId });
			
			setMessage(`✅ Welkom, ${data.name}`);
			setTimeout(() => {
				navigate("/my-dogs");
			}, 1000);
		} else {
			setMessage(`❌ Fout: ${data.error}`);
		}
	}

	return (
		<div className="login-container">
			<div className="login-header">
				<h1>🔐 Login</h1>
				<p>Welkom terug! Log in op je account</p>
			</div>

			<form onSubmit={handleLogin} className="login-form">
				<div className="form-group">
					<label htmlFor="name">Gebruikersnaam</label>
					<input
						type="text"
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Voer je gebruikersnaam in"
						required
					/>
				</div>

				<div className="form-group">
					<label htmlFor="password">Wachtwoord</label>
					<input
						type="password"
						id="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Voer je wachtwoord in"
						required
					/>
				</div>

				<button type="submit" className="submit-button">
					Inloggen
				</button>
			</form>

			{message && (
				<div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
					{message}
				</div>
			)}

			<div className="register-link">
				Nog geen account?{" "}
				<Link to="/register">
					Registreer hier
				</Link>
			</div>
		</div>
	);
}
