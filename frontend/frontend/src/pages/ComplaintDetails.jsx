import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function ComplaintDetails() {
  const { id } = useParams();

  const [report, setReport] = useState(null);

  useEffect(() => {
    const reports = JSON.parse(
      localStorage.getItem("roadpulse_reports") || "[]"
    );

    const foundReport = reports.find(
      (item) => String(item.id) === String(id)
    );

    setReport(foundReport);
  }, [id]);

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-10">
        <h1 className="text-3xl font-bold">
          Report Not Found
        </h1>

        <Link
          to="/dashboard"
          className="text-blue-400 mt-4 inline-block"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      <div className="max-w-4xl mx-auto">

        <Link
          to="/dashboard"
          className="text-blue-400"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mt-6">
          Road Report Details
        </h1>

        {/* Original Image */}

        <div className="mt-6 bg-slate-900 p-5 rounded-xl">

          <h2 className="text-xl font-semibold mb-4">
            Report Image
          </h2>

          <img
            src={report.image}
            alt="Road hazard"
            className="w-full rounded-lg"
          />

        </div>


        {/* Basic Details */}

        <div className="mt-6 bg-slate-900 p-5 rounded-xl">

          <h2 className="text-xl font-semibold mb-4">
            Report Information
          </h2>

          <p className="mt-2">
            <strong>Hazard Type:</strong>{" "}
            {report.hazardType}
          </p>

          <p className="mt-2">
            <strong>Status:</strong>{" "}
            {report.status}
          </p>

          <p className="mt-2">
            <strong>Description:</strong>{" "}
            {report.description || "No description provided"}
          </p>

          <p className="mt-2">
            <strong>Address:</strong>{" "}
            {report.address || "Location not provided"}
          </p>

        </div>


        {/* AI Result */}

        {report.aiDetected && (
          <div className="mt-6 bg-slate-900 p-5 rounded-xl border border-blue-500/30">

            <h2 className="text-xl font-semibold">
              🤖 AI Detection Result
            </h2>

            <p className="mt-3">
              Pothole Detected:{" "}
              <span className="text-green-400">
                Yes
              </span>
            </p>

            <p className="mt-2">
              Confidence:{" "}
              <span className="text-blue-400">
                {(report.aiConfidence * 100).toFixed(0)}%
              </span>
            </p>

            <p className="mt-2">
              Detected Objects:{" "}
              <span className="text-white">
                {report.aiDetectedObjects}
              </span>
            </p>

            {/* Annotated Image */}

            {report.aiAnnotatedImage && (
              <div className="mt-5">

                <h3 className="text-lg font-semibold mb-3">
                  AI Detection Image
                </h3>

                <img
                  src={report.aiAnnotatedImage}
                  alt="AI detected potholes"
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