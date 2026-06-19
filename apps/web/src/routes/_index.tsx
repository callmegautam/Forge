import { Link } from "react-router";

export function meta() {
  return [
    { title: "Forge — Deploy your apps" },
    {
      name: "description",
      content: "Deploy your web apps from GitHub repos in seconds.",
    },
  ];
}

export default function Home() {
  return (
    <div className="flex flex-col w-screen h-screen bg-white border border-neutral-200 overflow-hidden">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 md:px-12 py-5 shrink-0 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" className="fill-primary" />
            <path
              d="M10 22V10h4l4 6 4-6h4v12h-4v-7l-4 5.5L14 15v7h-4z"
              className="fill-white"
            />
          </svg>
          <span className="text-lg font-semibold tracking-tight text-neutral-900">
            Forge
          </span>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8">
          {["Features", "Docs", "Pricing", "About"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right CTA */}
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-neutral-900 rounded-full hover:bg-neutral-800 transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Get Started
          </Link>
      </nav>

      {/* Hero Content */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center -mt-10 z-10">
        {/* Announcement Badge */}
        {/* <div
          className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-8 text-xs font-medium text-neutral-600 bg-neutral-100 border border-neutral-200"
          style={{ borderRadius: "999px" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          Open Source
        </div> */}

        {/* Heading */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 leading-[1.1] max-w-3xl"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Turn <span className="text-primary">GitHub Repository</span>
          <br />
          Into Live Applications
        </h1>

        {/* Description */}
        <p className="mt-6 text-sm text-neutral-800 leading-relaxed max-w-150">
          Connect your GitHub repository and deploy in seconds. Manage custom
          domains, monitor deployments, and ship updates with confidence.
        </p>

        {/* Primary Button */}
        <Link
          to="/dashboard"
          className="relative z-10 inline-flex items-center justify-center px-7 py-3 mt-8 text-sm font-medium text-white bg-primary rounded-full hover:opacity-90 transition-opacity"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Start Deploying
        </Link>
      </div>

      {/* Background Illustration */}
      <div
        className="absolute bottom-0 left-0 right-0 h-full"
        style={{
          backgroundImage: "url(/bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, transparent 5%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.85) 60%, white 75%)",
          WebkitMaskSize: "100% 100%",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, transparent 5%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0.5) 40%, rgba(255,255,255,0.85) 60%, white 75%)",
          maskSize: "100% 100%",
        }}
      />
    </div>
  );
}
