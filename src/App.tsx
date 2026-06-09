import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import Import from "./pages/Import";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Chronicle from "./pages/Chronicle";
import Characters from "./pages/Characters";
import Relationships from "./pages/Relationships";
import Stories from "./pages/Stories";
import Sessions from "./pages/Sessions";
import Generator from "./pages/Generator";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Locations from "./pages/Locations";
import Timeline from "./pages/Timeline";
import DiceRollerPage from "./pages/DiceRoller";
import { notify } from "@/lib/notify";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onMutate: () => {
      if (!navigator.onLine) {
        notify.offline("Saving changes");
        throw new Error("Offline: mutation blocked");
      }
    },
  }),
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Chronicle />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/characters"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Characters />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/relationships"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Relationships />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stories"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Stories />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sessions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Sessions />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/timeline"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Timeline />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Locations />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/generator"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Generator />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dice"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DiceRollerPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/import"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Import />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
