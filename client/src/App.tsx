import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { NotificationProvider } from "@/hooks/use-notifications";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/lib/protected-route";
import { queryClient } from "./lib/queryClient";
import { lazy, Suspense } from "react";

// Página que não necessita carregamento preguiçoso
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";

// Lazy loading para páginas mais pesadas
const SearchPage = lazy(() => import("@/pages/search-page"));
const FreelancerDashboard = lazy(() => import("@/pages/freelancer-dashboard"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const ServicesPage = lazy(() => import("@/pages/services-page"));
// MapPage removida completamente do projeto
const AppointmentsPage = lazy(() => import("@/pages/appointments-page"));
const NewAppointmentPage = lazy(() => import("@/pages/new-appointment-page"));
const CreateProfilePage = lazy(() => import("@/pages/create-profile-page"));
const CreateJobPage = lazy(() => import("@/pages/create-job-page"));
const JobsPage = lazy(() => import("@/pages/jobs-page"));
const JobDetailPage = lazy(() => import("@/pages/job-detail-page"));
const CheckoutPage = lazy(() => import("@/pages/checkout-page"));
const AdminPage = lazy(() => import("@/pages/admin-page"));
const MessagesPage = lazy(() => import("@/pages/messages-page"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Componente de rota da página inicial, exibe painel diferenciado por tipo de usuário
function HomeRoute() {
  const { user } = useAuth();
  
  // Determina qual componente renderizar com base no tipo de usuário
  const Component = user?.userType === "freelancer" ? FreelancerDashboard : SearchPage;
  
  return <Component />;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <ProtectedRoute path="/" component={HomeRoute} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/services" component={ServicesPage} />
        {/* Rota para MapPage removida */}
        <ProtectedRoute path="/appointments" component={AppointmentsPage} />
        <ProtectedRoute path="/new-appointment" component={NewAppointmentPage} />
        <ProtectedRoute path="/create-profile" component={CreateProfilePage} />
        <ProtectedRoute path="/create-job" component={CreateJobPage} />
        <ProtectedRoute path="/jobs" component={JobsPage} />
        <ProtectedRoute path="/jobs/:id" component={JobDetailPage} />
        <ProtectedRoute path="/services/new" component={() => <ServicesPage isNew={true} />} />
        <ProtectedRoute path="/checkout/:type/:id" component={CheckoutPage} />
        <ProtectedRoute path="/messages" component={MessagesPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <ProtectedRoute path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
