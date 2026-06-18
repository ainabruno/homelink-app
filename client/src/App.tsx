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
import DeviceGroups from "./pages/DeviceGroups";
import VPNClient from "./pages/VPNClient";
import NetworkSpeedTest from "./pages/NetworkSpeedTest";
import PaymentSuccess from "./pages/PaymentSuccess";
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
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/payment-success" component={PaymentSuccess} />

      {/* Protected Routes with Dashboard Layout - Always registered, ProtectedRoute handles auth */}
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            )}
          />
        )}
      </Route>
      <Route path="/networks">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <NetworkConfiguration />
              </DashboardLayout>
            )}
          />
        )}
      </Route>
      <Route path="/devices">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <DevicesList />
              </DashboardLayout>
            )}
          />
        )}
      </Route>
      <Route path="/history">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <ConnectionHistory />
              </DashboardLayout>
            )}
          />
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <SecuritySettings />
              </DashboardLayout>
            )}
          />
        )}
      </Route>
      <Route path="/notifications">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <Notifications />
              </DashboardLayout>
            )}
          />
        )}
      </Route>
      <Route path="/groups">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <DeviceGroups />
              </DashboardLayout>
            )}
          />
        )}
      </Route>
      <Route path="/vpn-client">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <VPNClient />
              </DashboardLayout>
            )}
          />
        )}
      </Route>
      <Route path="/speed-test">
        {() => (
          <ProtectedRoute
            component={() => (
              <DashboardLayout>
                <NetworkSpeedTest />
              </DashboardLayout>
            )}
          />
        )}
      </Route>

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
