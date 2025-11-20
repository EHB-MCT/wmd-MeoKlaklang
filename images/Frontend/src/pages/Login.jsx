import { useState } from "react";

export default function Login() {
	const [name, setName] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		try {
			const res = await fetch("http://localhost:5000/api/users/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name }),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "Something went wrong");
				return;
			}

			// Save user info
			localStorage.setItem("user", JSON.stringify(data));

			// redirect to home or dashboard
			window.location.href = "/daily-entry";
		} catch (err) {
			setError("Server error");
		}
	};

	return (
		<div>
			<h1>Login</h1>

			<form onSubmit={handleSubmit}>
				<input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />

				<button type="submit">Login</button>

				{error && <p style={{ color: "red" }}>{error}</p>}
			</form>
		</div>
	);
}
