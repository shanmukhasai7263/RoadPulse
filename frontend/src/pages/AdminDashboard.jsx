
import { useEffect, useState } from "react";
import {
  MoreVertical,
  Trash2,
  Clock,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

// Convert a stored Supabase image URL or path into a usable signed URL.
async function getRoadImageUrl(imageValue) {
  if (!imageValue) return null;

  try {
    let imagePath = imageValue.trim();

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      const parsedUrl = new URL(imagePath);
      const marker = "/storage/v1/object/";
      const markerIndex = parsedUrl.pathname.indexOf(marker);

      // External image URL, such as a local FastAPI result URL.
      if (markerIndex === -1) return imagePath;

      let storagePath = parsedUrl.pathname.substring(
        markerIndex + marker.length
      );

      storagePath = storagePath.replace(
        /^(public|sign|authenticated)\//,
        ""
      );

      storagePath = storagePath.replace(/^road-reports\//, "");
      imagePath = decodeURIComponent(storagePath);
    }

    imagePath = imagePath.replace(/^\/+/, "");
    imagePath = imagePath.replace(/^road-reports\//, "");

    if (!imagePath) return null;

    const { data, error } = await supabase.storage
      .from("road-reports")
      .createSignedUrl(imagePath, 3600);

    if (error) {
      console.error("Image URL error:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Image processing error:", error);
    return null;
  }
}

// Extract a storage object path from a Supabase URL or stored path.
function getStoragePath(imageValue) {
  if (!imageValue || typeof imageValue !== "string") return null;

  try {
    let imagePath = imageValue.trim();

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      const parsedUrl = new URL(imagePath);
      const marker = "/storage/v1/object/";
      const markerIndex = parsedUrl.pathname.indexOf(marker);

      // Do not attempt to delete external images.
      if (markerIndex === -1) return null;

      imagePath = parsedUrl.pathname.substring(
        markerIndex + marker.length
      );

      imagePath = imagePath.replace(
        /^(public|sign|authenticated)\//,
        ""
      );

      imagePath = decodeURIComponent(imagePath);
    }

    imagePath = imagePath.replace(/^\/+/, "");
    imagePath = imagePath.replace(/^road-reports\//, "");

    return imagePath || null;
  } catch (error) {
    console.error("Storage path error:", error);
    return null;
  }
}

function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Please log in to access the admin dashboard.");
      }

      if (user.app_metadata?.role !== "admin") {
        throw new Error("Access denied. Admin account required.");
      }

      const { data, error: fetchError } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const normalizedReports = await Promise.all(
        (data || []).map(async (report) => {
          const imageUrl = await getRoadImageUrl(report.image_url);
          const annotatedImageUrl = await getRoadImageUrl(
            report.annotated_image_url
          );

          return {
            ...report,
            status: report.status || "Pending",
            hazardType: report.hazard_type || "Road Hazard",
            image: imageUrl,
            annotatedImage: annotatedImageUrl,
            address: report.address || "",
            description: report.description || "",
            location:
              report.latitude != null && report.longitude != null
                ? {
                    latitude: report.latitude,
                    longitude: report.longitude,
                  }
                : null,
          };
        })
      );

      setReports(normalizedReports);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(err.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }

  async function updateReportStatus(id, newStatus) {
    try {
      setError("");

      const { data, error: updateError } = await supabase
        .from("complaints")
        .update({ status: newStatus })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      setReports((previousReports) =>
        previousReports.map((report) =>
          report.id === id
            ? { ...report, status: data.status }
            : report
        )
      );

      setOpenMenu(null);
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.message || "Could not update report status.");
    }
  }

  async function deleteReport(report) {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this report and its stored images?"
    );

    if (!confirmDelete) return;

    setDeletingId(report.id);
    setError("");

    try {
      // Collect original and AI-annotated image paths.
      const imagePaths = [
        getStoragePath(report.image_url),
        getStoragePath(report.annotated_image_url),
      ].filter(Boolean);

      // Remove duplicate paths, if any.
      const uniquePaths = [...new Set(imagePaths)];

      // Delete stored images first.
      if (uniquePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("road-reports")
          .remove(uniquePaths);

        if (storageError) {
          throw new Error(
            "Could not delete report images: " + storageError.message
          );
        }
      }

      // Delete the database record after image cleanup succeeds.
      const { error: databaseError } = await supabase
        .from("complaints")
        .delete()
        .eq("id", report.id);

      if (databaseError) {
        throw new Error(
          "Images were removed, but the report could not be deleted: " +
            databaseError.message
        );
      }

      setReports((previousReports) =>
        previousReports.filter((item) => item.id !== report.id)
      );

      setOpenMenu(null);
    } catch (err) {
      console.error("Delete report error:", err);
      setError(err.message || "Could not delete report.");
    } finally {
      setDeletingId(null);
    }
  }

  const pendingCount = reports.filter(
    (report) => report.status === "Pending"
  ).length;

  const inProgressCount = reports.filter(
    (report) => report.status === "In Progress"
  ).length;

  const resolvedCount = reports.filter(
    (report) => report.status === "Resolved"
  ).length;

  function statusStyle(status) {
    if (status === "Resolved") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "In Progress") {
      return "bg-blue-500/10 text-blue-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">
          RoadPulse Admin Dashboard
        </h1>

        <p className="text-slate-400 mt-2">
          Manage submitted road hazard reports.
        </p>

        {error && (
          <div className="mt-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 p-8 text-center text-slate-400">
            Loading reports...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {pendingCount}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400">In Progress</p>
                <p className="text-2xl font-bold text-blue-400">
                  {inProgressCount}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400">Resolved</p>
                <p className="text-2xl font-bold text-green-400">
                  {resolvedCount}
                </p>
              </div>
            </div>

            {reports.length === 0 ? (
              <div className="mt-8 p-8 bg-slate-900 border border-slate-800 rounded-xl text-center">
                <p className="text-slate-400">
                  No reports available.
                </p>
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="relative bg-slate-900 border border-slate-800 rounded-xl p-5"
                  >
                    <div className="absolute top-4 right-4">
                      <button
                        type="button"
                        disabled={deletingId === report.id}
                        onClick={() =>
                          setOpenMenu(
                            openMenu === report.id ? null : report.id
                          )
                        }
                        className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                        aria-label="Report actions"
                      >
                        <MoreVertical size={22} />
                      </button>

                      {openMenu === report.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden z-10">
                          {report.status !== "Pending" && (
                            <button
                              type="button"
                              onClick={() =>
                                updateReportStatus(report.id, "Pending")
                              }
                              className="w-full text-left px-4 py-3 hover:bg-slate-700"
                            >
                              Mark Pending
                            </button>
                          )}

                          {report.status !== "In Progress" && (
                            <button
                              type="button"
                              onClick={() =>
                                updateReportStatus(report.id, "In Progress")
                              }
                              className="w-full flex items-center gap-2 px-4 py-3 text-blue-400 hover:bg-slate-700"
                            >
                              <Clock size={17} />
                              Mark In Progress
                            </button>
                          )}

                          {report.status !== "Resolved" && (
                            <button
                              type="button"
                              onClick={() =>
                                updateReportStatus(report.id, "Resolved")
                              }
                              className="w-full flex items-center gap-2 px-4 py-3 text-green-400 hover:bg-slate-700"
                            >
                              <CheckCircle size={17} />
                              Mark Resolved
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={deletingId === report.id}
                            onClick={() => deleteReport(report)}
                            className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-slate-700 disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                            {deletingId === report.id
                              ? "Deleting..."
                              : "Delete Report"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-4 pr-10">
                      {report.image && (
                        <img
                          src={report.image}
                          alt="Road hazard"
                          className="w-28 h-28 rounded-lg object-cover"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-semibold capitalize">
                            {report.hazardType}
                          </h2>

                          <span
                            className={`px-3 py-1 rounded-full text-xs ${statusStyle(
                              report.status
                            )}`}
                          >
                            {report.status}
                          </span>
                        </div>

                        <p className="text-slate-400 mt-2">
                          {report.description}
                        </p>

                        {report.address && (
                          <p className="text-slate-400 mt-2">
                            📍 {report.address}
                          </p>
                        )}

                        {report.location && (
                          <p className="text-slate-500 text-sm mt-2">
                            Coordinates:{" "}
                            {Number(report.location.latitude).toFixed(6)},{" "}
                            {Number(report.location.longitude).toFixed(6)}
                          </p>
                        )}

                        {report.annotatedImage && (
                          <div className="mt-3">
                            <p className="text-slate-400 text-sm mb-2">
                              AI Detection Result
                            </p>
                            <img
                              src={report.annotatedImage}
                              alt="AI annotated road hazard"
                              className="w-40 h-32 rounded-lg object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
