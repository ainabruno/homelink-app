import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NetworkConfiguration from "./pages/NetworkConfiguration";
import DevicesList from "./pages/DevicesList";
import ConnectionHistory from "./pages/ConnectionHistory";
import SecuritySettings from "./pages/SecuritySettings";
import Notifications from "./pages/Notifications";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./_core/hooks/useAuth";

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Home />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />

      {/* Protected Routes with Dashboard Layout */}
      {isAuthenticated && (
        <>
          <Route path="/dashboard">
            {() => (
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/networks">
            {() => (
              <DashboardLayout>
                <NetworkConfiguration />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/devices">
            {() => (
              <DashboardLayout>
                <DevicesList />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/history">
            {() => (
              <DashboardLayout>
                <ConnectionHistory />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/settings">
            {() => (
              <DashboardLayout>
                <SecuritySettings />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/notifications">
            {() => (
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            )}
          </Route>
        </>
      )}

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
