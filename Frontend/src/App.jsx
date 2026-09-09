import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter as Router, Link, Navigate, NavLink, Route, Routes, useNavigate } from "react-router";
import { Bookmark, Compass, LogIn, LogOut, Menu, Moon, PenLine, Search, Shield, Sun, UserPlus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { checkAuth, logout } from "./utility/api";
import { AuthContext, useAuth } from "./authContext";

const Home = lazy(() => import("./pages/Home"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Editor = lazy(() => import("./pages/Editor"));
const Login = lazy(() => import("./pages/Login"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

function useAuthProvider() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const currentUser = await checkAuth();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const signOut = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
    }
  };

  return { user, setUser, loading, refreshUser, signOut };
}

const MotionDiv = motion.div;

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="grid min-h-[50vh] place-items-center text-sm font-black uppercase tracking-[0.18em] text-stone-500">Checking session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles?.length && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children;
}

function Navbar({ theme, toggleTheme }) {
  const [open, setOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const canCreate = user && ["author", "admin"].includes(user.role);

  const handleLogout = async () => {
    await signOut();
    setOpen(false);
    navigate("/");
  };

  const handleNavSearch = (event) => {
    event.preventDefault();
    const query = navSearch.trim();
    setOpen(false);
    if (!query) {
      navigate("/search");
      return;
    }
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const navLinks = [
    { to: "/#categories", label: "Categories" },
    ...(user ? [{ to: "/bookmarks", label: "Bookmarks", icon: Bookmark }] : []),
    ...(user ? [{ to: "/dashboard", label: "Dashboard" }] : []),
    ...(canCreate ? [{ to: "/editor", label: "Write" }] : []),
  ];

  return (
    <header className="homepage-nav sticky top-0 z-50 border-b backdrop-blur-2xl">
      <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <img src="/articlehub-logo.svg" alt="" className="brand-logo h-10 w-10 shadow-xl shadow-stone-950/15 transition group-hover:scale-105" aria-hidden="true" />
          <span className="brand-text text-lg font-black tracking-tight">ARTICLE HUB</span>
        </Link>

        <nav className="nav-pill hidden items-center gap-2 rounded-full border p-1 shadow-sm md:flex">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${isActive ? "bg-stone-950 text-white shadow-sm" : "text-stone-600 hover:bg-white hover:text-stone-950"}`
              }
            >
              {item.icon && <item.icon size={15} />}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={handleNavSearch} className="nav-search hidden lg:flex">
          <Search size={16} />
          <input
            value={navSearch}
            onChange={(event) => setNavSearch(event.target.value)}
            aria-label="Search articles"
            placeholder="Search articles"
          />
        </form>

        <div className="hidden items-center gap-3 md:flex">
          <button type="button" onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb">{theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}</span>
            </span>
          </button>
          {user ? (
            <>
              <span className="inline-flex items-center gap-2 border border-stone-200 px-3 py-2 text-xs font-bold text-stone-600">
                <Shield size={14} />
                {user.role}
              </span>
              <button type="button" onClick={handleLogout} className="icon-button" title="Logout" aria-label="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="ghost-button">
                <UserPlus size={16} />
                Register
              </Link>
              <Link to="/login" className="premium-button">
                <LogIn size={16} />
                Login
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button type="button" onClick={toggleTheme} className="icon-button" title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button type="button" onClick={() => setOpen((value) => !value)} className="icon-button" title="Menu" aria-label="Open navigation menu" aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <MotionDiv
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mobile-menu border-t px-4 py-4 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-2">
              <form onSubmit={handleNavSearch} className="nav-search mobile">
                <Search size={16} />
                <input
                  value={navSearch}
                  onChange={(event) => setNavSearch(event.target.value)}
                  aria-label="Search articles"
                  placeholder="Search articles"
                />
              </form>
              {navLinks.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="theme-text flex items-center gap-2 px-2 py-3 font-bold">
                  {item.icon && <item.icon size={17} />}
                  {item.label}
                </Link>
              ))}
              {user ? (
                <button onClick={handleLogout} className="px-2 py-3 text-left font-bold text-red-600">
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/register" onClick={() => setOpen(false)} className="px-2 py-3 font-bold text-stone-700">
                    Register
                  </Link>
                  <Link to="/login" onClick={() => setOpen(false)} className="px-2 py-3 font-bold text-stone-950">
                    Login
                  </Link>
                </>
              )}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-stone-950 text-white">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img src="/articlehub-logo.svg" alt="" className="brand-logo h-8 w-8" aria-hidden="true" />
            <span className="font-black">ARTICLE HUB</span>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-6 text-stone-400">
            A premium publishing ecosystem for readers, authors, and editors who care about ideas with texture.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-stone-400">
          <Compass size={15} />
          Reader-first
          <PenLine size={15} />
          Author-ready
          <Search size={15} />
          Built for discovery
        </div>
      </div>
    </footer>
  );
}

function RouteLoader() {
  return (
    <div className="grid min-h-[58vh] place-items-center px-4">
      <div className="premium-card flex items-center gap-3 px-6 py-5 text-sm font-black uppercase tracking-[0.18em] text-stone-500" role="status" aria-live="polite">
        <span className="loader-dot" />
        Loading Article Hub...
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuthProvider();
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("articlehub-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("articlehub-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((value) => value === "dark" ? "light" : "dark");

  return (
    <AuthContext.Provider value={auth}>
      <Router>
        <div className="app-shell">
          <a href="#main-content" className="skip-link">Skip to content</a>
          <Navbar theme={theme} toggleTheme={toggleTheme} />
          <main id="main-content" className="min-h-[calc(100vh-15rem)]" tabIndex={-1}>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchPage />} />
                <Route
                  path="/bookmarks"
                  element={
                    <ProtectedRoute>
                      <Bookmarks />
                    </ProtectedRoute>
                  }
                />
                <Route path="/category/:category" element={<CategoryPage />} />
                <Route path="/article/:slug" element={<ArticleDetail />} />
                <Route path="/login" element={<Login mode="login" />} />
                <Route path="/register" element={<Login mode="register" />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor"
                  element={
                    <ProtectedRoute roles={["author", "admin"]}>
                      <Editor />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
