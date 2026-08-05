import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import AppDetail from './pages/AppDetail';
import DownloadPage from './pages/DownloadPage';
import TopList from './pages/TopList';
import Categories from './pages/Categories';
import SearchPage from './pages/SearchPage';
import RequestPage from './pages/RequestPage';
import Profile from './pages/Profile';
import About from './pages/About';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
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
      </Layout>
    </BrowserRouter>
  );
}
