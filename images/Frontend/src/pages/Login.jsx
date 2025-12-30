import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEventTracker } from "../hooks/useEventTracker";

export default function Login() {
	const [name, setName] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const navigate = useNavigate();
	const { trackLoginAttempt, trackCustomEvent } = useEventTracker();

	async function handleLogin(e) {
		e.preventDefault();

		// Track login attempt
		trackLoginAttempt(name, false);

		const res = await fetch("http://localhost:5002/api/users/login", {
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

			// Track successful login
			trackLoginAttempt(name, true);
			
			// Track login form submission
			trackCustomEvent('form_submit', {
				formName: 'login',
				success: true,
				formData: { name: name.length > 0, password: password.length > 0 },
				fieldCount: 2
			});

			setMessage(`✅ Welkom, ${data.name}`);
			setTimeout(() => {
				navigate("/my-dogs");
			}, 1000);
		} else {
			// Track failed login
			trackLoginAttempt(name, false, data.error);
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
