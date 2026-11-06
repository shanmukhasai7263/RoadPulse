import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";


// ==========================================
// DEFAULT MAP LOCATION
// ==========================================

const DEFAULT_POSITION = [16.5062, 80.6480];


// ==========================================
// ROAD HAZARD ICON
// RED + WHITE WARNING SIGN
// ==========================================

const hazardIcon = L.divIcon({

  className: "",

  html: `
    <div class="roadpulse-hazard-marker">

      <div class="roadpulse-hazard-sign">

        <span>!</span>

      </div>

    </div>
  `,

  iconSize: [30, 30],

  iconAnchor: [15, 15],

});


// ==========================================
// DANGER ZONE ICON
// ==========================================

const dangerIcon = L.divIcon({

  className: "",

  html: `
    <div class="roadpulse-danger-marker">

      <div class="roadpulse-danger-sign">

        <span>🚨</span>

      </div>

    </div>
  `,

  iconSize: [40, 40],

  iconAnchor: [25, 25],

});


// ==========================================
// CURRENT LOCATION ICON
// ==========================================

const currentLocationIcon = L.divIcon({

  className: "",

  html: `
    <div class="roadpulse-current-marker"></div>
  `,

  iconSize: [15, 15],

  iconAnchor: [5, 5],

});


// ==========================================
// DISTANCE CALCULATION
// ==========================================

function calculateDistance(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {

  const earthRadius = 6371000;

  const lat1 =
    (latitude1 * Math.PI) / 180;

  const lat2 =
    (latitude2 * Math.PI) / 180;

  const differenceLatitude =
    ((latitude2 - latitude1) * Math.PI) / 180;

  const differenceLongitude =
    ((longitude2 - longitude1) * Math.PI) / 180;


  const a =
    Math.sin(differenceLatitude / 2) *
      Math.sin(differenceLatitude / 2) +

    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(differenceLongitude / 2) *
      Math.sin(differenceLongitude / 2);


  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );


  return earthRadius * c;
}


// ==========================================
// MAP COMPONENT
// ==========================================

