import { useEffect, useState } from "react";
import { FounderPreviewPage } from "../features/summary-agent/FounderPreviewPage";
import { PublicInfoPage } from "../features/summary-agent/PublicInfoPage";
import { SummaryAgentPage } from "../features/summary-agent/SummaryAgentPage";

type RouteKey = "home" | "privacy" | "terms" | "contact" | "founder-preview";

function getRouteFromHash(hash: string): RouteKey {
  switch (hash.replace(/^#\/?/, "")) {
    case "privacy":
      return "privacy";
    case "terms":
      return "terms";
    case "contact":
      return "contact";
    case "founder-preview":
      return "founder-preview";
    default:
      return "home";
  }
}

export default function App() {
  const [route, setRoute] = useState<RouteKey>(() => {
    if (typeof window === "undefined") {
      return "home";
    }

    return getRouteFromHash(window.location.hash);
  });

  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash(window.location.hash));
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (route === "privacy" || route === "terms" || route === "contact") {
    return <PublicInfoPage page={route} />;
  }

  if (route === "founder-preview") {
    return <FounderPreviewPage />;
  }

  return <SummaryAgentPage />;
}
