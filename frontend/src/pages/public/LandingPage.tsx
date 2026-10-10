import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Laptop, Award, ShieldCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg leading-tight block">SmartCampus</span>
              <span className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">Resource Booking System</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm transition"
              >
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-brand-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm transition"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-6 text-center max-w-4xl mx-auto flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-medium mb-6 mx-auto">
          <ShieldCheck className="w-3.5 h-3.5" /> Verified Campus Concurrency & Resource Engine
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Centralized Campus Resource <br />
          <span className="text-brand-600">Reservation Platform</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Streamline university facility scheduling. Eliminate paper registers and double-bookings
          across smart classrooms, high-performance computing laboratories, and campus auditoriums.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? '/resources' : '/login'}
            className="px-6 py-3 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-md shadow-brand-500/20 transition flex items-center gap-2"
          >
            Explore Campus Facilities <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 text-sm font-semibold bg-white text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
          >
            Sign In with University ID
          </Link>
        </div>

        {/* 3 Categories Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-300 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Smart Classrooms</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Tiered lecture halls and seminar studios equipped with smart whiteboards, digital podiums, and lecture recording.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-brand-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Capacity: 30 - 80 seats
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-300 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Academic & GPU Labs</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              High-performance computing, AI workstations, data science terminals, and cybersecurity network testbeds.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-purple-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Capacity: 35 - 50 terminals
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-300 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Campus Auditoriums</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Large-scale event halls for convocations, research symposiums, guest lectures, and cultural ceremonies.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-indigo-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Capacity: 200 - 500 attendees
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>Smart Campus Resource Booking System &copy; 2026. Enterprise Academic Operations.</p>
      </footer>
    </div>
  );
};
