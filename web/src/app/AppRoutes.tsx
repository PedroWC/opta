import { Route, Routes } from "react-router-dom";
import { AboutPage } from "../pages/AboutPage.tsx";
import { AssumptionsPage } from "../pages/AssumptionsPage.tsx";
import { NotFoundPage } from "../pages/NotFoundPage.tsx";
import { ResultPage } from "../pages/ResultPage.tsx";
import { SimulatorPage } from "../pages/SimulatorPage.tsx";
import { AppShell } from "./AppShell.tsx";

type Props = { assumptionsVersion?: string | undefined };

export function AppRoutes({ assumptionsVersion }: Props) {
  return (
    <Routes>
      <Route element={<AppShell assumptionsVersion={assumptionsVersion} />}>
        <Route index element={<SimulatorPage />} />
        <Route path="resultado" element={<ResultPage />} />
        <Route path="premissas" element={<AssumptionsPage />} />
        <Route path="sobre" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
