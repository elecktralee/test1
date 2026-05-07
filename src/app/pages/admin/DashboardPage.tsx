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

export const router = createBrowserRouter([
  // ─── Study pages (Visão do Participante) ──────────────
  { path: "/", Component: PresentationPage },
  { path: "/tcle", Component: TCLEPage },
  { path: "/tale", Component: TALEPage },
  { path: "/sociodemografico", Component: SociodemographicPage },
  { path: "/css33", Component: CSS33Page },
  { path: "/bai", Component: BAIPage },
  { path: "/gse", Component: GSEPage },
  { path: "/igt", Component: IGTPage },
  { path: "/conclusao", Component: CompletionPage },
]);
