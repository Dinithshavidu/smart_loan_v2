import { createRouter, createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { providersRoute } from './routes/providers';
import { loanTypesRoute } from './routes/loan-types';
import { providerPoliciesRoute } from './routes/provider-policies';
import { loansRoute } from './routes/loans';
import { customersRoute } from './routes/customers';
import { approvalsRoute } from './routes/approvals';
import { collectorsRoute } from './routes/collectors';
import { policiesRoute } from './routes/policies';
import { historyRoute } from './routes/history';

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  providersRoute,
  loanTypesRoute,
  providerPoliciesRoute,
  loansRoute,
  customersRoute,
  approvalsRoute,
  collectorsRoute,
  policiesRoute,
  historyRoute,
  catchAllRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
