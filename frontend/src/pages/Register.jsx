
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { supabase } from "../services/supabaseClient";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    if (form.password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            phone: form.phone.trim(),
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        navigate("/dashboard");
      } else {
        setMessage(
          "Registration successful! Please check your email and confirm your account before signing in."
        );
        setMessageType("success");
      }
    } catch (error) {
      setMessage(
        error.message || "Registration failed. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
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
            Create your RoadPulse account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-blue-500/10 text-blue-400">
              <UserPlus size={28} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center">
            Create Account
          </h1>

          <p className="text-center text-slate-500 mt-2 text-sm">
            Join RoadPulse and help make roads safer
          </p>

          <div className="mt-7">
            <label className="text-sm text-slate-300">
              Full Name
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="mt-4">
            <label className="text-sm text-slate-300">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="mt-4">
            <label className="text-sm text-slate-300">
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
              placeholder="Enter your phone number"
              autoComplete="tel"
            />
          </div>

          <div className="mt-4">
            <label className="text-sm text-slate-300">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="mt-4">
            <label className="text-sm text-slate-300">
              Confirm Password
            </label>

            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
          </div>

          {message && (
            <p
              className={`mt-4 text-sm ${
                messageType === "success"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-7 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 font-semibold transition"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-300"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
