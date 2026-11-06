import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ArrowLeft,
  Gauge,
  Eye,
  AlertTriangle,
  CloudRain,
  HardHat,
} from "lucide-react";

const safetyTips = [
  {
    icon: Gauge,
    title: "Maintain a Safe Speed",
    description:
      "Follow the posted speed limit and reduce your speed near intersections, sharp turns, and damaged roads.",
  },
  {
    icon: Eye,
    title: "Stay Alert",
    description:
      "Watch the road ahead, maintain a safe following distance, and avoid using your phone while driving.",
  },
  {
    icon: AlertTriangle,
    title: "Watch for Potholes",
    description:
      "Look out for potholes, uneven surfaces, and road debris. Slow down safely when approaching a hazard.",
  },
  {
    icon: CloudRain,
    title: "Drive Carefully in Rain",
    description:
      "Reduce speed on wet roads, increase your following distance, and avoid driving through deep water.",
  },
  {
    icon: HardHat,
    title: "Follow Road Signs",
    description:
      "Pay attention to warning signs, roadwork areas, diversions, and instructions from traffic authorities.",
  },
  {
    icon: ShieldCheck,
    title: "Choose Safer Routes",
    description:
      "Check the RoadPulse map for reported road hazards and danger zones before starting your journey.",
  },
];

function SafetyTips() {
  return (
    <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
      <div className="max-w-7xl mx-auto">

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <ShieldCheck size={32} />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mt-5">
            Road Safety Tips
          </h1>

          <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
            Follow these precautions to stay alert, avoid road hazards,
            and make every journey safer.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {safetyTips.map((tip, index) => {
            const Icon = tip.icon;

            return (
              <div
                key={index}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Icon size={25} />
                </div>

                <h2 className="text-lg font-semibold mt-5">
                  {tip.title}
                </h2>

                <p className="text-slate-400 text-sm mt-3 leading-6">
                  {tip.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/map"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-medium transition"
          >
            Explore Road Map
          </Link>
        </div>

      </div>
    </div>
  );
}

export default SafetyTips;