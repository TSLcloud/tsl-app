import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { ToastContainer } from "./components/ui/Toast";

// Pages
import Home from "./pages/Home";
import { RexiProd, RexiInventory } from "./pages/ReXI";
import { LabProd, LabInventory } from "./pages/Lab";
import { VentilationProd, VentilationInventory } from "./pages/Ventilation";
import { TailorMSProd, TailorInventory, MachineSewerInventory } from "./pages/TailorMS";
import { StylistProd, StylistInventory } from "./pages/Stylist";
import { FinalProdPage, FinalInventory } from "./pages/FinalProd";
import Analytics from "./pages/Analytics";
import Admin from "./pages/Admin";
import SetupWizard from "./pages/SetupWizard";

function AppShell() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rexi/prod" element={<RexiProd />} />
          <Route path="/rexi/inventory" element={<RexiInventory />} />
          <Route path="/lab/prod" element={<LabProd />} />
          <Route path="/lab/inventory" element={<LabInventory />} />
          <Route path="/ventilation/prod" element={<VentilationProd />} />
          <Route path="/ventilation/inventory" element={<VentilationInventory />} />
          <Route path="/tailorms/prod" element={<TailorMSProd />} />
          <Route path="/tailorms/tailor-inventory" element={<TailorInventory />} />
          <Route path="/tailorms/ms-inventory" element={<MachineSewerInventory />} />
          <Route path="/stylist/prod" element={<StylistProd />} />
          <Route path="/stylist/inventory" element={<StylistInventory />} />
          <Route path="/final/prod" element={<FinalProdPage />} />
          <Route path="/final/inventory" element={<FinalInventory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  // Bypassed the localStorage check since the backend setup wizard has already run.
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Kept the setup route accessible manually just in case an admin ever needs to re-run it */}
        <Route path="/setup" element={<SetupWizard />} />
        
        {/* All visitors are now funneled straight into the functional App layout wrapper */}
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  );
}