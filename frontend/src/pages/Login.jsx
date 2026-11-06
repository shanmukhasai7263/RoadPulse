
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { supabase } from "../services/supabaseClient";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        setMessage("Login could not be completed. Please try again.");
        return;
      }

      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold">
            Road<span className="text-blue-400">Pulse</span>
          </Link>

          <p className="text-slate-400 mt-3">
            Welcome back to safer roads.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl"
        >
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
              autoComplete="email"
              required
            />
          </div>

          <div className="mt-5">
            <label className="text-sm text-slate-300">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {message && (
            <p className="mt-4 text-sm text-red-400">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-7 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 font-semibold transition"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

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
