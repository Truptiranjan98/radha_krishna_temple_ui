import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider, Spinner } from './components/Bits';
import { IntroProvider } from './lib/intro';
import Layout from './components/Layout';
import SignIn from './pages/SignIn';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Gallery from './pages/Gallery';
import PujaBooking from './pages/PujaBooking';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminBookings from './pages/AdminBookings';
import Profile from './pages/Profile';

/**
 * Everything that writes is admin-only now, so `Protected` always means
 * "admin". A signed-out visitor is sent to sign-in; a signed-in non-admin
 * (a legacy priest or devotee account created before self sign-up closed)
 * is sent back to the front page rather than shown a wall.
 */
function AdminOnly({ children }) {
  const { user, booting, isAdmin } = useAuth();
  if (booting) return <Spinner label="One moment" />;
  if (!user) return <Navigate to="/signin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, booting } = useAuth();
  if (booting) return <Spinner label="One moment" />;
  return user ? <Navigate to="/" replace /> : children;
}

/**
 * React Router keeps the browser's scroll position across navigations —
 * fine for a back/forward restore, wrong for a fresh link click. Without
 * this, scrolling down on Calendar, visiting another tab and coming back
 * lands you exactly where you left off instead of at the top of the page.
 */
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
      <ToastProvider>
        <AuthProvider>
          {/*
            IntroProvider owns the peacock-feather curtain. It plays on every
            mount — so every refresh and every fresh landing gets it — and any
            page below can replay it through useIntro(). It sits inside
            AuthProvider so routed pages can reach both.
          */}
          <IntroProvider>
            <Routes>
              <Route
                path="/signin"
                element={
                  <PublicOnly>
                    <SignIn />
                  </PublicOnly>
                }
              />

              {/*
                The temple's public face. Timings, the calendar, the gallery and
                puja booking all work with no account — a devotee checking
                whether Sandhya Arati is at 7:00 or 7:15, or asking for a
                Satyanarayana Puja, should never meet a login wall.
              */}
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/puja" element={<PujaBooking />} />

                {/* Admin-only from here down. */}
                <Route
                  path="/mine"
                  element={
                    <AdminOnly>
                      <Gallery mine />
                    </AdminOnly>
                  }
                />
                <Route
                  path="/upload"
                  element={
                    <AdminOnly>
                      <Upload />
                    </AdminOnly>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AdminOnly>
                      <Profile />
                    </AdminOnly>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminOnly>
                      <Admin />
                    </AdminOnly>
                  }
                />
                <Route
                  path="/admin/notices"
                  element={
                    <AdminOnly>
                      <AdminAnnouncements />
                    </AdminOnly>
                  }
                />
                <Route
                  path="/admin/bookings"
                  element={
                    <AdminOnly>
                      <AdminBookings />
                    </AdminOnly>
                  }
                />
              </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </IntroProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
