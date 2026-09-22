import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RequireAuth } from '@/components/RequireAuth';
import { AppShell } from '@/components/layout/AppShell';
import { Login } from '@/pages/Login';
import { ChangePassword } from '@/pages/ChangePassword';
import { Dashboard } from '@/pages/Dashboard';
import { Members } from '@/pages/Members';
import { Contributions } from '@/pages/Contributions';
import { Funds } from '@/pages/Funds';
import { Sanctions } from '@/pages/Sanctions';
import { Loans } from '@/pages/Loans';
import { Payouts } from '@/pages/Payouts';
import { Events } from '@/pages/Events';
import { Meetings } from '@/pages/Meetings';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/change-password"
              element={<RequireAuth><ChangePassword /></RequireAuth>}
            />
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/membres" element={<Members />} />
              <Route path="/cotisations" element={<Contributions />} />
              <Route path="/caisses" element={<Funds />} />
              <Route path="/sanctions" element={<Sanctions />} />
              <Route path="/prets" element={<Loans />} />
              <Route path="/tirages" element={<Payouts />} />
              <Route path="/evenements" element={<Events />} />
              <Route path="/reunions" element={<Meetings />} />
              <Route path="/rapports" element={<Reports />} />
              <Route
                path="/parametres"
                element={<ProtectedRoute roles={['ADMIN']}><Settings /></ProtectedRoute>}
              />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
