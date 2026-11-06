
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  Camera,
  MapPin,
  FileWarning,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserRound,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";


async function getRoadImageUrl(imageValue) {
  if (!imageValue) return null;

  try {
    let imagePath = imageValue.trim();

    // Handle complete Supabase Storage URLs.
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      const parsedUrl = new URL(imagePath);

      const marker = "/storage/v1/object/";
      const markerIndex = parsedUrl.pathname.indexOf(marker);

      if (markerIndex === -1) {
        return imagePath;
      }

      let storagePath = parsedUrl.pathname.substring(
        markerIndex + marker.length
      );

      // Remove public, sign or authenticated URL prefix.
      storagePath = storagePath.replace(
        /^(public|sign|authenticated)\//,
        ""
      );

      // Remove bucket name.
      storagePath = storagePath.replace(/^road-reports\//, "");

      imagePath = decodeURIComponent(storagePath);
    }

    // Remove accidental bucket prefix from stored paths.
    imagePath = imagePath.replace(/^\/+/, "");
    imagePath = imagePath.replace(/^road-reports\//, "");

    if (!imagePath || imagePath.startsWith("data:")) {
      return imagePath.startsWith("data:") ? imagePath : null;
    }

    const { data, error } = await supabase.storage
      .from("road-reports")
      .createSignedUrl(imagePath, 3600);

    if (error) {
      console.error("Could not load road image:", error.message);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Image URL processing error:", error);
    return null;
  }
}


function Dashboard() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("User");

  const [profileOpen, setProfileOpen] = useState(false);
const [editProfileOpen, setEditProfileOpen] = useState(false);
const [editName, setEditName] = useState("");
const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        // 1. Get the currently logged-in user.
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          navigate("/login");
          return;
        }

        if (!isMounted) return;

        setUserName(
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User"
        );

        // 2. Fetch this user's complaints from Supabase.
        const { data, error: reportError } = await supabase
          .from("complaints")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (reportError) throw reportError;

        
// 3. Generate temporary URLs for Storage images.

const reportsWithImages = await Promise.all(
  (data || []).map(async (report) => {
    const imageUrl = await getRoadImageUrl(report.image_url);

    let detectedObjects = report.ai_detected_objects;

    if (Array.isArray(detectedObjects)) {
      detectedObjects = detectedObjects.length;
    } else if (
      detectedObjects &&
      typeof detectedObjects === "object"
    ) {
      detectedObjects = Object.keys(detectedObjects).length;
    }

    return {
      ...report,
      image: imageUrl,
      hazardType: report.hazard_type,
      aiDetected: report.ai_detected,
      aiConfidence: Number(report.ai_confidence || 0),
      aiDetectedObjects: detectedObjects ?? 0,
      status: report.status || "Pending",
    };
  })
);

if (isMounted) {
  setReports(reportsWithImages);
}

      } catch (err) {
        console.error("Dashboard loading error:", err);

        if (isMounted) {
          setError(err.message || "Could not load your reports.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Report statistics
  const pendingCount = reports.filter(
    (report) => report.status === "Pending"
  ).length;

  const inProgressCount = reports.filter(
    (report) => report.status === "In Progress"
  ).length;

  const resolvedCount = reports.filter(
    (report) => report.status === "Resolved"
  ).length;

  // Status badge colors
  function statusStyle(status) {
    if (status === "Resolved") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "In Progress") {
      return "bg-blue-500/10 text-blue-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
  }

  function confidencePercent(value) {
    const confidence = Number(value);

    if (!Number.isFinite(confidence)) return 0;

    return Math.round(
      confidence <= 1 ? confidence * 100 : confidence
    );
  }

  async function handleLogout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  navigate("/login");
}

async function handleProfileUpdate() {
  if (!editName.trim()) {
    alert("Please enter your name.");
    return;
  }

  setSavingProfile(true);

  const { error } = await supabase.auth.updateUser({
    data: { full_name: editName.trim() },
  });

  setSavingProfile(false);

  if (error) {
    alert(error.message);
    return;
  }

  setUserName(editName.trim());
  setEditProfileOpen(false);
  alert("Profile updated successfully!");
}

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="text-2xl font-bold">
            Road<span className="text-blue-400">Pulse</span>
          </div>

          <div className="flex items-center gap-4 relative">

  <span className="text-slate-400 text-sm">
    Welcome, {userName}
  </span>

  <button
    onClick={() => setProfileOpen(!profileOpen)}
    className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold uppercase hover:bg-blue-600"
  >
    {userName.charAt(0)}
  </button>

  {profileOpen && (
    <div className="absolute right-0 top-14 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">

      <button
  onClick={() => {
    setProfileOpen(false);
    navigate("/edit-profile");
  }}
  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 rounded-t-xl"
>
  <UserRound size={18} />
  Edit Profile
</button>

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-700 rounded-b-xl"
      >
        <LogOut size={18} />
        Logout
      </button>

    </div>
  )}

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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

            <StatCard
              icon={<FileWarning size={22} />}
              title="Reports Submitted"
              value={reports.length}
            />

            <StatCard
              icon={<Clock size={22} />}
              title="Pending Reports"
              value={pendingCount}
            />

            <StatCard
              icon={<Clock size={22} />}
              title="In Progress Reports"
              value={inProgressCount}
            />

            <StatCard
              icon={<CheckCircle size={22} />}
              title="Resolved Reports"
              value={resolvedCount}
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

          {loading ? (

            <div className="mt-5 bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              Loading your reports...
            </div>

          ) : error ? (

            <div className="mt-5 bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400">
              {error}
            </div>

          ) : reports.length === 0 ? (

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

                    <div className="flex items-start gap-4 min-w-0">

                      {report.image && (
                        <img
                          src={report.image}
                          alt="Road hazard"
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}

                      <div className="min-w-0">

                        <h3 className="font-semibold capitalize">
                          {report.hazardType || "Road Hazard"}
                        </h3>

                        <p className="text-slate-400 text-sm mt-1">
                          {report.description}
                        </p>

                        {report.address && (
                          <p className="text-slate-500 text-sm mt-2">
                            📍 {report.address}
                          </p>
                        )}

                        {report.aiDetected && (
                          <div className="mt-2 text-sm text-blue-400">
                            🤖 AI Detected
                            <br />
                            Confidence: {confidencePercent(report.aiConfidence)}%
                            <br />
                            Detected Objects: {report.aiDetectedObjects}
                          </div>
                        )}

                        <Link
                          to={`/complaints/${report.id}`}
                          className="text-blue-400 hover:text-blue-300 mt-3 inline-block text-sm"
                        >
                          View Details →
                        </Link>

                      </div>

                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${statusStyle(
                        report.status
                      )}`}
                    >
                      {report.status}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>
      {editProfileOpen && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4">

    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Edit Profile</h2>

        <button onClick={() => setEditProfileOpen(false)}>
          <X />
        </button>
      </div>

      <label className="block text-sm text-slate-400 mb-2">
        Full Name
      </label>

      <input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
        placeholder="Enter your name"
      />

      <button
        onClick={handleProfileUpdate}
        disabled={savingProfile}
        className="w-full mt-5 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 font-semibold"
      >
        {savingProfile ? "Saving..." : "Save Changes"}
      </button>

    </div>

  </div>
)}
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
