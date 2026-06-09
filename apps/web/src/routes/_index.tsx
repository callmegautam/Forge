import { Button } from "@forge/ui/components/button";
import { ArrowRight, Box, Eye, Rocket } from "lucide-react";
import { Link } from "react-router";

import { authClient } from "@/lib/auth-client";

export function meta() {
  return [
    { title: "Forge — Deploy your apps" },
    { name: "description", content: "Deploy your web apps from GitHub repos in seconds." },
  ];
}

const features = [
  {
    icon: Rocket,
    title: "Auto-deploy from GitHub",
    description: "Point at any GitHub repo. We clone, build, and run it.",
  },
  {
    icon: Box,
    title: "Docker Containers",
    description: "Each project runs in its own isolated container with automatic port allocation.",
  },
  {
    icon: Eye,
    title: "Live Build Logs",
    description: "Watch builds in real-time via WebSocket. See every step as it happens.",
  },
];

export default function Home() {
  const { data: session } = authClient.useSession();

  return (
    <div className="flex flex-col items-center px-4 pt-16 pb-24">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Deploy from GitHub. Instantly.
      </h1>
      <p className="mt-4 max-w-xl text-center text-muted-foreground text-lg">
        Forge clones your repo, detects the framework, builds a Docker image, and serves it —
        all in one flow.
      </p>

      <div className="mt-8 flex gap-3">
        {session ? (
          <Link to="/dashboard">
            <Button size="lg">
              Dashboard
              <ArrowRight />
            </Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button size="lg">
              Get Started
              <ArrowRight />
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-20 grid gap-6 sm:grid-cols-3 max-w-3xl">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border p-5 flex flex-col gap-2">
            <f.icon className="size-5 text-muted-foreground" />
            <h3 className="font-semibold text-sm">{f.title}</h3>
            <p className="text-xs text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
