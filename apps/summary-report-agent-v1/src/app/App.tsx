import { useEffect, useState } from "react";
import { PublicInfoPage } from "../features/summary-agent/PublicInfoPage";
import { SummaryAgentPage } from "../features/summary-agent/SummaryAgentPage";

type RouteKey = "home" | "privacy" | "terms" | "contact";

function getRouteFromHash(hash: string): RouteKey {
  switch (hash.replace(/^#\/?/, "")) {
    case "privacy":
      return "privacy";
    case "terms":
      return "terms";
    case "contact":
      return "contact";
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

  return <SummaryAgentPage />;
}
