import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(event) {
    event.preventDefault();

    // Temporary login
    // Backend authentication will be connected later.

    if (email && password) {
      navigate("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">

          <Link
            to="/"
            className="text-3xl font-bold"
          >
            Road<span className="text-blue-400">Pulse</span>
          </Link>

          <p className="text-slate-400 mt-3">
            Welcome back to safer roads.
          </p>

        </div>

        {/* Login Card */}
        <form
          onSubmit={handleLogin}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl"
        >

          {/* Icon */}
          <div className="flex justify-center mb-6">

            <div className="p-4 rounded-full bg-blue-500/10 text-blue-400">
              <ShieldCheck size={28} />
            </div>

          </div>

          <h1 className="text-2xl font-bold text-center">
            Sign in
          </h1>

          <p className="text-center text-slate-500 mt-2 text-sm">
            Access your RoadPulse account
          </p>

          {/* Email */}
          <div className="mt-8">

            <label className="text-sm text-slate-300">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
              placeholder="you@example.com"
              required
            />

          </div>

          {/* Password */}
          <div className="mt-5">

            <div className="flex justify-between items-center">

              <label className="text-sm text-slate-300">
                Password
              </label>

              <button
                type="button"
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Forgot password?
              </button>

            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
              placeholder="••••••••"
              required
            />

          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full mt-7 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold transition"
          >
            Sign In
          </button>

          {/* Register */}
          <p className="text-center text-sm text-slate-400 mt-6">

            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-blue-400 hover:text-blue-300"
            >
              Create one
            </Link>

          </p>

        </form>

      </div>

    </div>
  );
}

export default Login;