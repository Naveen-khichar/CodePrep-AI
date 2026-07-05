"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, loginWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Problems", href: "/problems" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Submissions", href: "/submissions" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-custom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-8 h-8 text-brand-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2L18.0001 6.0001M18.0001 6.0001L14 10M18.0001 6.0001H6C4.89543 6.0001 4 6.89553 4 8.0001V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-extrabold text-xl tracking-tight text-gradient">
                CodePrep AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-1 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                    : "text-gray-300 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Authentication Panel */}
          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-white">
                    {user.displayName}
                  </span>
                  <span className="text-xs text-gray-400">{user.email}</span>
                </div>
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Avatar"}
                    className="w-9 h-9 rounded-full border border-white/10"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-500/30 text-xs font-semibold text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="block h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass-panel border-t border-custom px-2 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium transition-all ${
                isActive(link.href)
                  ? "bg-brand-primary/15 text-brand-primary border border-brand-primary/20"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Mobile Auth Options */}
          <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between px-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-3">
                  {user.photoURL && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Avatar"}
                      className="w-9 h-9 rounded-full border border-white/10"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">{user.displayName}</span>
                    <span className="text-xs text-gray-400">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full text-center mt-2 px-3 py-2 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 text-sm font-semibold transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  loginWithGoogle();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
