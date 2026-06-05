import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import RouteSearch from "./pages/RouteSearch";
import RouteResults from "./pages/RouteResults";  
import SubscriptionPage from "./pages/Subscription/SubscriptionPage";
import SubscriptionForm from "./pages/Subscription/SubscriptionForm";
import SubscriptionConfirmation from "./pages/Subscription/SubscriptionConfirmation";
import SubscriptionPayment from "./pages/Subscription/SubscriptionPayment";
import SubscriptionProfile from "./pages/Subscription/SubscriptionProfile";
import Reporting from "./pages/Reporting";
import NotFound from "./pages/NotFound";
import RouteMap from "./pages/RouteMap";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import AdminGuides from "./pages/Admin/Guides";
import AdminSubscriptions from "./pages/Admin/Subscriptions";
import AdminReports from "./pages/Admin/Reports";
import AdminTransport from "./pages/Admin/Data";
import AdminUsers from "./pages/Admin/Users";
import Dashboard from "./pages/Admin/Dashboard";
import AdminManage from "./pages/Admin/Admin";
import ResetPassword from "./pages/Auth/ResetPassword";
import ForgotPassword from "./pages/Auth/ForgotPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/route-search" element={<RouteSearch />} />
          <Route path="/route-results" element={<RouteResults />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/subscription/Payment-Confirmation" element={<SubscriptionConfirmation />} />
          <Route path="/subscription/Payment" element={<SubscriptionPayment />} />
          <Route path="/subscription/Form" element={<SubscriptionForm />} />
          <Route path="/subscription/Profile" element={<SubscriptionProfile />} />
          <Route path="/reporting" element={<Reporting />} />
          <Route path="/route-map" element={<RouteMap />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/verify-email" element={<VerifyEmail/>} />
          <Route path="/admin/guides" element={<AdminGuides />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/data" element={<AdminTransport />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/Admin/Dashboard" element={<Dashboard/>} />
          <Route path="/Admin/Manage" element={<AdminManage/>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App/>);
