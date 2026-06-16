import { useState, useEffect } from "react";
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
  const [systemState, setSystemState] = useState({ loading: true, setupDone: false, error: false });

  useEffect(() => {
    const checkGlobalSetup = async () => {
      const scriptUrl = process.env.REACT_APP_SCRIPT_URL;
      
      if (!scriptUrl || scriptUrl.includes("example.com")) {
        setSystemState({ loading: false, setupDone: false, error: "Missing or invalid REACT_APP_SCRIPT_URL environment variable in Vercel." });
        return;
      }

      try {
        // Safe GET request avoiding CORS preflight blocks
        const res = await fetch(`${scriptUrl}?action=checkSetup`);
        const data = await res.json();
        
        if (data && data.success) {
          setSystemState({ loading: false, setupDone: data.setupDone, error: false });
        } else {
          setSystemState({ loading: false, setupDone: false, error: data.error || "Failed initialization lookup." });
        }
      } catch (err) {
        setSystemState({ 
          loading: false, 
          setupDone: false, 
          error: "Cannot connect to Google Apps Script. Check deployment permissions, web app URL, or CORS configurations." 
        });
      }
    };

    checkGlobalSetup();
  }, []);

  if (systemState.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface text-ink">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium">Connecting to TSL Cloud Engine...</p>
        </div>
      </div>
    );
  }

  if (systemState.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface px-4">
        <div className="max-w-md w-full bg-surface-2 border border-surface-4 rounded-lg p-6 text-center shadow-xl">
          <div className="text-red-500 text-3xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-ink mb-2">Connection Failure</h3>
          <p className="text-sm text-ink-faint mb-4">{systemState.error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/setup" element={
          systemState.setupDone ? <Navigate to="/" replace /> : <SetupWizard onComplete={() => window.location.reload()} />
        } />
        <Route path="/*" element={
          systemState.setupDone ? <AppShell /> : <Navigate to="/setup" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}