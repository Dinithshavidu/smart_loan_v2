import { createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuth } from '../lib/auth-context';
import { Layout } from '../components/layout';
import Login from './login';

function RootComponent() {
  const { token } = useAuth();

  if (!token) return <Login />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export const rootRoute = createRootRoute({
  component: RootComponent,
});
