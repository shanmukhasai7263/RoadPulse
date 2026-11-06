
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Bot,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

// Convert a stored image path into a displayable URL.
async function getRoadImageUrl(imageValue) {
  if (!imageValue) return null;

  try {
    let imagePath = imageValue.trim();

    // Keep external URLs, such as your FastAPI annotated-image URL.
    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      const parsedUrl = new URL(imagePath);
      const marker = "/storage/v1/object/";
      const markerIndex = parsedUrl.pathname.indexOf(marker);

      if (markerIndex === -1) {
        return imagePath;
      }

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

    if (!imagePath) return null;

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

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        // 1. Get logged-in user.
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          navigate("/login");
          return;
        }

        // 2. Fetch the selected complaint.
        const { data, error: reportError } = await supabase
          .from("complaints")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (reportError) throw reportError;

        // 3. Load original and annotated images.
        const imageUrl = await getRoadImageUrl(data.image_url);

        const annotatedImageUrl = await getRoadImageUrl(
          data.annotated_image_url
        );

        if (!isMounted) return;

        setReport({
          ...data,
          image: imageUrl,
          aiAnnotatedImage: annotatedImageUrl,
          hazardType: data.hazard_type,
          aiDetected: data.ai_detected,
          aiConfidence: Number(data.ai_confidence || 0),
          aiDetectedObjects: data.ai_detected_objects,
          status: data.status || "Pending",
          createdAt: data.created_at,
          address: data.address,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
        });
      } catch (err) {
        console.error("Complaint details error:", err);

        if (isMounted) {
          setError(
            err.message || "Could not load complaint details."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading complaint details...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-10">
        <h1 className="text-3xl font-bold">
          {error ? "Unable to Load Report" : "Report Not Found"}
        </h1>

        {error && (
          <p className="text-red-400 mt-3">{error}</p>
        )}

        <Link
          to="/dashboard"
          className="text-blue-400 mt-4 inline-flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const status = report.status;

  const statusColors = {
    Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "In Progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const confidence = Number(report.aiConfidence);

  const confidencePercent = Number.isFinite(confidence)
    ? `${Math.round(
        confidence <= 1 ? confidence * 100 : confidence
      )}%`
    : "Not available";

  const coordinates = report.location || {};

  const hasCoordinates =
    coordinates.latitude != null &&
    coordinates.longitude != null;

  const progressSteps = [
    "Pending",
    "In Progress",
    "Resolved",
  ];

  const currentStep = progressSteps.indexOf(status);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        <Link
          to="/complaints"
          className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to My Complaints
        </Link>

        {/* Heading */}
        <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Road Report Details
            </h1>

            <p className="text-slate-400 mt-2">
              Report ID: {report.id}
            </p>
          </div>

          <span
            className={`px-4 py-2 rounded-full border text-sm font-semibold ${
              statusColors[status] ||
              "bg-slate-700 text-slate-200 border-slate-600"
            }`}
          >
            {status}
          </span>
        </div>

        {/* Original Image */}
        <div className="mt-6 bg-slate-900 p-5 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">
            Report Image
          </h2>

          {report.image ? (
            <img
              src={report.image}
              alt="Reported road hazard"
              className="w-full max-h-[450px] object-contain rounded-lg bg-slate-950"
            />
          ) : (
            <p className="text-slate-400">
              No report image available.
            </p>
          )}
        </div>

        {/* Report Information */}
        <div className="mt-6 bg-slate-900 p-5 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText size={21} />
            Report Information
          </h2>

          <p className="mt-3">
            <strong>Hazard Type:</strong>{" "}
            {report.hazardType || "Not specified"}
          </p>

          <p className="mt-3">
            <strong>Description:</strong>{" "}
            {report.description || "No description provided"}
          </p>

          <p className="mt-3">
            <strong>Address:</strong>{" "}
            {report.address || "Location not provided"}
          </p>

          <p className="mt-3 flex items-center gap-2">
            <Calendar size={18} className="text-blue-400" />
            <strong>Submitted:</strong>{" "}
            {report.createdAt
              ? new Date(report.createdAt).toLocaleString()
              : "Date not available"}
          </p>

          {hasCoordinates && (
            <p className="mt-3 flex items-center gap-2">
              <MapPin size={18} className="text-blue-400" />
              <strong>GPS:</strong>{" "}
              {coordinates.latitude}, {coordinates.longitude}
            </p>
          )}
        </div>

        {/* Complaint Progress */}
        <div className="mt-6 bg-slate-900 p-5 rounded-xl">
          <h2 className="text-xl font-semibold mb-5">
            Complaint Progress
          </h2>

          <div className="space-y-5">
            {progressSteps.map((step, index) => {
              const completed =
                currentStep >= 0 && index <= currentStep;

              return (
                <div
                  key={step}
                  className="flex items-center gap-3"
                >
                  {completed ? (
                    <CheckCircle
                      className="text-green-400"
                      size={23}
                    />
                  ) : (
                    <Clock
                      className="text-slate-500"
                      size={23}
                    />
                  )}

                  <span
                    className={
                      completed
                        ? "text-white font-medium"
                        : "text-slate-500"
                    }
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-slate-400 text-sm mt-5">
            The progress shown reflects the latest status updated by the administrator.
          </p>
        </div>

        {/* AI Detection */}
        {report.aiDetected && (
          <div className="mt-6 bg-slate-900 p-5 rounded-xl border border-blue-500/30">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bot className="text-blue-400" size={23} />
              AI Detection Result
            </h2>

            <p className="mt-4">
              AI Detected:{" "}
              <span className="text-green-400 font-semibold">
                Yes
              </span>
            </p>

            <p className="mt-3">
              Confidence:{" "}
              <span className="text-blue-400 font-semibold">
                {confidencePercent}
              </span>
            </p>

            <p className="mt-3">
              Detected Objects:{" "}
              {Array.isArray(report.aiDetectedObjects)
                ? report.aiDetectedObjects.length
                : report.aiDetectedObjects &&
                  typeof report.aiDetectedObjects === "object"
                ? Object.keys(report.aiDetectedObjects).length
                : report.aiDetectedObjects ?? "Not available"}
            </p>

            {report.aiAnnotatedImage && (
              <div className="mt-5">
                <h3 className="text-lg font-semibold mb-3">
                  AI Detection Image
                </h3>

                <img
                  src={report.aiAnnotatedImage}
                  alt="AI detection result"
                  className="w-full rounded-lg border border-slate-700"
                />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default ComplaintDetails;
