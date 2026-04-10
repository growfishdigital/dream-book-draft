import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WizardProvider } from "@/contexts/WizardContext";
import Step1 from "./pages/steps/Step1";
import Step2 from "./pages/steps/Step2";
import Step3 from "./pages/steps/Step3";
import StepPlaceholder from "./pages/steps/StepPlaceholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <WizardProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/step/1" replace />} />
            <Route path="/step/1" element={<Step1 />} />
            <Route path="/step/2" element={<Step2 />} />
            <Route path="/step/3" element={<Step3 />} />
            <Route path="/step/:step" element={<StepPlaceholder />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WizardProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
