import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Upload,
  MapPin,
  ArrowLeft,
  FileText,
} from "lucide-react";

function Capture() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);

  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [locationMode, setLocationMode] = useState(null);

  const [addressSuggestions, setAddressSuggestions] = useState([]);
const [addressSearching, setAddressSearching] = useState(false);
const [addressSelected, setAddressSelected] = useState(false);

  const [aiResult, setAiResult] = useState(null);
const [aiLoading, setAiLoading] = useState(false);

  const [description, setDescription] = useState("");
  const [hazardType, setHazardType] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Open Camera
// Open Camera
async function openCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    setCameraOpen(true);

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }, 100);

  } catch (error) {
    alert("Camera access was denied or is unavailable.");
  }
}


// Take Photo
function takePhoto() {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas) {
    return;
  }

  if (video.videoWidth === 0 || video.videoHeight === 0) {
    alert("Camera is not ready yet. Please wait a moment.");
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");

  context.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const photo = canvas.toDataURL("image/jpeg");

  setImage(photo);
  setPhotoCaptured(true);

  // Stop camera
  const stream = video.srcObject;

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
}


// Stop Camera
function stopCamera() {
  if (videoRef.current && videoRef.current.srcObject) {
    videoRef.current.srcObject
      .getTracks()
      .forEach((track) => track.stop());

    videoRef.current.srcObject = null;
  }

  setCameraOpen(false);
}

  // Get Current Location
  // ==========================================
// GET CURRENT LOCATION + ADDRESS
// ==========================================

// ==========================================
// USE MY CURRENT LOCATION
// ==========================================

async function getCurrentLocation() {

  if (!navigator.geolocation) {

    alert("Geolocation is not supported by your browser.");

    return;
  }

  // Clear the previous manually selected location
  setAddress("");
  setLocation(null);
  setAddressSelected(true);
setLocationMode("gps");
setAddressSuggestions([]);

  setLocationLoading(true);

  navigator.geolocation.getCurrentPosition(

    async (position) => {

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;


      console.log("GPS LATITUDE:", latitude);
      console.log("GPS LONGITUDE:", longitude);
      console.log("GPS ACCURACY:", accuracy, "meters");


      // Save the actual GPS location
      setLocation({
        latitude: latitude,
        longitude: longitude,
      });


      // Show temporary message while finding address
      setAddress("Finding your current address...");


      try {

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );


        if (!response.ok) {

          throw new Error(
            "Unable to get address from GPS location."
          );

        }


        const data = await response.json();


        console.log(
          "GPS ADDRESS:",
          data.display_name
        );


        if (data.display_name) {

          setAddress(data.display_name);

        } else {

          setAddress(
            `GPS Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
          );

        }

      } catch (error) {

        console.error(
          "Reverse geocoding error:",
          error
        );

        setAddress(
          `GPS Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
        );

      }


      setLocationLoading(false);

    },


    (error) => {

      console.error(
        "GPS ERROR:",
        error
      );

      setLocationLoading(false);

      if (error.code === 1) {

        alert(
          "Location permission was denied. Please allow location access."
        );

      } else if (error.code === 2) {

        alert(
          "Your current location could not be determined."
        );

      } else if (error.code === 3) {

        alert(
          "Getting your location took too long. Please try again."
        );

      } else {

        alert(
          "Unable to get your current location."
        );

      }

    },


    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }

  );
}

  async function detectPothole(file) {
  if (!file) {
    return;
  }

  setAiLoading(true);
  setAiResult(null);

  try {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
      "http://127.0.0.1:8000/detect",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

console.log("AI RESULT:", data);

setAiResult(data);

if (data.is_pothole) {
  setHazardType("pothole");
}

  } catch (error) {
    console.error("AI detection error:", error);
    alert("AI detection failed.");
  }

  setAiLoading(false);
}

