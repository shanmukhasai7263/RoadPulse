
import { useState } from "react";
import { supabase } from "../services/supabaseClient";

function dataUrlToBlob(dataUrl) {
  return fetch(dataUrl).then((response) => response.blob());
}


async function uploadReportImage(userId, reportId, imageSource, suffix) {
  // No image is available for this report.
  if (!imageSource) return null;

  let blob;

  if (
    typeof imageSource === "string" &&
    imageSource.startsWith("data:image/")
  ) {
    // Handle Base64 images.
    const response = await fetch(imageSource);
    blob = await response.blob();

  } else if (
    typeof imageSource === "string" &&
    /^https?:\/\//i.test(imageSource)
  ) {
    // Handle images served by the FastAPI backend.
    const response = await fetch(imageSource);

    if (!response.ok) {
      throw new Error(
        `Could not download ${suffix} image: HTTP ${response.status}`
      );
    }

    blob = await response.blob();

  } else {
    throw new Error(
      `Unsupported ${suffix} image format.`
    );
  }

  if (!blob.type.startsWith("image/")) {
    throw new Error(
      `${suffix} URL did not return a valid image.`
    );
  }

  const extension =
    blob.type === "image/png"
      ? "png"
      : blob.type === "image/webp"
        ? "webp"
        : "jpg";

  const path = `${userId}/${reportId}-${suffix}.${extension}`;

  const { error } = await supabase.storage
    .from("road-reports")
    .upload(path, blob, {
      contentType: blob.type,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("road-reports")
    .getPublicUrl(path);

  return data.publicUrl;
}


function MigrateReports() {
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState([]);
  const [summary, setSummary] = useState(null);

  async function startMigration() {
    if (running) return;

    setRunning(true);
    setMessages([]);
    setSummary(null);

    const reports = JSON.parse(
      localStorage.getItem("roadpulse_reports") || "[]"
    );

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    function log(message) {
      setMessages((previous) => [...previous, message]);
    }

    try {
      if (!reports.length) {
        throw new Error("No localStorage reports were found.");
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Please log in to RoadPulse before migrating reports."
        );
      }

      log(`Found ${reports.length} local reports.`);

      for (const report of reports) {
        try {
          // Check whether this report was already migrated.
          const { data: existing, error: checkError } =
            await supabase
              .from("complaints")
              .select("id")
              .eq("id", report.id)
              .maybeSingle();

          if (checkError) throw checkError;

          if (existing) {
            skipped++;
            log(`Skipped ${report.id}: already exists.`);
            continue;
          }

          const imageUrl = await uploadReportImage(
            user.id,
            report.id,
            report.image,
            "original"
          );

          
let annotatedImageUrl = null;

if (report.aiAnnotatedImage) {
  try {
    annotatedImageUrl = await uploadReportImage(
      user.id,
      report.id,
      report.aiAnnotatedImage,
      "annotated"
    );
  } catch (error) {
    if (error.message.includes("HTTP 404")) {
      log(
        `Warning: Annotated image missing for ${report.id}. Continuing without it.`
      );
    } else {
      throw error;
    }
  }
}


          const row = {
            id: report.id,
            user_id: user.id,
            hazard_type: report.hazardType || "Unknown",
            description: report.description || null,
            address: report.address || null,
            latitude: report.location?.latitude ?? null,
            longitude: report.location?.longitude ?? null,
            image_url: imageUrl,
            annotated_image_url: annotatedImageUrl,
            ai_detected: Boolean(report.aiDetected),
            ai_confidence: report.aiConfidence ?? null,
            ai_detected_objects:
              report.aiDetectedObjects ?? null,
            status: report.status || "Pending",
            created_at: report.createdAt || new Date().toISOString(),
          };

          const { error: insertError } = await supabase
            .from("complaints")
            .insert(row);

          if (insertError) throw insertError;

          migrated++;
          log(`Successfully migrated report ${report.id}.`);
        } catch (error) {
          failed++;
          log(
            `FAILED ${report.id}: ${error.message || "Unknown error"}`
          );
        }
      }

      setSummary({
        total: reports.length,
        migrated,
        skipped,
        failed,
      });
    } catch (error) {
      log(`Migration stopped: ${error.message}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">
          RoadPulse Report Migration
        </h1>

        <p className="text-slate-400 mt-3">
          Transfer existing browser reports and images into Supabase.
        </p>

        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-300">
            Your original localStorage reports will not be deleted.
          </p>

          <button
            onClick={startMigration}
            disabled={running}
            className="mt-5 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 font-semibold"
          >
            {running ? "Migrating..." : "Migrate Reports"}
          </button>
        </div>

        {summary && (
          <div className="mt-6 bg-slate-900 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">
              Migration Summary
            </h2>

            <p>Total: {summary.total}</p>
            <p className="text-green-400">
              Migrated: {summary.migrated}
            </p>
            <p className="text-yellow-400">
              Skipped: {summary.skipped}
            </p>
            <p className="text-red-400">
              Failed: {summary.failed}
            </p>
          </div>
        )}

        <div className="mt-6 bg-slate-900 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">
            Migration Log
          </h2>

          <div className="space-y-2 text-sm break-words">
            {messages.map((message, index) => (
              <p key={index} className="text-slate-300">
                {message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MigrateReports;

