import { Link } from "react-router-dom";
import {
  MapPin,
  ShieldCheck,
  Camera,
  ArrowRight,
} from "lucide-react";

function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800">

        <Link to="/" className="text-2xl font-bold">
          Road<span className="text-blue-400">Pulse</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>
        </div>

        <div className="flex gap-3">

          <Link
            to="/login"
            className="px-5 py-2 rounded-lg border border-slate-700 hover:bg-slate-800"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600"
          >
            Register
          </Link>

        </div>

      </nav>

      {/* Hero */}
      <section className="px-8 py-24 max-w-7xl mx-auto">

        <div className="max-w-3xl">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 mb-6">
            <ShieldCheck size={18} />
            Smart Road Safety Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">

            Make every road
            <span className="text-blue-400">
              {" "}safer.
            </span>

          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-2xl">

            RoadPulse helps citizens report potholes and dangerous
            road conditions, while intelligent mapping helps authorities
            identify and prioritize road safety problems.

          </p>

          <div className="flex flex-wrap gap-4 mt-10">

            <Link
              to="/login"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-medium"
            >
              Report a Road Hazard
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/map"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 hover:bg-slate-800"
            >
              <MapPin size={18} />
              Explore Map
            </Link>

          </div>

        </div>

      </section>

      {/* Features */}
      <section
        id="features"
        className="px-8 py-20 bg-slate-900"
      >

        <div className="max-w-7xl mx-auto">

          <h2 className="text-3xl font-bold">
            One platform. Complete road awareness.
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-10">

            <FeatureCard
              icon={<Camera />}
              title="Capture & Report"
              text="Capture a pothole and automatically associate it with its location."
            />

            <FeatureCard
              icon={<MapPin />}
              title="Live Road Map"
              text="Identify potholes and dangerous road zones on an interactive map."
            />

            <FeatureCard
              icon={<ShieldCheck />}
              title="Intelligent Safety"
              text="Use road-risk information to help users choose safer routes."
            />

          </div>

        </div>

      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="px-8 py-20"
      >

        <div className="max-w-5xl mx-auto text-center">

          <h2 className="text-3xl font-bold">
            How RoadPulse Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8 mt-12">

            <Step number="01" title="Capture" />
            <Step number="02" title="Locate" />
            <Step number="03" title="Report" />
            <Step number="04" title="Resolve" />

          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-8 py-8 text-center text-slate-500">
        © 2026 RoadPulse. Smart roads, safer journeys.
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">

      <div className="text-blue-400 mb-4">
        {icon}
      </div>

      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-slate-400">
        {text}
      </p>

    </div>
  );
}

function Step({ number, title }) {
  return (
    <div>

      <div className="text-blue-400 text-sm font-semibold">
        {number}
      </div>

      <div className="mt-2 text-xl font-semibold">
        {title}
      </div>

    </div>
  );
}

export default Home;