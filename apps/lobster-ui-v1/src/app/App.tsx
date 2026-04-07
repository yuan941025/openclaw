import { copy } from "./copy";
import { Banner } from "../components/ui/Banner";
import { DesktopDashboard } from "../features/dashboard/DesktopDashboard";
import { StatusHeader } from "../features/dashboard/StatusHeader";
import { MobileDashboard } from "../features/mobile/MobileDashboard";
import { useLobsterConsole } from "../hooks/useLobsterConsole";

export function App() {
  const dashboard = useLobsterConsole();

  return (
    <div className="min-h-screen bg-grid-radial text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] size-72 rounded-full bg-cyan-300/18 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-4rem] size-80 rounded-full bg-violet-300/18 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <div className="hidden lg:block">
          <div className="space-y-4">
            <StatusHeader
              health={dashboard.health}
              statusOverview={dashboard.statusOverview}
              onRefresh={dashboard.refreshHealth}
            />

            {dashboard.mockBannerVisible ? (
              <Banner
                tone="warning"
                title={copy.banner.mockTitle}
                body={copy.banner.mockBody}
              />
            ) : null}

            <DesktopDashboard dashboard={dashboard} />
          </div>
        </div>

        <MobileDashboard dashboard={dashboard} />
      </div>
    </div>
  );
}