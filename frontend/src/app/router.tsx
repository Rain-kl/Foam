import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AnonymousBoundary, AuthBoundary } from '@/app/auth-boundary';
import {
  DeferredAppShell,
  DeferredExampleChatPage,
  DeferredExampleComponentPage,
  DeferredExampleDashboardPage,
  DeferredExampleTablePage,
  DeferredSettingsPage,
} from '@/app/deferred-pages';
import { LoginPage } from '@/features/auth/login-page';

const defaultAuthedPath = '/example/page/dashboard';

export const router = createBrowserRouter([
  {
    element: <AnonymousBoundary />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <AuthBoundary />,
    children: [
      {
        element: <DeferredAppShell />,
        children: [
          { index: true, element: <Navigate to={defaultAuthedPath} replace /> },
          {
            path: '/example/component',
            element: <DeferredExampleComponentPage />,
          },
          {
            path: '/example/page/dashboard',
            element: <DeferredExampleDashboardPage />,
          },
          {
            path: '/example/page/table',
            element: <DeferredExampleTablePage />,
          },
          { path: '/example/page/chat', element: <DeferredExampleChatPage /> },
          {
            path: '/dashboard',
            element: <Navigate to={defaultAuthedPath} replace />,
          },
          {
            path: '/accounts',
            element: <Navigate to={defaultAuthedPath} replace />,
          },
          {
            path: '/models',
            element: <Navigate to={defaultAuthedPath} replace />,
          },
          {
            path: '/creative-console',
            element: <Navigate to='/example/page/chat' replace />,
          },
          {
            path: '/client-keys',
            element: <Navigate to={defaultAuthedPath} replace />,
          },
          {
            path: '/gallery',
            element: <Navigate to='/example/component' replace />,
          },
          {
            path: '/video-gallery',
            element: <Navigate to='/example/component' replace />,
          },
          {
            path: '/request-audits',
            element: <Navigate to='/example/page/table' replace />,
          },
          {
            path: '/docs',
            element: <Navigate to={defaultAuthedPath} replace />,
          },
          {
            path: '/docs/:category/:endpoint',
            element: <Navigate to={defaultAuthedPath} replace />,
          },
          { path: '/settings', element: <DeferredSettingsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={defaultAuthedPath} replace /> },
]);
