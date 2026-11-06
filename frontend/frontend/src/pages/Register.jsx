import { Link, useNavigate } from "react-router-dom";
import { UserPlus, ArrowLeft } from "lucide-react";
import { useState } from "react";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Temporary registration.
    // Backend registration will be connected later.

    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">

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
            Create your RoadPulse account.
          </p>

        </div>

        {/* Register Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl"
        >

          {/* Icon */}
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

          {/* Full Name */}
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
              required
            />

          </div>

          {/* Email */}
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
              required
            />

          </div>

          {/* Phone */}
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
            />

          </div>

          {/* Password */}
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
              required
            />

          </div>

          {/* Confirm Password */}
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
              required
            />

          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="w-full mt-7 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold transition"
          >
            Create Account
          </button>

          {/* Login */}
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