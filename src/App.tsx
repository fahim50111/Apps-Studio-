import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Layout from './components/Layout';
import RouteFallback from './components/RouteFallback';
import ErrorBoundary from './components/ErrorBoundary';
import PageMotion from './components/PageMotion';

/* Route-level code splitting — each page is its own chunk. */
const Home = lazy(() => import('./pages/Home'));
const AppDetail = lazy(() => import('./pages/AppDetail'));
const DownloadPage = lazy(() => import('./pages/DownloadPage'));
const TopList = lazy(() => import('./pages/TopList'));
const Categories = lazy(() => import('./pages/Categories'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const RequestPage = lazy(() => import('./pages/RequestPage'));
const Profile = lazy(() => import('./pages/Profile'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RoutedApp() {
  const location = useLocation();
  return (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
        <ErrorBoundary resetKey={location.pathname}>
          <PageMotion>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/app/:id" element={<AppDetail />} />
            <Route path="/download/:id" element={<DownloadPage />} />
            <Route path="/toplist" element={<TopList />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/request" element={<RequestPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </PageMotion>
        </ErrorBoundary>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <RoutedApp />
    </BrowserRouter>
  );
}
