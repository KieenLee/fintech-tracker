import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import QuickAdd from "./pages/QuickAdd";
import DashboardLayout from "./layouts/DashboardLayout";
import NotFound from "./pages/NotFound";
import "./i18n";

// Lazy load pages that are not frequently accessed
const Users = lazy(() => import("./pages/Users"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Reports = lazy(() => import("./pages/Reports"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/transactions"
            element={
              <DashboardLayout>
                <Transactions />
              </DashboardLayout>
            }
          />
          <Route
            path="/budgets"
            element={
              <DashboardLayout>
                <Budgets />
              </DashboardLayout>
            }
          />
          <Route
            path="/goals"
            element={
              <DashboardLayout>
                <Goals />
              </DashboardLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            }
          />
          <Route
            path="/quick-add"
            element={
              <DashboardLayout>
                <QuickAdd />
              </DashboardLayout>
            }
          />
          {/* Admin Routes */}
          <Route
            path="/users"
            element={
              <DashboardLayout>
                <Suspense fallback={<div>Loading...</div>}>
                  <Users />
                </Suspense>
              </DashboardLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <DashboardLayout>
                <Suspense fallback={<div>Loading...</div>}>
                  <Reports />
                </Suspense>
              </DashboardLayout>
            }
          />
          {/* Customer Routes */}
          <Route
            path="/upgrade"
            element={
              <DashboardLayout>
                <Suspense fallback={<div>Loading...</div>}>
                  <Upgrade />
                </Suspense>
              </DashboardLayout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
