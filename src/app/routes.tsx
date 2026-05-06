import { createBrowserRouter } from "react-router";

import PresentationPage from "./pages/study/PresentationPage";
import TCLEPage from "./pages/study/TCLEPage";
import TALEPage from "./pages/study/TALEPage";
import SociodemographicPage from "./pages/study/SociodemographicPage";
import CSS33Page from "./pages/study/CSS33Page";
import BAIPage from "./pages/study/BAIPage";
import GSEPage from "./pages/study/GSEPage";
import IGTPage from "./pages/study/IGTPage";
import CompletionPage from "./pages/study/CompletionPage";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import TableViewPage from "./pages/admin/TableViewPage";
import IGTAdminPage from "./pages/admin/IGTAdminPage";

// Wrappers for typed TableViewPage
const ParticipantsPage = () => <TableViewPage dataset="participants" />;
const SociodemographicAdminPage = () => <TableViewPage dataset="sociodemografico" />;
const CSS33AdminPage = () => <TableViewPage dataset="css33" />;
const BAIAdminPage = () => <TableViewPage dataset="bai" />;
const GSEAdminPage = () => <TableViewPage dataset="gse" />;
const IGTSummaryPage = () => <TableViewPage dataset="igt-summary" />;
const IGTTrialsPage = () => <TableViewPage dataset="igt-trials" />;

export const router = createBrowserRouter([
  // ─── Study pages ──────────────────────────────────────
  { path: "/", Component: PresentationPage },
  { path: "/tcle", Component: TCLEPage },
  { path: "/tale", Component: TALEPage },
  { path: "/sociodemografico", Component: SociodemographicPage },
  { path: "/css33", Component: CSS33Page },
  { path: "/bai", Component: BAIPage },
  { path: "/gse", Component: GSEPage },
  { path: "/igt", Component: IGTPage },
  { path: "/conclusao", Component: CompletionPage },

  // ─── Admin pages ──────────────────────────────────────────────────────────────
  { path: "/admin", Component: AdminLoginPage },
  { path: "/admin/dashboard", Component: DashboardPage },
  { path: "/admin/participants", Component: ParticipantsPage },
  { path: "/admin/sociodemografico", Component: SociodemographicAdminPage },
  { path: "/admin/css33", Component: CSS33AdminPage },
  { path: "/admin/bai", Component: BAIAdminPage },
  { path: "/admin/gse", Component: GSEAdminPage },
  { path: "/admin/igt-summary", Component: IGTSummaryPage },
  { path: "/admin/igt-trials", Component: IGTTrialsPage },
  { path: "/admin/igt", Component: IGTAdminPage },
]);