function Map() {

  const [reports, setReports] =
    useState([]);

    const [startLocation, setStartLocation] =
  useState(null);

const [destination, setDestination] =
  useState("");

const [destinationLocation, setDestinationLocation] =
  useState(null);

  const [destinationSuggestions, setDestinationSuggestions] =
  useState([]);

  // ========================================
  // CURRENT LOCATION
  // ========================================

  const [currentLocation, setCurrentLocation] =
    useState(null);

    const [tripStarted, setTripStarted] =
  useState(false);

const [route, setRoute] =
  useState([]);

const [routeLoading, setRouteLoading] =
  useState(false);

  const [locationLoading, setLocationLoading] =
    useState(false);

    const watchIdRef = useRef(null);

const destinationSearchTimeoutRef = useRef(null);

// ========================================
// LIVE NAVIGATION / AUTO REROUTING
// ========================================

const routeRef = useRef([]);
const navigationActiveRef = useRef(false);
const reroutingRef = useRef(false);
const lastRerouteTimeRef = useRef(0);

async function searchDestination(searchText) {
  const searchValue = searchText.trim();

  if (searchValue.length < 3) {
    setDestinationSuggestions([]);
    return;
  }

  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

  if (!apiKey) {
    console.error("Geoapify API key is missing.");
    return;
  }

  try {
    const url =
      `https://api.geoapify.com/v1/geocode/autocomplete` +
      `?text=${encodeURIComponent(searchValue)}` +
      `&format=json` +
      `&limit=10` +
      `&filter=countrycode:in` +
      `&apiKey=${apiKey}`;

    console.log("Searching:", searchValue);

    const response = await fetch(url);

    const data = await response.json();

    console.log("Geoapify response:", data);

    if (!response.ok) {
      console.error("Geoapify error:", data);
      setDestinationSuggestions([]);
      return;
    }

    const results = data.results || [];

    const places = results
      .filter(
        (place) =>
          place.lat !== undefined &&
          place.lon !== undefined
      )
      .map((place) => ({
        place_id: place.place_id,
        name:
          place.name ||
          place.address_line1 ||
          place.formatted,
        display_name: place.formatted,
        lat: place.lat,
        lon: place.lon,
      }));

    setDestinationSuggestions(places);
  } catch (error) {
    console.error("Destination search failed:", error);
    setDestinationSuggestions([]);
  }
}

function selectDestination(result) {
  const latitude = parseFloat(result.lat);
  const longitude = parseFloat(result.lon);

  console.log("SELECTED DESTINATION:", result);

  setDestinationLocation([
    latitude,
    longitude,
  ]);

  setDestination(
    result.display_name || result.name || ""
  );

  setDestinationSuggestions([]);
}

async function startTrip() {

  if (!currentLocation) {

    alert(
      "Please allow your current location first."
    );

    getCurrentLocation();

    return;

  }

  if (!destinationLocation) {

    alert(
      "Please search and select a destination first."
    );

    return;

  }


  setStartLocation(
    currentLocation
  );

  setRouteLoading(true);


  try {

    const startLongitude =
      currentLocation[1];

    const startLatitude =
      currentLocation[0];

    const destinationLongitude =
      destinationLocation[1];

    const destinationLatitude =
      destinationLocation[0];


    const response = await fetch(

      `https://router.project-osrm.org/route/v1/driving/${startLongitude},${startLatitude};${destinationLongitude},${destinationLatitude}?overview=full&geometries=geojson`

    );


    const data =
      await response.json();


    if (
      !data.routes ||
      data.routes.length === 0
    ) {

      alert(
        "Unable to find a route."
      );

      setRouteLoading(false);

      return;

    }


    const coordinates =
      data.routes[0].geometry.coordinates;


    const leafletRoute =
      coordinates.map(
        ([longitude, latitude]) => [
          latitude,
          longitude,
        ]
      );


    setRoute(
      leafletRoute
    );

    routeRef.current = leafletRoute;
navigationActiveRef.current = true;
setTripStarted(true);
startLiveTracking();


  } catch (error) {

    console.error(
      "Route error:",
      error
    );

    alert(
      "Unable to calculate route."
    );

  }


  setRouteLoading(false);

}

function checkIfOffRoute(userLocation) {
  const activeRoute = routeRef.current;

  if (
    !navigationActiveRef.current ||
    !activeRoute ||
    activeRoute.length === 0
  ) {
    return;
  }

  let nearestDistance = Infinity;

  for (const point of activeRoute) {
    const distance = calculateDistance(
      userLocation[0],
      userLocation[1],
      point[0],
      point[1]
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
    }
  }

  const OFF_ROUTE_DISTANCE = 70;

  if (nearestDistance > OFF_ROUTE_DISTANCE) {
    const now = Date.now();

    if (now - lastRerouteTimeRef.current < 10000) {
      return;
    }

    if (reroutingRef.current) {
      return;
    }

    reroutingRef.current = true;
    lastRerouteTimeRef.current = now;

    rerouteFromCurrentLocation(userLocation);
  }
}

async function rerouteFromCurrentLocation(newStartLocation) {
  if (!destinationLocation) {
    reroutingRef.current = false;
    return;
  }

  try {
    const startLatitude = newStartLocation[0];
    const startLongitude = newStartLocation[1];

    const destinationLatitude = destinationLocation[0];
    const destinationLongitude = destinationLocation[1];

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${startLongitude},${startLatitude};` +
      `${destinationLongitude},${destinationLatitude}` +
      `?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (
      data.code !== "Ok" ||
      !data.routes ||
      data.routes.length === 0
    ) {
      console.error("Unable to find alternative route.");
      return;
    }

    const coordinates = data.routes[0].geometry.coordinates;

    const newRoute = coordinates.map(
      ([longitude, latitude]) => [
        latitude,
        longitude,
      ]
    );

    setRoute(newRoute);
    routeRef.current = newRoute;

    console.log("NEW ROUTE CREATED");
  } catch (error) {
    console.error("Automatic rerouting error:", error);
  } finally {
    reroutingRef.current = false;
  }
}

function startLiveTracking() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  if (watchIdRef.current !== null) {
    navigator.geolocation.clearWatch(watchIdRef.current);
  }

  watchIdRef.current = navigator.geolocation.watchPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const newLocation = [latitude, longitude];

      setCurrentLocation(newLocation);

      if (
        navigationActiveRef.current &&
        routeRef.current.length > 0
      ) {
        checkIfOffRoute(newLocation);
      }

      if (
        navigationActiveRef.current &&
        destinationLocation
      ) {
        const distanceToDestination = calculateDistance(
          latitude,
          longitude,
          destinationLocation[0],
          destinationLocation[1]
        );

        if (distanceToDestination <= 40) {
          navigationActiveRef.current = false;
          setTripStarted(false);

          alert("You have reached your destination.");
        }
      }
    },
    (error) => {
      console.error("Live GPS error:", error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    }
  );
}

