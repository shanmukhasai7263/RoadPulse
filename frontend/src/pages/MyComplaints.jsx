
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  MapPin,
  CalendarDays,
  ClipboardList,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

async function getRoadImageUrl(imageValue) {
  if (!imageValue) return null;

  try {
    let imagePath = imageValue.trim();

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      const parsedUrl = new URL(imagePath);
      const marker = "/storage/v1/object/";
      const markerIndex = parsedUrl.pathname.indexOf(marker);

      if (markerIndex === -1) return imagePath;

      imagePath = parsedUrl.pathname.substring(
        markerIndex + marker.length
      );

      imagePath = imagePath.replace(
        /^(public|sign|authenticated)\//,
        ""
      );

      imagePath = imagePath.replace(/^road-reports\//, "");
      imagePath = decodeURIComponent(imagePath);
    }

    imagePath = imagePath.replace(/^\/+/, "");
    imagePath = imagePath.replace(/^road-reports\//, "");

    const { data, error } = await supabase.storage
      .from("road-reports")
      .createSignedUrl(imagePath, 3600);

    if (error) {
      console.error("Image loading error:", error.message);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Image URL error:", error);
    return null;
  }
}

function MyComplaints() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        // Get logged-in user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          navigate("/login");
          return;
        }

        // Fetch this user's complaints
        const { data, error: reportError } = await supabase
          .from("complaints")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (reportError) throw reportError;

        // Generate image URLs
        const reportsWithImages = await Promise.all(
          (data || []).map(async (report) => {
            const imageUrl = await getRoadImageUrl(
              report.image_url
            );

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
              address: report.address,
              createdAt: report.created_at,
            };
          })
        );

        if (isMounted) {
          setReports(reportsWithImages);
        }
      } catch (err) {
        console.error("My Complaints loading error:", err);

        if (isMounted) {
          setError(err.message || "Could not load your complaints.");
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

  const statusColors = {
    Pending: "bg-yellow-500/10 text-yellow-400",
    "In Progress": "bg-blue-500/10 text-blue-400",
    Resolved: "bg-green-500/10 text-green-400",
  };

  function confidencePercent(value) {
    const confidence = Number(value);

    if (!Number.isFinite(confidence)) return null;

    return Math.round(
      confidence <= 1 ? confidence * 100 : confidence
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="mt-8 mb-8">
          <div className="flex items-center gap-3">
            <ClipboardList size={30} className="text-blue-400" />

            <h1 className="text-3xl font-bold">
              My Complaints
            </h1>
          </div>

          <p className="text-slate-400 mt-2">
            View and track all your submitted road reports.
          </p>
        </div>

        {/* Report Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <p className="text-slate-400">
            Total Reports Submitted
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {reports.length}
          </h2>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-slate-900 rounded-xl p-10 text-center text-slate-400">
            Loading your complaints...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400">
            {error}
          </div>
        )}

        {/* Empty Reports */}
        {!loading && !error && reports.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <FileText
              size={55}
              className="mx-auto text-slate-600"
            />

            <h2 className="text-xl font-semibold mt-5">
              No Reports Found
            </h2>

            <p className="text-slate-400 mt-2">
              You haven't submitted any road reports yet.
            </p>

            <Link
              to="/capture"
              className="inline-block mt-6 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold"
            >
              Report a Road Hazard
            </Link>
          </div>
        )}

        {/* Reports List */}
        {!loading && !error && reports.length > 0 && (
          <div className="space-y-5">
            {reports.map((report) => {
              const confidence = confidencePercent(
                report.aiConfidence
              );

              return (
                <div
                  key={report.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5"
                >
                  <div className="flex flex-col sm:flex-row gap-5">

                    {/* Image */}
                    {report.image ? (
                      <img
                        src={report.image}
                        alt="Road hazard"
                        className="w-full sm:w-28 h-28 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full sm:w-28 h-28 rounded-lg bg-slate-800 flex items-center justify-center">
                        <FileText
                          size={35}
                          className="text-slate-500"
                        />
                      </div>
                    )}

                    {/* Information */}
                    <div className="flex-1 min-w-0">

                      <div className="flex flex-wrap justify-between gap-3">
                        <h2 className="text-lg font-bold capitalize">
                          {report.hazardType || "Road Hazard"}
                        </h2>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            statusColors[report.status] ||
                            "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>

                      <p className="text-slate-400 text-sm mt-2">
                        {report.description ||
                          "No description provided"}
                      </p>

                      <p className="text-slate-500 text-sm mt-3 flex items-start gap-2">
                        <MapPin size={16} className="shrink-0 mt-0.5" />
                        {report.address || "Location not provided"}
                      </p>

                      <p className="text-slate-500 text-sm mt-2 flex items-center gap-2">
                        <CalendarDays size={16} />
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleString()
                          : "Date not available"}
                      </p>

                      {report.aiDetected && (
                        <div className="text-blue-400 text-sm mt-3 space-y-1">
                          <p>AI Detected: Yes</p>

                          <p>
                            Confidence:{" "}
                            {confidence !== null
                              ? `${confidence}%`
                              : "Not available"}
                          </p>

                          <p>
                            Detected Objects:{" "}
                            {report.aiDetectedObjects}
                          </p>
                        </div>
                      )}

                      <Link
                        to={`/complaints/${report.id}`}
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mt-4 font-medium"
                      >
                        View Details
                        <ArrowRight size={17} />
                      </Link>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export default MyComplaints;
