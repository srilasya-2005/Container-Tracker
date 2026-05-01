import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  BarChart3,
  Users,
  ShieldCheck,
  PackageSearch,
  Wallet,
  Settings,
  ArrowRight,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Box,
  TrendingUp,
  FileText,
  Ship
} from 'lucide-react';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* 1. Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Box className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                Container <span className="text-primary">Trade Tracker</span>
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-primary font-medium text-sm transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-primary font-medium text-sm transition-colors">How It Works</a>
              <a href="#investors" className="text-slate-600 hover:text-primary font-medium text-sm transition-colors">For Investors</a>
              <a href="#pricing" className="text-slate-600 hover:text-primary font-medium text-sm transition-colors">Pricing</a>
              <a href="#about" className="text-slate-600 hover:text-primary font-medium text-sm transition-colors">About Us</a>
              <a href="#contact" className="text-slate-600 hover:text-primary font-medium text-sm transition-colors">Contact</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors">
                Login
              </Link>
              <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 py-4 px-4 space-y-4 shadow-lg absolute w-full">
            <a href="#features" className="block text-slate-600 hover:text-primary font-medium" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-slate-600 hover:text-primary font-medium" onClick={() => setIsMenuOpen(false)}>How It Works</a>
            <a href="#investors" className="block text-slate-600 hover:text-primary font-medium" onClick={() => setIsMenuOpen(false)}>For Investors</a>
            <a href="#pricing" className="block text-slate-600 hover:text-primary font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <a href="#contact" className="block text-slate-600 hover:text-primary font-medium" onClick={() => setIsMenuOpen(false)}>Contact</a>
            <div className="pt-4 border-t flex flex-col gap-3">
              <Link to="/login" className="w-full text-center px-5 py-2.5 text-primary border border-primary rounded-lg font-medium">Login</Link>
              <Link to="/login" className="w-full text-center px-5 py-2.5 text-white bg-primary rounded-lg font-medium">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* 2. Hero Section */}
      <section className="pt-20 pb-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 -z-10 skew-x-12 translate-x-32" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8">
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Track. Trade. <br />
                <span className="text-primary">Grow Together.</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                Container Trade Tracker helps you manage container sales, investments, and payouts — all in one secure platform. Built for traders, investors, and admins.
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/login" className="px-8 py-4 text-base font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 flex items-center gap-2 group">
                  Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#features" className="px-8 py-4 text-base font-medium text-primary border-2 border-primary rounded-lg hover:bg-primary/5 transition-colors">
                  Explore Features
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-slate-700">Secure & Reliable</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-slate-700">Real-time Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-slate-700">Investor Friendly</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-slate-700">Fast Performance</span>
                </div>
              </div>
            </div>

            {/* Dashboard Mockup (Right) */}
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-3xl transform rotate-3 scale-105" />
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 relative">
                {/* Mockup Header */}
                <div className="flex items-center justify-between border-b px-4 py-3 bg-slate-50 rounded-t-xl">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                       <span className="text-[10px]">🔔</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px]">A</div>
                  </div>
                </div>
                {/* Mockup Body */}
                <div className="flex h-[400px]">
                  {/* Sidebar */}
                  <div className="w-48 border-r border-slate-100 p-4 space-y-4">
                    <div className="h-8 bg-primary/10 text-primary rounded-md flex items-center px-3 gap-2 text-xs font-medium"><BarChart3 className="w-3 h-3"/> Dashboard</div>
                    <div className="h-8 hover:bg-slate-50 text-slate-600 rounded-md flex items-center px-3 gap-2 text-xs"><Box className="w-3 h-3"/> Containers</div>
                    <div className="h-8 hover:bg-slate-50 text-slate-600 rounded-md flex items-center px-3 gap-2 text-xs"><TrendingUp className="w-3 h-3"/> Sales</div>
                    <div className="h-8 hover:bg-slate-50 text-slate-600 rounded-md flex items-center px-3 gap-2 text-xs"><Wallet className="w-3 h-3"/> Investments</div>
                    <div className="h-8 hover:bg-slate-50 text-slate-600 rounded-md flex items-center px-3 gap-2 text-xs"><FileText className="w-3 h-3"/> Payouts</div>
                    <div className="h-8 hover:bg-slate-50 text-slate-600 rounded-md flex items-center px-3 gap-2 text-xs"><Users className="w-3 h-3"/> Users</div>
                  </div>
                  {/* Main Content Area */}
                  <div className="flex-1 p-6 bg-slate-50/50 space-y-6 overflow-hidden">
                    <div className="grid grid-cols-4 gap-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                          <div className="w-8 h-8 rounded bg-primary/10 mb-2" />
                          <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                          <div className="h-6 bg-slate-800 rounded w-3/4" />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4 h-48">
                       <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-end">
                          {/* Fake chart */}
                          <svg className="w-full h-24" viewBox="0 0 100 30" preserveAspectRatio="none">
                            <path d="M0,30 L10,20 L20,25 L30,10 L40,15 L50,5 L60,10 L70,2 L80,8 L90,0 L100,10 L100,30 Z" fill="rgba(29, 78, 216, 0.1)" />
                            <polyline points="0,30 10,20 20,25 30,10 40,15 50,5 60,10 70,2 80,8 90,0 100,10" fill="none" stroke="#1D4ED8" strokeWidth="1" />
                          </svg>
                       </div>
                       <div className="w-1/3 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-primary font-bold tracking-wider text-sm uppercase">Features</span>
          <h2 className="mt-3 text-4xl font-bold text-slate-900">Everything You Need in One Platform</h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-lg">
            Powerful tools to manage your container trading business efficiently.
          </p>

          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {[
              { icon: Box, title: "Container Management", desc: "Add, track, and update containers with all the important details in one place.", color: "text-blue-500", bg: "bg-blue-50" },
              { icon: TrendingUp, title: "Sales Tracking", desc: "Track sales, monitor transactions, and analyze revenue growth in real-time.", color: "text-green-500", bg: "bg-green-50" },
              { icon: Users, title: "Investor Management", desc: "Manage investors, track investments, and simplify returns management effortlessly.", color: "text-purple-500", bg: "bg-purple-50" },
              { icon: Wallet, title: "Payout Automation", desc: "Automate payout calculations and distributions with accuracy.", color: "text-amber-500", bg: "bg-amber-50" },
              { icon: BarChart3, title: "Reports & Analytics", desc: "Generate detailed reports and gain powerful insights with visual analytics.", color: "text-sky-500", bg: "bg-sky-50" },
              { icon: ShieldCheck, title: "Admin Control", desc: "Role-based access and complete control over your platform and data.", color: "text-red-500", bg: "bg-red-50" },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 group">
                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-primary font-bold tracking-wider text-sm uppercase">How It Works</span>
          <h2 className="mt-3 text-4xl font-bold text-slate-900">Simple Steps to Success</h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-lg mb-20">
            Track, manage, and grow your business in just a few simple steps.
          </p>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-slate-100 border-t border-dashed border-slate-300" />
            
            <div className="grid lg:grid-cols-3 gap-12 lg:gap-8 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-white border-4 border-slate-50 rounded-full flex items-center justify-center shadow-lg relative z-10 mb-6 group">
                   <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Box className="w-8 h-8" />
                   </div>
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm">1</div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Add Containers</h3>
                <p className="text-slate-600">Add your containers and keep all information organized.</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-white border-4 border-slate-50 rounded-full flex items-center justify-center shadow-lg relative z-10 mb-6 group">
                   <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                      <TrendingUp className="w-8 h-8" />
                   </div>
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm">2</div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Track Sales & Investments</h3>
                <p className="text-slate-600">Monitor sales, manage investor investments, and track performance.</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-white border-4 border-slate-50 rounded-full flex items-center justify-center shadow-lg relative z-10 mb-6 group">
                   <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <FileText className="w-8 h-8" />
                   </div>
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold border-4 border-white shadow-sm">3</div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Generate Reports & Payouts</h3>
                <p className="text-slate-600">Generate reports, calculate payouts, and grow your business.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Stats Strip */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900">100+</div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Active Users</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900">10K+</div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Containers Tracked</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900">$50M+</div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Sales</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900">$5M+</div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Payouts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. For Investors Section */}
      <section id="investors" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8">
              <span className="text-primary font-bold tracking-wider text-sm uppercase">For Investors</span>
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                Grow Your Investments <br /> With Confidence
              </h2>
              <p className="text-lg text-slate-600">
                Join our platform and start investing in container trading. Track your investments, earn returns, and receive timely payouts.
              </p>
              
              <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
                Become an Investor
              </Link>
              
              <div className="mt-8 flex items-center justify-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-sm">
                 {/* Illustration Placeholder */}
                 <div className="flex gap-4 items-end justify-center w-full h-32 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                       <Box className="w-32 h-32 text-primary" />
                    </div>
                    <div className="w-12 h-16 bg-blue-200 rounded-t-lg"></div>
                    <div className="w-12 h-24 bg-blue-400 rounded-t-lg"></div>
                    <div className="w-12 h-12 bg-green-300 rounded-t-lg"></div>
                    <div className="w-12 h-32 bg-primary rounded-t-lg"></div>
                 </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 w-full space-y-4">
              {[
                { title: "Secure Investments", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50" },
                { title: "Real-time Tracking", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
                { title: "Regular Returns", icon: Wallet, color: "text-purple-500", bg: "bg-purple-50" },
                { title: "Transparent Reports", icon: FileText, color: "text-amber-500", bg: "bg-amber-50" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-100 cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold text-slate-800">{item.title}</span>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Pricing Plans */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-primary font-bold tracking-wider text-sm uppercase">Pricing Plans</span>
          <h2 className="mt-3 text-4xl font-bold text-slate-900 mb-16">Choose the Perfect Plan for You</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-start text-left hover:shadow-lg transition-shadow mt-4">
              <h3 className="text-xl font-medium text-slate-600 mb-2">Starter</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-extrabold text-slate-900">Free</span>
              </div>
              <p className="text-slate-500 mb-8">Perfect for getting started</p>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-700">Up to 10 Containers</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-700">Basic Reports</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-700">Email Support</span>
                </li>
              </ul>
              
              <button className="w-full py-3.5 text-primary border-2 border-primary rounded-xl font-bold hover:bg-primary/5 transition-colors">
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white rounded-3xl p-8 border-2 border-primary shadow-xl shadow-primary/10 flex flex-col items-start text-left relative transform md:-translate-y-4 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide shadow-sm">
                Most Popular
              </div>
              <h3 className="text-xl font-medium text-slate-600 mb-2">Pro</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-extrabold text-slate-900">$29</span>
                <span className="text-slate-500 font-medium">/month</span>
              </div>
              <p className="text-slate-500 mb-8">Great for growing businesses</p>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-slate-700 font-medium">Up to 100 Containers</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-slate-700 font-medium">Advanced Reports</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-slate-700 font-medium">Priority Support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-slate-700 font-medium">Expert Data</span>
                </li>
              </ul>
              
              <button className="w-full py-3.5 text-white bg-primary rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
                Start Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-start text-left hover:shadow-lg transition-shadow mt-4">
              <h3 className="text-xl font-medium text-slate-600 mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-extrabold text-slate-900">$99</span>
                <span className="text-slate-500 font-medium">/month</span>
              </div>
              <p className="text-slate-500 mb-8">For large scale operations</p>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-700">Unlimited Containers</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-700">Advanced Analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-700">Dedicated Support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-slate-700">Custom Solutions</span>
                </li>
              </ul>
              
              <button className="w-full py-3.5 text-primary border-2 border-primary rounded-xl font-bold hover:bg-primary/5 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Testimonials Section */}
      <section className="py-24 bg-slate-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-primary font-bold tracking-wider text-sm uppercase">Testimonials</span>
          
          <div className="mt-12 relative">
             <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
                {[
                  { name: "John Smith", role: "Container Trader", quote: "This platform has transformed how we manage our container business. The insights are incredible!" },
                  { name: "Sarah Johnson", role: "Investor", quote: "Great platform for investors. Transparent, reliable, and easy to use." },
                  { name: "Mike Davis", role: "Business Owner", quote: "The automated payouts and reports save us so much time. Highly recommended!" }
                ].map((testimonial, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-left min-w-[350px] snap-center">
                    <p className="text-slate-600 text-lg italic mb-8 relative">
                      <span className="text-4xl text-slate-200 absolute -top-4 -left-2 font-serif">"</span>
                      {testimonial.quote}
                      <span className="text-4xl text-slate-200 absolute -bottom-6 font-serif">"</span>
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-xl">
                          {testimonial.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{testimonial.name}</div>
                          <div className="text-sm text-slate-500">{testimonial.role}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
             </div>
             
             {/* Navigation Arrows */}
             <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-primary transition-colors hidden md:flex z-10">
                <ChevronLeft className="w-6 h-6" />
             </button>
             <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-600 hover:text-primary transition-colors hidden md:flex z-10">
                <ChevronRight className="w-6 h-6" />
             </button>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer id="contact" className="bg-white pt-24 pb-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16 mb-16">
            
            {/* Contact Info */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                  <Box className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Get In Touch</h3>
              </div>
              <p className="text-slate-600 mb-8">
                Have questions? We're here to help. Contact us and we'll get back to you soon.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-600">
                  <Mail className="w-5 h-5 text-primary" />
                  <a href="mailto:hello@containertradetracker.com" className="hover:text-primary">hello@containertradetracker.com</a>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <Phone className="w-5 h-5 text-primary" />
                  <a href="tel:+15551234567" className="hover:text-primary">+1 (555) 123-4567</a>
                </div>
                <div className="flex items-start gap-4 text-slate-600">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <span>123 Business Ave, Suite 100,<br />New York, NY 10001</span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Your Name</label>
                    <input type="text" placeholder="John Doe" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Your Email</label>
                    <input type="email" placeholder="john@example.com" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Subject</label>
                  <select className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white text-slate-600">
                    <option>How can we help you?</option>
                    <option>Sales Inquiry</option>
                    <option>Support</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Your Message</label>
                  <textarea rows="4" placeholder="Type your message..." className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white resize-none"></textarea>
                </div>
                <button type="button" className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                  Send Message
                </button>
              </form>
            </div>

            {/* Illustration */}
            <div className="hidden lg:flex flex-col items-center justify-end relative h-full pb-8">
               <div className="w-full h-48 bg-blue-50/50 rounded-t-3xl relative overflow-hidden flex items-end justify-center">
                  <Ship className="w-32 h-32 text-slate-300 absolute -left-10 bottom-4" />
                  <div className="flex gap-1 mb-2 relative z-10">
                     <div className="w-10 h-10 bg-blue-500 rounded-sm"></div>
                     <div className="w-10 h-10 bg-green-500 rounded-sm"></div>
                     <div className="w-10 h-10 bg-red-500 rounded-sm"></div>
                     <div className="w-10 h-10 bg-orange-500 rounded-sm"></div>
                  </div>
                  <div className="absolute bottom-0 w-full h-2 bg-slate-800"></div>
               </div>
            </div>

          </div>

          {/* Bottom Footer Links */}
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Box className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-slate-900">
                Container <span className="text-primary">Trade Tracker</span>
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-slate-600 font-medium">
              <div className="space-y-2">
                 <h4 className="text-slate-900 font-bold mb-3">Quick Links</h4>
                 <a href="#features" className="block hover:text-primary">Features</a>
                 <a href="#how-it-works" className="block hover:text-primary">How It Works</a>
                 <a href="#investors" className="block hover:text-primary">For Investors</a>
              </div>
              <div className="space-y-2">
                 <h4 className="text-slate-900 font-bold mb-3">Platform</h4>
                 <a href="#" className="block hover:text-primary">Dashboard</a>
                 <a href="#" className="block hover:text-primary">Containers</a>
                 <a href="#" className="block hover:text-primary">Sales</a>
              </div>
              <div className="space-y-2">
                 <h4 className="text-slate-900 font-bold mb-3">Support</h4>
                 <a href="#" className="block hover:text-primary">Help Center</a>
                 <a href="#" className="block hover:text-primary">Documentation</a>
                 <a href="#" className="block hover:text-primary">Privacy Policy</a>
              </div>
              <div className="space-y-2">
                 <h4 className="text-slate-900 font-bold mb-3">Company</h4>
                 <a href="#" className="block hover:text-primary">About Us</a>
                 <a href="#" className="block hover:text-primary">Careers</a>
                 <a href="#" className="block hover:text-primary">Contact Us</a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200 text-slate-500 text-sm">
             <div className="flex gap-4 mb-4 md:mb-0">
                <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
             </div>
             <p>© 2024 Container Trade Tracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
