import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WizardProvider } from "@/contexts/WizardContext";
import Step1 from "./pages/steps/Step1";
import Step2 from "./pages/steps/Step2";
import Step3 from "./pages/steps/Step3";

import Step5 from "./pages/steps/Step5";
import Step6 from "./pages/steps/Step6";
import Step7 from "./pages/steps/Step7";

import Step10Summary from "./pages/steps/Step10Summary";
import Step10 from "./pages/steps/Step10";
import Step11 from "./pages/steps/Step11";
import Step4b from "./pages/steps/Step4b";
import StepPersonality from "./pages/steps/StepPersonality";
import StepWhoIsItFor from "./pages/steps/StepWhoIsItFor";
import StepPlaceholder from "./pages/steps/StepPlaceholder";
import Login from "./pages/Login";
import DevStoryPreview from "./pages/DevStoryPreview";
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
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/step/1" element={<Step1 />} />
            <Route path="/step/2" element={<StepWhoIsItFor />} />
            <Route path="/step/3" element={<Step2 />} />
            <Route path="/step/4" element={<Step3 />} />
            <Route path="/step/5" element={<Step4b />} />
            <Route path="/step/6" element={<Step7 />} />
            <Route path="/step/7" element={<Step6 />} />
            <Route path="/step/8" element={<Step10Summary />} />
            <Route path="/step/9" element={<Step10 />} />
            <Route path="/step/10" element={<Step11 />} />
            {/* Secret Ingredient (Step5) hidden — route preserved but redirects */}
            <Route path="/step/secret-ingredient" element={<Step5 />} />
            <Route path="/step/:step" element={<StepPlaceholder />} />
            {/* Dev-only full-book engine preview — no auth, unlinked. */}
            <Route path="/dev/story-preview/:id" element={<DevStoryPreview />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WizardProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
