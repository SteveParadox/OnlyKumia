import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './Home/Header';

// Lazy-loaded routes
const LandingPage = lazy(() => import('./Home/LandingPage'));
const Login = lazy(() => import('./Auth/Login'));
const Explore = lazy(() => import('./User/NewExplore'));
const Cards = lazy(() => import('./Home/Cards'));
const SwipeButtons = lazy(() => import('./Home/SwipeButtons'));
const Upload = lazy(() => import('./User/Upload'));
const CreatorProfile = lazy(() => import('./Components/CreatorProfile'));
const VideoCallComponent = lazy(() => import('./Service/VideoCall'));
const Entry = lazy(() => import('./Home/Entry'));
const ErrorPage = lazy(() => import('./Home/Error'));
const CreatorSignup = lazy(() => import('./Pages/CreatorSignUp'));
const Signup = lazy(() => import('./Pages/Signup'));
const CreatorDashboard = lazy(() => import('./Pages/CreatorDashboard'));
const Test = lazy(() => import('./Home/test'));

const App = () => {
  const { pathname } = useLocation();

  // Hide header only on specific public pages
  const hideHeaderPaths = ['/', '/login', '/signup', '/creator-signup', '/entry'];
  const hideHeader = hideHeaderPaths.includes(pathname);

  return (
    <div className="App">
      {!hideHeader && <Header />}
      <Suspense fallback={<div className="loading-screen">Loading...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/entry" element={<Entry />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/creator-signup" element={<CreatorSignup />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/creator/:handle" element={<CreatorProfile />} />

          {/* Previously Protected Routes (now fully public for testing) */}
          <Route path="/home" element={<><Cards /><SwipeButtons /></>} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/video/call" element={<VideoCallComponent />} />
          <Route path="/creator-dashboard" element={<CreatorDashboard />} />

          {/* Utility + Testing */}
          <Route path="/test" element={<Test />} />

          {/* Catch-all */}
          <Route path="*" element={<ErrorPage />} />
          <Route path="/404" element={<Navigate to="*" />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