async function calculateRoute(
  start,
  destination
) {

  if (!start || !destination) {
    return;
  }

  setRouteLoading(true);

  try {

    const startLatitude =
      start[0];

    const startLongitude =
      start[1];

    const destinationLatitude =
      destination[0];

    const destinationLongitude =
      destination[1];


    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${startLongitude},${startLatitude};` +
      `${destinationLongitude},${destinationLatitude}` +
      `?overview=full&geometries=geojson`;


    const response =
      await fetch(url);


    const data =
      await response.json();


    if (
      data.code !== "Ok" ||
      !data.routes ||
      data.routes.length === 0
    ) {

      console.error(
        "No route found."
      );

      setRouteLoading(false);

      return;
    }


    const coordinates =
      data.routes[0]
        .geometry
        .coordinates;


    const leafletCoordinates =
      coordinates.map(
        ([longitude, latitude]) => [
          latitude,
          longitude,
        ]
      );


    setRoute(leafletCoordinates);
routeRef.current = leafletCoordinates;

  } catch (error) {

    console.error(
      "Route calculation error:",
      error
    );

  }


  setRouteLoading(false);
}

  // ========================================
  // STOP LIVE GPS WHEN MAP IS CLOSED
  // ========================================

  useEffect(() => {

    return () => {

      if (watchIdRef.current !== null) {

        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current = null;

      }

      if (
        destinationSearchTimeoutRef.current
      ) {

        clearTimeout(
          destinationSearchTimeoutRef.current
        );

        destinationSearchTimeoutRef.current = null;

      }

    };

  }, []);

// ========================================
// LOAD REPORTS
// ========================================

useEffect(() => {
  const savedReports = JSON.parse(
    localStorage.getItem(
      "roadpulse_reports"
    ) || "[]"
  );

  setReports(savedReports);
}, []);


  // ========================================
  // GET CURRENT LOCATION
  // ========================================

  function getCurrentLocation() {

    if (!navigator.geolocation) {

      alert(
        "Geolocation is not supported by your browser."
      );

      return;

    }


    setLocationLoading(true);

    navigationActiveRef.current = false;
routeRef.current = [];
reroutingRef.current = false;

    navigator.geolocation.getCurrentPosition(

      (position) => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;


        console.log(
          "CURRENT LOCATION:",
          latitude,
          longitude
        );


        setCurrentLocation([
          latitude,
          longitude,
        ]);


        setLocationLoading(false);

      },


      (error) => {

        console.error(
          "Location error:",
          error
        );


        setLocationLoading(false);


        alert(
          "Unable to get your current location. Please allow location access."
        );

      },


      {
        enableHighAccuracy: true,

        timeout: 20000,

        maximumAge: 0,
      }

    );

  }


  // ========================================
  // GET LOCATION WHEN MAP OPENS
  // ========================================

  useEffect(() => {

    getCurrentLocation();

  }, []);


  // ========================================
  // CREATE DANGER ZONES
  // ========================================

  // ========================================
// CREATE 1 KM POTHOLE HOTSPOTS
// ========================================

const dangerZones = useMemo(() => {
  const validReports = reports.filter((report) => {
    const lat = report.location?.latitude;
    const lon = report.location?.longitude;

    return (
      typeof lat === "number" &&
      typeof lon === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 && lat <= 90 &&
      lon >= -180 && lon <= 180
    );
  });

  const zones = [];
  const processedReports = new Set();

  validReports.forEach((report) => {
    if (processedReports.has(report.id)) return;

    const nearbyReports = validReports.filter((other) => {
      return calculateDistance(
        report.location.latitude,
        report.location.longitude,
        other.location.latitude,
        other.location.longitude
      ) <= 1000;
    });

    if (nearbyReports.length < 3) return;

    const latitude =
      nearbyReports.reduce(
        (sum, item) => sum + item.location.latitude,
        0
      ) / nearbyReports.length;

    const longitude =
      nearbyReports.reduce(
        (sum, item) => sum + item.location.longitude,
        0
      ) / nearbyReports.length;

    // Ensure every counted report is within 1 km of
    // the circle's final centre.
    const reportsInsideCircle = nearbyReports.filter((item) =>
      calculateDistance(
        latitude,
        longitude,
        item.location.latitude,
        item.location.longitude
      ) <= 1000
    );

    if (reportsInsideCircle.length < 3) return;

    const zone = {
      id: `hotspot-${report.id}`,
      latitude,
      longitude,
      reports: reportsInsideCircle,
      potholeCount: reportsInsideCircle.length,
      radius: 1000,
      locality:
        reportsInsideCircle[0].address ||
        reportsInsideCircle[0].location?.address ||
        "Unknown locality",
      riskLevel:
        reportsInsideCircle.length >= 5 ? "High" : "Medium",
      status: "Pending Authority Action"
    };

    zones.push(zone);

    reportsInsideCircle.forEach((item) => {
      processedReports.add(item.id);
    });
  });

  return zones;
}, [reports]);

  // ========================================
// SEND COMPLAINTS TO HOTSPOT API
// ========================================

useEffect(() => {
  async function analyzeAndNotify() {
    if (reports.length < 3) return;

    const complaints = reports
      .filter((report) => {
        const lat = report.location?.latitude;
        const lon = report.location?.longitude;

        return (
          typeof lat === "number" &&
          typeof lon === "number" &&
          Number.isFinite(lat) &&
          Number.isFinite(lon) &&
          lat >= -90 && lat <= 90 &&
          lon >= -180 && lon <= 180
        );
      })
      .map((report) => ({
        latitude: report.location.latitude,
        longitude: report.location.longitude,
        locality:
          report.address ||
          report.location?.address ||
          "Unknown locality"
      }));

    if (complaints.length < 3) return;

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/analyze-hotspots",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ complaints })
        }
      );

      if (!response.ok) {
        throw new Error(
          `Hotspot API failed: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("HOTSPOT ANALYSIS:", data);
      console.log(
        "NEW AUTHORITY ALERTS:",
        data.new_authority_alerts
      );
    } catch (error) {
      console.error(
        "Hotspot analysis failed:",
        error
      );
    }
  }

  analyzeAndNotify();
}, [reports]);

  // ========================================
  // NORMAL HAZARD REPORTS
  // ========================================

  const hazardReports =
    useMemo(() => {

      const reportsInsideDangerZone =
        new Set();


      dangerZones.forEach(
        (zone) => {

          zone.reports.forEach(
            (report) => {

              reportsInsideDangerZone.add(
                report.id
              );

            }
          );

        }
      );


      return reports.filter(
        (report) =>

          report.location &&

          !reportsInsideDangerZone.has(
            report.id
          )
      );

    }, [
      reports,
      dangerZones,
    ]);


  // ========================================
  // TOTAL REPORTS
  // ========================================

  const totalReports =
    reports.length;


  // ========================================
  // TOTAL DANGER ZONES
  // ========================================

  const totalDangerZones =
    dangerZones.length;


  // ========================================
  // RENDER
  // ========================================

  
