import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './Home/Header';
import RequiredAuth from './Auth/RequireAuth';

// Lazy-loaded routes for better performance
const LandingPage = lazy(() => import('./Home/LandingPage'));
const Login = lazy(() => import('./Auth/Login'));
const Explore = lazy(() => import('./User/NewExplore')); // Using the new explore component
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
  const hideHeaderPaths = ['/', '/login', '/signup', '/creator-signup'];
  const hideHeader = hideHeaderPaths.includes(pathname);

  return (
    <div className="App">
      {!hideHeader && <Header />}
      <Suspense fallback={<div className="loading-screen">Loading...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/entry" element={<Entry />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/creator/:handle" element={<CreatorProfile />} />
          <Route path="/creator-signup" element={<CreatorSignup />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route element={<RequiredAuth />}>
            <Route
              path="/home"
              element={
                <>
                  <Cards />
                  <SwipeButtons />
                </>
              }
            />
            <Route path="/upload" element={<Upload />} />
            <Route path="/video/call" element={<VideoCallComponent />} />
            <Route path="/creator-dashboard" element={<CreatorDashboard />} />
          </Route>

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
