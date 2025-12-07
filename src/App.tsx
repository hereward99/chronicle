import { Toaster } from "@/components/ui/toaster";
import Import from "./pages/Import";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Chronicle from "./pages/Chronicle";
import Characters from "./pages/Characters";
import Coteries from "./pages/Coteries";
import Relationships from "./pages/Relationships";
import Stories from "./pages/Stories";
import Sessions from "./pages/Sessions";
import Generator from "./pages/Generator";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Chronicle />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/characters" element={
              <ProtectedRoute>
                <Layout>
                  <Characters />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/coteries" element={
              <ProtectedRoute>
                <Layout>
                  <Coteries />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/relationships" element={
              <ProtectedRoute>
                <Layout>
                  <Relationships />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/stories" element={
              <ProtectedRoute>
                <Layout>
                  <Stories />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/sessions" element={
              <ProtectedRoute>
                <Layout>
                  <Sessions />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/generator" element={
              <ProtectedRoute>
                <Layout>
                  <Generator />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/import" element={
              <ProtectedRoute>
                <Import />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