return (
  <div className="min-h-screen bg-slate-950 text-white">

    <style>{`
      @keyframes roadpulse-hotspot-pulse {
        0% {
          stroke-opacity: 0.95;
          stroke-width: 3;
        }
        70% {
          stroke-opacity: 0.25;
          stroke-width: 8;
        }
        100% {
          stroke-opacity: 0;
          stroke-width: 3;
        }
      }

      .roadpulse-hotspot-pulse {
        animation: roadpulse-hotspot-pulse 2s ease-out infinite;
      }
    `}</style>


      {/* =================================
          HEADER
          ================================= */}

      <div className="border-b border-slate-800 bg-slate-900">

        <div className="max-w-7xl mx-auto px-6 py-5">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold">

                Road
                <span className="text-blue-400">
                  Pulse
                </span>

              </h1>


              <p className="text-slate-400 mt-1">

                Intelligent Road Safety Map

              </p>

            </div>


            <div className="flex items-center gap-4">

              <button
                onClick={getCurrentLocation}
                disabled={locationLoading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
              >

                {locationLoading
                  ? "Locating..."
                  : "📍 My Location"}

              </button>


              <Link
                to="/dashboard"
                className="text-blue-400 hover:text-blue-300"
              >

                ← Dashboard

              </Link>

            </div>

          </div>

        </div>

      </div>


      {/* =================================
          MAP AREA
          ================================= */}

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* =================================
    SAFER TRIP
    ================================= */}

<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-5">

  <h2 className="text-xl font-bold">

    🛣️ Safer Trip

  </h2>


  <p className="text-slate-400 text-sm mt-1">

    Plan your route and receive warnings
    about road hazards and danger zones.

  </p>


  {/* Starting Location */}

  <div className="mt-5">

    <label className="text-sm text-slate-300">

      Starting Location

    </label>


    <div className="mt-2 flex gap-3">

      <div className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3">

        {currentLocation

          ? "📍 Your Current Location"

          : "Location not available"}

      </div>


      <button
        onClick={getCurrentLocation}
        className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg"
      >

        📍 Use My Location

      </button>

    </div>

  </div>

{/* Destination */}

<div className="mt-5">
  <label className="text-sm text-slate-300">
    Destination
  </label>

  <div className="mt-2 relative">
    <input
      type="text"
      value={destination}
      autoComplete="off"
      placeholder="Enter destination address"
      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
      onChange={(e) => {
  const value = e.target.value;

  setDestination(value);
  setDestinationLocation(null);

  if (destinationSearchTimeoutRef.current) {
    clearTimeout(destinationSearchTimeoutRef.current);
  }

  if (value.trim().length >= 3) {
    destinationSearchTimeoutRef.current = setTimeout(() => {
      searchDestination(value);
    }, 400);
  } else {
    setDestinationSuggestions([]);
  }
}}
    />

    {destinationSuggestions.length > 0 && (
      <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl z-[9999]">
        {destinationSuggestions.map((result, index) => (
          <button
  key={`${result.place_id || result.lat}-${index}`}
  type="button"
  onMouseDown={(e) => {
    e.preventDefault();
    e.stopPropagation();
    selectDestination(result);
  }}
  className="w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-700 last:border-b-0 cursor-pointer"
>
  <p className="text-white font-semibold">
    📍 {result.name || result.display_name.split(",")[0]}
  </p>

  <p className="text-sm text-slate-400 mt-1">
    {result.display_name}
  </p>
</button>
        ))}
      </div>
    )}
  </div>
</div>

  {/* Selected Destination */}

  {destinationLocation && (

    <div className="mt-4 p-4 bg-slate-950 border border-green-500/30 rounded-lg">

      <p className="text-green-400 font-semibold">

        ✓ Destination selected

      </p>


      <p className="text-slate-300 text-sm mt-1">

        {destination}

      </p>


      <p className="text-slate-500 text-xs mt-2">

        Latitude:{" "}

        {destinationLocation[0].toFixed(6)}

        <br />

        Longitude:{" "}

        {destinationLocation[1].toFixed(6)}

      </p>

    </div>

  )}


  {/* Start Trip */}

  <button

    onClick={startTrip}

    disabled={
      routeLoading ||
      !destinationLocation
    }

    className="w-full mt-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"

  >

    {routeLoading

      ? "Calculating Route..."

      : "🚗 Start Safer Trip"}

  </button>


  {/* Route Information */}

  {route.length > 0 && (

    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">

      <p className="text-green-400 font-semibold">

        ✓ Route calculated successfully

      </p>


      <p className="text-slate-400 text-sm mt-1">

        RoadPulse will monitor hazards
        along your route.

      </p>

    </div>

  )}

</div>

        {/* MAP INFORMATION BAR */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">


          {/* Total Reports */}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">

            <p className="text-slate-400 text-sm">
              Total Reports
            </p>

            <p className="text-3xl font-bold mt-1">
              {totalReports}
            </p>

          </div>


          {/* Danger Zones */}

          <div className="bg-slate-900 border border-red-500/30 rounded-xl p-4">

            <p className="text-slate-400 text-sm">
              Danger Zones
            </p>

            <p className="text-3xl font-bold text-red-400 mt-1">
              {totalDangerZones}
            </p>

          </div>


          {/* Road Hazards */}

          <div className="bg-slate-900 border border-yellow-500/30 rounded-xl p-4">

            <p className="text-slate-400 text-sm">
              Road Hazards
            </p>

            <p className="text-3xl font-bold text-yellow-400 mt-1">
              {hazardReports.length}
            </p>

          </div>

        </div>


        {/* =================================
            MAP
            ================================= */}

        <div className="rounded-2xl overflow-hidden border border-slate-700">

          <MapContainer

            center={

              currentLocation ||
              DEFAULT_POSITION

            }

            zoom={13}

            style={{
              height: "650px",
              width: "100%",
            }}

          >

            {/* Geoapify Map */}

<TileLayer
  key="geoapify-map"
  attribution='Powered by <a href="https://www.geoapify.com/">Geoapify</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`}
  maxZoom={20}
/>

            

            {/* =================================
    TRIP ROUTE
    ================================= */}

{route.length > 0 && (

  <Polyline

    positions={route}

    pathOptions={{
      color: "#2563eb",
      weight: 6,
      opacity: 0.8,
    }}

  />

)}

{/* DESTINATION MARKER */}

{destinationLocation && (

  <Marker
    position={destinationLocation}
  >

    <Popup>

      <div className="text-black">

        <h3 className="font-bold text-lg">
          🏁 Destination
        </h3>

        <p className="mt-2">
          {destination}
        </p>

      </div>

    </Popup>

  </Marker>

)}


            {/* =================================
                CURRENT LOCATION
                ================================= */}

            {currentLocation && (

              <>

                <Circle
                  center={
                    currentLocation
                  }

                  radius={25}

                  pathOptions={{
                    color: "#1677ff",

                    fillColor:
                      "#1677ff",

                    fillOpacity: 0.12,

                    weight: 2,
                  }}

                />


                <Marker

                  position={
                    currentLocation
                  }

                  icon={
                    currentLocationIcon
                  }

                  zIndexOffset={1000}

                >

                  <Popup>

                    <div className="text-black">

                      <h2 className="font-bold text-lg">

                        📍 You are here

                      </h2>


                      <p className="mt-2">

                        Your current location

                      </p>


                      <p className="text-sm mt-2">

                        Latitude:{" "}

                        {currentLocation[0].toFixed(
                          6
                        )}

                      </p>


                      <p className="text-sm">

                        Longitude:{" "}

                        {currentLocation[1].toFixed(
                          6
                        )}

                      </p>

                    </div>

                  </Popup>

                </Marker>

              </>

            )}


            {/* =================================
                NORMAL ROAD HAZARDS
                ================================= */}

            {hazardReports.map(
              (report) => (

                <Marker

                  key={report.id}

                  position={[
                    report.location.latitude,
                    report.location.longitude,
                  ]}

                  icon={hazardIcon}

                >

                  <Popup>

                    <div className="text-black min-w-[220px]">

                      <h2 className="font-bold text-lg text-red-600">

                        ⚠️ Road Hazard

                      </h2>


                      <p className="mt-2">

                        <strong>
                          Type:
                        </strong>{" "}

                        {report.hazardType}

                      </p>


                      <p className="mt-1">

                        <strong>
                          Address:
                        </strong>{" "}

                        {report.address ||
                          "Not available"}

                      </p>


                      <p className="mt-1">

                        <strong>
                          Status:
                        </strong>{" "}

                        {report.status}

                      </p>


                      {report.aiDetected && (

                        <p className="mt-1">

                          <strong>
                            AI:
                          </strong>{" "}

                          Pothole detected

                        </p>

                      )}


                      {report.aiConfidence > 0 && (

                        <p className="mt-1">

                          <strong>
                            Confidence:
                          </strong>{" "}

                          {(
                            report.aiConfidence *
                            100
                          ).toFixed(0)}

                          %

                        </p>

                      )}


                      <Link

                        to={
                          `/complaints/${report.id}`
                        }

                        className="text-blue-600 font-semibold mt-3 inline-block"

                      >

                        View Report Details →

                      </Link>

                    </div>

                  </Popup>

                </Marker>

              )
            )}


            {/* =================================
                DANGER ZONES
                ================================= */}

            {dangerZones.map(
              (zone) => (

                <React.Fragment
                  key={zone.id}
                >


                  {/* Red danger area */}

                  <Circle

                    center={[
                      zone.latitude,
                      zone.longitude,
                    ]}

                    radius={zone.radius}

                    className="roadpulse-danger-zone"

                    pathOptions={{

                      color:
                        "#ef1b1b",

                      fillColor:
                        "#ef1b1b",

                      fillOpacity:
                        0.15,

                      weight: 3,

                      dashArray:
                        "10 8",

                    }}

                  />


{/* Pulsing outer outline */}
<Circle
  center={[zone.latitude, zone.longitude]}
  radius={zone.radius}
  className="roadpulse-hotspot-pulse"
  pathOptions={{
    color: zone.riskLevel === "High" ? "#ef4444" : "#f59e0b",
    fill: false,
    opacity: 0.8,
    weight: 3,
    interactive: false,
  }}
/>

                  {/* Danger marker */}

                  <Marker

                    position={[
                      zone.latitude,
                      zone.longitude,
                    ]}

                    icon={
                      dangerIcon
                    }

                    zIndexOffset={900}

                  >

                    <Popup>

                      <div className="text-black min-w-[240px]">


                        <h2 className="font-bold text-xl text-red-600">

                          🚨 DANGER ZONE

                        </h2>


                        <p className="font-semibold mt-2">

                          High Risk Area

                        </p>


                        <p className="mt-2">

                          <strong>
                            Total Reports:
                          </strong>{" "}

                          {zone.reports.length}

                        </p>


                        <p className="mt-1">

                          <strong>
                            Main Issues:
                          </strong>{" "}

                          {[

                            ...new Set(

                              zone.reports.map(
                                (item) =>
                                  item.hazardType
                              )

                            ),

                          ].join(", ")}

                        </p>


                        <p className="mt-1">

                          <strong>
                            Area Radius:
                          </strong>{" "}

                          {zone.radius} metres

                        </p>


                        <p className="text-red-600 font-semibold mt-3">

                          ⚠️ Drive carefully in this area.

                        </p>


                        <div className="mt-4">

                          {zone.reports

                            .slice(0, 3)

                            .map(
                              (report) => (

                                <Link

                                  key={
                                    report.id
                                  }

                                  to={
                                    `/complaints/${report.id}`
                                  }

                                  className="block text-blue-600 text-sm mt-2"

                                >

                                  View{" "}

                                  {
                                    report.hazardType
                                  }

                                  {" "}report →

                                </Link>

                              )
                            )}

                        </div>


                      </div>

                    </Popup>

                  </Marker>


                </React.Fragment>

              )
            )}


          </MapContainer>

        </div>


        {/* =================================
            MAP LEGEND
            ================================= */}

        <div className="mt-5 bg-slate-900 border border-slate-800 rounded-xl p-5">

          <h2 className="font-semibold text-lg mb-4">

            Map Legend

          </h2>


          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">


            {/* Road Hazard */}

            <div className="flex items-center gap-3">

              <div className="roadpulse-hazard-marker">

                <div className="roadpulse-hazard-sign">

                  <span>!</span>

                </div>

              </div>


              <span className="text-slate-300">

                Road Hazard

              </span>

            </div>


            {/* Danger Zone */}

            <div className="flex items-center gap-3">

              <div className="roadpulse-danger-marker">

                <div className="roadpulse-danger-sign">

                  <span>🚨</span>

                </div>

              </div>


              <span className="text-slate-300">

                🚨 POTHOLE HOTSPOT

              </span>

            </div>


            {/* Current Location */}

            <div className="flex items-center gap-3">

              <div className="roadpulse-current-marker">
              </div>


              <span className="text-slate-300">

                Your Location

              </span>

            </div>


            {/* High Risk */}

            <div className="flex items-center gap-3">

              <span className="w-5 h-5 rounded-full bg-red-500/20 border-2 border-red-500">
              </span>


              <span className="text-slate-300">

                High Risk Area

              </span>

            </div>


          </div>

        </div>


      </div>

    </div>

  );

}


export default Map;