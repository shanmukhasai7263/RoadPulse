import { useEffect, useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";

function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  function loadReports() {
    const savedReports = JSON.parse(
      localStorage.getItem("roadpulse_reports") || "[]"
    );

    setReports(savedReports);
  }

  function deleteReport(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmDelete) {
      return;
    }

    const updatedReports = reports.filter(
      (report) => report.id !== id
    );

    localStorage.setItem(
      "roadpulse_reports",
      JSON.stringify(updatedReports)
    );

    setReports(updatedReports);
    setOpenMenu(null);
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

                {/* Three dot menu */}

                <div className="absolute top-4 right-4">

                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenu(
                        openMenu === report.id
                          ? null
                          : report.id
                      )
                    }
                    className="p-2 rounded-lg hover:bg-slate-800"
                  >
                    <MoreVertical size={22} />
                  </button>

                  {openMenu === report.id && (

                    <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden">

                      <button
                        type="button"
                        onClick={() => deleteReport(report.id)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-slate-700"
                      >
                        <Trash2 size={17} />
                        Delete Report
                      </button>

                    </div>

                  )}

                </div>

                {/* Report */}

                <div className="flex items-start gap-4 pr-10">

                  {report.image && (
                    <img
                      src={report.image}
                      alt="Road hazard"
                      className="w-28 h-28 rounded-lg object-cover"
                    />
                  )}

                  <div className="flex-1">

                    <div className="flex items-center gap-3">

                      <h2 className="text-xl font-semibold capitalize">
                        {report.hazardType}
                      </h2>

                      <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
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
                        {report.location.latitude.toFixed(6)},{" "}
                        {report.location.longitude.toFixed(6)}
                      </p>
                    )}

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default AdminDashboard;