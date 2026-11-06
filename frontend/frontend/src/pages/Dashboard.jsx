import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  Camera,
  MapPin,
  FileWarning,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";


function Dashboard() {
    const [reports, setReports] = useState([]);

  useEffect(() => {
    const savedReports = JSON.parse(
      localStorage.getItem("roadpulse_reports") || "[]"
    );

    setReports(savedReports);
  }, []);
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="text-2xl font-bold">
            Road<span className="text-blue-400">Pulse</span>
          </div>

          <div className="flex items-center gap-4">

            <span className="text-slate-400 text-sm">
              Welcome, User
            </span>

            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              U
            </div>

          </div>

        </div>

      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Heading */}
        <div className="mb-10">

          <h1 className="text-4xl font-bold">
            Dashboard
          </h1>

          <p className="text-slate-400 mt-2">
            Monitor roads, report hazards and track your complaints.
          </p>

        </div>

        {/* Quick Actions */}
        <section>

          <h2 className="text-xl font-semibold mb-5">
            Quick Actions
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            {/* Capture */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500 transition">

              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Camera size={25} />
              </div>

              <h3 className="text-lg font-semibold mt-5">
                Capture Road Hazard
              </h3>

              <p className="text-slate-400 text-sm mt-2">
                Capture a pothole or dangerous road condition using your camera.
              </p>

              <Link
  to="/capture"
  className="mt-5 flex items-center gap-2 text-blue-400"
>
  Start Capture
  <ArrowRight size={16} />
</Link>

            </div>

            {/* Map */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500 transition">

              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <MapPin size={25} />
              </div>

              <h3 className="text-lg font-semibold mt-5">
                Explore Road Map
              </h3>

              <p className="text-slate-400 text-sm mt-2">
                View reported potholes, hazards and road safety information.
              </p>

              <Link
  to="/map"
  className="mt-5 flex items-center gap-2 text-blue-400"
>
  Open Map
  <ArrowRight size={16} />
</Link>

            </div>

            {/* Road Safety Tips */}
<div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500 transition">

  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
    <ShieldCheck size={25} />
  </div>

  <h3 className="text-lg font-semibold mt-5">
    Road Safety Tips
  </h3>

  <p className="text-slate-400 text-sm mt-2">
    Learn essential driving precautions, understand road hazards,
    and follow safety recommendations for a safer journey.
  </p>

  <Link
    to="/safety"
    className="mt-5 flex items-center gap-2 text-blue-400 hover:text-blue-300"
  >
    View Safety Tips
    <ArrowRight size={16} />
  </Link>

</div>

          </div>

        </section>

        {/* Statistics */}

<section className="mt-12">

  <h2 className="text-xl font-semibold mb-5">
    Your Activity
  </h2>

  <div className="grid md:grid-cols-3 gap-5">

    <StatCard
      icon={<FileWarning size={22} />}
      title="Reports Submitted"
      value={reports.length}
    />

    <StatCard
      icon={<Clock size={22} />}
      title="Pending Reports"
      value={
        reports.filter(
          (report) => report.status === "Pending"
        ).length
      }
    />

    <StatCard
      icon={<CheckCircle size={22} />}
      title="Resolved Reports"
      value={
        reports.filter(
          (report) => report.status === "Resolved"
        ).length
      }
    />

  </div>

</section>

        {/* Recent Reports */}
<section className="mt-12">

  <div className="flex items-center justify-between">

    <h2 className="text-xl font-semibold">
      Recent Reports
    </h2>

    <Link
      to="/complaints"
      className="text-blue-400 text-sm hover:text-blue-300"
    >
      View All
    </Link>

  </div>

  {reports.length === 0 ? (

    <div className="mt-5 bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">

      <FileWarning
        size={40}
        className="mx-auto text-slate-600"
      />

      <p className="text-slate-400 mt-4">
        No road reports yet.
      </p>

      <p className="text-slate-500 text-sm mt-1">
        Create your first road hazard report.
      </p>

    </div>

  ) : (

    <div className="mt-5 space-y-4">

      {reports.slice(0, 5).map((report) => (

        <div
          key={report.id}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5"
        >

          <div className="flex items-start justify-between gap-4">

            <div className="flex items-start gap-4">

              {report.image && (
                <img
                  src={report.image}
                  alt="Road hazard"
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}

              <div>

                <h3 className="font-semibold capitalize">
                  {report.hazardType}
                </h3>

                <p className="text-slate-400 text-sm mt-1">
                  {report.description}
                </p>

                {report.address && (
                  <p className="text-slate-500 text-sm mt-2">
                    📍 {report.address}
                  </p>
                )}

              </div>

            </div>

            <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
              {report.status}
            </span>
            
            {report.aiDetected && (
  <div className="mt-2 text-sm text-blue-400">
    🤖 AI Detected: Pothole
    <br />
    Confidence: {(report.aiConfidence * 100).toFixed(0)}%
    <br />
    Detected Objects: {report.aiDetectedObjects}
  </div>
)}
<Link
  to={`/complaints/${report.id}`}
  className="text-blue-400 hover:text-blue-300 mt-3 inline-block"
>
  View Details →
</Link>

          </div>

        </div>

      ))}

    </div>

  )}

</section>

      </main>

    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">

      <div className="flex items-center justify-between">

        <div className="text-blue-400">
          {icon}
        </div>

        <span className="text-3xl font-bold">
          {value}
        </span>

      </div>

      <p className="text-slate-400 mt-4">
        {title}
      </p>

    </div>
  );
}

export default Dashboard;