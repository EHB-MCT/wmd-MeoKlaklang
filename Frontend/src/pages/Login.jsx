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
		<div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
						<span className="text-2xl">🐕</span>
					</div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						Sign in to your account
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Or{' '}
						<Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
							create a new account
						</Link>
					</p>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleLogin}>
					<div className="space-y-4">
						<div>
							<label htmlFor="name" className="block text-sm font-medium text-gray-700">
								Name
							</label>
							<input
								id="name"
								name="name"
								type="text"
								placeholder="Enter your name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								className="mt-1 input-field"
							/>
						</div>
						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-700">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								placeholder="Enter your password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="mt-1 input-field"
							/>
						</div>
					</div>

					{message && (
						<div className={`p-3 rounded-lg text-sm ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
							{message}
						</div>
					)}

					<div>
						<button type="submit" className="w-full btn-primary">
							Sign in
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
