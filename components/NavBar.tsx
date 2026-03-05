'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserInfo {
  email: string;
}

export default function NavBar() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function checkToken() {
      const token = localStorage.getItem('sunshine_token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ email: payload.email });
        } catch {
          localStorage.removeItem('sunshine_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }

    checkToken();

    // Listen for token changes from other components (login/signup/logout)
    window.addEventListener('storage', checkToken);
    // Custom event for same-tab updates
    window.addEventListener('auth-change', checkToken);
    return () => {
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('auth-change', checkToken);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sunshine_token');
    setUser(null);
    window.location.href = '/';
  };

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/search', label: 'Search' },
    { href: '/trends', label: 'Trends' },
    { href: '/collections', label: 'Collections' },
    { href: '/analysis', label: 'Analysis' },
  ];

  return (
    <nav className="bg-sunshine-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <svg
                className="h-8 w-8 text-sunshine-100"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
              <span className="text-white text-xl font-bold tracking-tight">
                SunshineTracker
              </span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sunshine-100 hover:bg-sunshine-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <span className="text-sunshine-100 text-sm">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-sunshine-800 text-sunshine-100 hover:bg-sunshine-900 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sunshine-100 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-white text-sunshine-700 hover:bg-sunshine-50 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-sunshine-100 hover:text-white p-2 rounded-md"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-sunshine-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sunshine-100 hover:bg-sunshine-800 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-sunshine-500 px-4 py-3">
            {user ? (
              <div className="space-y-2">
                <p className="text-sunshine-100 text-sm">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="bg-sunshine-800 text-sunshine-100 hover:bg-sunshine-900 w-full text-left px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/auth/login"
                  className="text-sunshine-100 hover:text-white block px-3 py-2 rounded-md text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-white text-sunshine-700 block px-3 py-2 rounded-md text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