// Automatic Address Suggestions
useEffect(() => {
  if (
    address.length < 3 ||
    addressSelected ||
    locationMode === "gps"
  ) {
    setAddressSuggestions([]);
    return;
  }

  const timer = setTimeout(async () => {
    setAddressSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(
          address
        )}`
      );

      if (!response.ok) {
        throw new Error("Address search failed");
      }

      const data = await response.json();

      setAddressSuggestions(data);
    } catch (error) {
      console.error("Address suggestion error:", error);
      setAddressSuggestions([]);
    } finally {
      setAddressSearching(false);
    }
  }, 500);

  return () => clearTimeout(timer);
}, [address, addressSelected, locationMode]);

// Select Address Suggestion
function selectAddressSuggestion(result) {
  setAddress(result.display_name);

  setLocation({
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
  });

  setLocationMode("manual");
  setAddressSelected(true);
  setAddressSuggestions([]);
}

  // Submit Report
  function handleSubmit(event) {
    event.preventDefault();

    if (!image) {
      alert("Please capture or upload an image.");
      return;
    }

    if (!location) {
  alert(
    "Please select an address suggestion or use your current location."
  );
  return;
}

    if (!description.trim()) {
      alert("Please describe the road problem.");
      return;
    }

    if (!hazardType) {
      alert("Please select a hazard type.");
      return;
    }

    const report = {
  id: Date.now(),
  image: image,
  location: location,
  address: address,
  description: description,
  hazardType: hazardType,

  aiDetected: aiResult ? aiResult.is_pothole : false,
  aiConfidence: aiResult ? aiResult.confidence_score : 0,
  aiDetectedObjects: aiResult ? aiResult.detected_objects : 0,
  aiAnnotatedImage: aiResult ? aiResult.annotated_image : null,

  status: "Pending",
  createdAt: new Date().toISOString(),
};

const existingReports = JSON.parse(
  localStorage.getItem("roadpulse_reports") || "[]"
);

existingReports.unshift(report);

localStorage.setItem(
  "roadpulse_reports",
  JSON.stringify(existingReports)
);

alert("Road report created successfully!");

navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">


      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        {/* Heading */}
        <div className="text-center mb-8">

          <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Camera size={32} />
          </div>

          <h1 className="text-3xl font-bold mt-5">
            Report a Road Hazard
          </h1>

          <p className="text-slate-400 mt-2">
            Help make roads safer by reporting dangerous road conditions.
          </p>

        </div>

        {/* Capture Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-8"
        >

          {/* Image Area */}
          <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center">

            <h2 className="text-xl font-semibold">
              Capture a Road Hazard
            </h2>

            <p className="text-slate-400 mt-2">
              Take a photo using your camera or upload an existing image.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-7">

              {/* Camera Button */}
              <button
                type="button"
                onClick={openCamera}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold"
              >
                <Camera size={20} />
                Open Camera
              </button>

              {/* Upload Button */}
              <label
                htmlFor="image-upload"
                onClick={stopCamera}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-700 hover:bg-slate-800 cursor-pointer"
              >
                <Upload size={20} />
                Upload Image
              </label>

              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files[0];

                  setCameraOpen(false);

                  if (file) {
  const reader = new FileReader();

  reader.onload = () => {
    setImage(reader.result);
    setPhotoCaptured(false);
  };

  reader.readAsDataURL(file);

  detectPothole(file);
}
                }}
              />

            </div>

            {/* Camera Preview */}
            {cameraOpen && !photoCaptured && (
              <div className="mt-6">

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-h-96 rounded-xl border border-slate-700 object-contain"
                />

                <button
                  type="button"
                  onClick={takePhoto}
                  className="w-full mt-4 py-3 rounded-lg bg-green-500 hover:bg-green-600 font-semibold"
                >
                  📸 Take Photo
                </button>

              </div>
            )}

            {/* Captured Photo */}
            {photoCaptured && image && (
              <div className="mt-6 text-center">

                <img
                  src={image}
                  alt="Captured road hazard"
                  className="mx-auto max-h-80 rounded-xl object-contain border border-green-500"
                />

                <p className="text-green-400 font-semibold mt-4">
                  ✓ Photo captured successfully!
                </p>

                <p className="text-slate-400 text-sm mt-1">
                  This photo will be attached to your road report.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setPhotoCaptured(false);
                  }}
                  className="mt-4 px-5 py-2 rounded-lg border border-slate-700 hover:bg-slate-800"
                >
                  Retake Photo
                </button>

              </div>
            )}

            {/* Uploaded Image */}
            {image && !photoCaptured && (
              <div className="mt-6 text-center">

                <img
                  src={image}
                  alt="Road hazard preview"
                  className="mx-auto max-h-80 rounded-xl object-contain border border-green-500"
                />

                <p className="text-green-400 font-semibold mt-3">
                  ✓ Image ready for your road report
                </p>

              </div>
            )}

            {/* Hidden Canvas */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />

          </div>

          {/* Location */}
          <div className="mt-8">

            <div className="flex items-center gap-2 mb-3">

              <MapPin
                className="text-blue-400"
                size={20}
              />

              <h2 className="font-semibold">
                Location of Incident
              </h2>

            </div>

            {/* GPS */}
            <button
  type="button"
  onClick={getCurrentLocation}
  className="w-full mt-3 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
>
  📍 I am at the incident — Use My Current Location
</button>

            {/* OR */}
            <div className="flex items-center gap-3 my-5">

              <div className="h-px bg-slate-700 flex-1"></div>

              <span className="text-slate-500 text-sm">
                OR
              </span>

              <div className="h-px bg-slate-700 flex-1"></div>

            </div>

            {/* Address */}
            <label className="block text-sm text-slate-300 mb-2">
  Enter Pothole / Incident Address
</label>

<div className="flex flex-col sm:flex-row gap-3">

  <div className="relative">
  <input
    type="text"
    value={address}
    onChange={(event) => {
      setAddress(event.target.value);
      setLocation(null);
      setLocationMode(null);
      setAddressSelected(false);
    }}
    placeholder="Enter incident location"
    className="w-full"
  />

  {addressSearching && (
    <p className="mt-1 text-sm text-gray-500">
      Searching locations...
    </p>
  )}

  {addressSuggestions.length > 0 && (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border bg-white shadow-lg">
      {addressSuggestions.map((result) => (
        <button
          key={result.place_id}
          type="button"
          onClick={() => selectAddressSuggestion(result)}
          className="block w-full border-b p-3 text-left text-sm text-gray-700 hover:bg-blue-50"
        >
          {result.display_name}
        </button>
      ))}
    </div>
  )}
</div>

</div>

<p className="text-slate-500 text-xs mt-2">
  Enter the location where the road problem actually occurred.
</p>


            {/* Location Result */}
            {(location || address) && (
              <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-green-500">

                <p className="text-green-400 font-semibold">
                  ✓ Location added successfully
                </p>

                {address && (
                  <p className="text-slate-300 text-sm mt-2">
                    Address: {address}
                  </p>
                )}

                {location && (
                  <>
                    <p className="text-slate-300 text-sm mt-2">
                      Latitude: {location.latitude.toFixed(6)}
                    </p>

                    <p className="text-slate-300 text-sm mt-1">
                      Longitude: {location.longitude.toFixed(6)}
                    </p>
                  </>
                )}

              </div>
            )}

          </div>

          {/* Description */}
          <div className="mt-8">

            <div className="flex items-center gap-2 mb-3">

              <FileText
                className="text-blue-400"
                size={20}
              />

              <h2 className="font-semibold">
                Description
              </h2>

            </div>

            <textarea
              rows="5"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the road problem..."
              required
              className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-blue-500 resize-none"
            />

          </div>

          {/* Hazard Type */}
          <div className="mt-6">

            <label className="block text-sm text-slate-300 mb-2">
              Hazard Type
            </label>

            <select
              value={hazardType}
              onChange={(event) => setHazardType(event.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-blue-500"
            >

              <option value="" disabled>
                Select hazard type
              </option>

              <option value="pothole">
                Pothole
              </option>

              <option value="road-damage">
                Road Damage
              </option>

              <option value="waterlogging">
                Waterlogging
              </option>

              <option value="debris">
                Road Debris
              </option>

              <option value="accident-zone">
                Accident-prone Area
              </option>

              <option value="other">
                Other
              </option>

            </select>

          </div>
{aiLoading && (
  <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
    <p className="text-blue-400">
      AI is detecting road damage...
    </p>
  </div>
)}

{aiResult && (
  <div className="mt-4 p-4 rounded-lg bg-slate-900 border border-slate-700">
    <h3 className="text-lg font-semibold text-white">
      AI Detection Result
    </h3>

    <p className="mt-2 text-slate-300">
      Pothole Detected:{" "}
      <span className="text-green-400">
        {aiResult.is_pothole ? "Yes" : "No"}
      </span>
    </p>

    <p className="mt-1 text-slate-300">
      Confidence:{" "}
      <span className="text-blue-400">
        {(aiResult.confidence_score * 100).toFixed(0)}%
      </span>
    </p>

    <p className="mt-1 text-slate-300">
      Detected Objects:{" "}
      <span className="text-white">
        {aiResult.detected_objects}
      </span>
    </p>

    <p className="mt-1 text-slate-300">
      Hazard Type:{" "}
      <span className="text-white">
        {aiResult.hazard_type}
      </span>
    </p>
    {aiResult.annotated_image && (
  <div className="mt-4">
    <p className="text-sm text-slate-400 mb-2">
      AI Detection Image
    </p>

    <img
      src={aiResult.annotated_image}
      alt="AI detected potholes"
      className="w-full rounded-lg border border-slate-700"
    />
  </div>
)}
  </div>
)}
          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-8 py-4 rounded-lg bg-blue-500 hover:bg-blue-600 font-semibold text-lg"
          >
            Create Road Report
          </button>

        </form>

      </div>

    </div>
  );
}

export default Capture;