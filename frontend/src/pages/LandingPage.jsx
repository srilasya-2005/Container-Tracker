import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu, X, PlayCircle, Plus, 
  Trash2, User, DollarSign,
  Box, TrendingUp, PieChart, Shield,
  ArrowRight, Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import containerImg from '../assets/Container.png';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafc] font-sans text-slate-900 overflow-x-hidden">
      {/* 1. Navigation */}
      <nav className="absolute top-0 w-full z-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src="/lmh.png" alt="LMH Trading" className="w-10 h-10 object-contain rounded" />
              <span className="font-bold text-xl tracking-tight text-slate-900">LMH trading</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center space-x-10">
              <a href="#" className="text-blue-600 font-medium text-sm border-b-2 border-blue-600 pb-1">Home</a>
              <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">How it works</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Pricing</a>
              <div className="group relative">
                <button className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors flex items-center gap-1">
                  Resources <span className="text-[10px]">▼</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="hidden lg:flex items-center space-x-6">
              <Link to="/login" className="text-sm font-medium text-slate-800 hover:text-slate-600 transition-colors">
                Log in
              </Link>
              <Link to="/login" className="px-6 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-[45%] z-10 space-y-8 relative"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50">
                <span className="text-sm font-semibold text-blue-600">#1 Container Trading Platform</span>
              </div>
              
              <h1 className="text-5xl lg:text-[4.5rem] leading-[1.05] font-extrabold tracking-[-0.02em] text-slate-900">
                The <span className="text-blue-600">future</span> of <br/>container trading<br/>is here
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-500 max-w-lg leading-relaxed">
                Track, manage and grow your container investments with powerful analytics and real-time insights.
              </p>
              
              <div className="flex items-center gap-4 pt-4">
                <Link to="/login" className="px-8 py-4 text-base font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 flex items-center gap-2">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="px-6 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                  Watch Demo <PlayCircle className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex items-center gap-4 pt-6">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                    <img src="https://i.pravatar.cc/100?img=11" alt="user" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                    <img src="https://i.pravatar.cc/100?img=12" alt="user" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                    <img src="https://i.pravatar.cc/100?img=13" alt="user" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  Join 1,200+ investors<br/>who trust LMH trading
                </p>
              </div>
            </motion.div>

            {/* Right Graphic area */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="lg:w-[55%] relative mt-16 lg:mt-0 h-[600px] flex items-center justify-center"
            >
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -z-10" />

              {/* Main Container Image */}
              <div className="relative w-[90%] z-0 translate-x-12">
                <img src={containerImg} alt="Container" className="w-full h-auto drop-shadow-2xl scale-110" />
                
                {/* Floating Card: Total Revenue */}
                <div className="absolute -top-12 -left-10 bg-white/90 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-slate-100 z-10 w-64 animate-[float_6s_ease-in-out_infinite]">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Total Revenue</p>
                      <p className="text-xl font-bold text-slate-900">$23.41M</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">+12.5%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-3">vs last month</p>
                  <svg className="w-full h-10" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path d="M0,30 L10,25 L20,28 L30,15 L40,20 L50,8 L60,12 L70,5 L80,10 L90,2 L100,5 L100,30 Z" fill="rgba(37, 99, 235, 0.1)" />
                    <polyline points="0,30 10,25 20,28 30,15 40,20 50,8 60,12 70,5 80,10 90,2 100,5" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Floating Card: Active Containers */}
                <div className="absolute top-48 -left-32 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-100 z-10 w-56 animate-[float_5s_ease-in-out_infinite_1s]">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                         <Trash2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                         <p className="text-[10px] text-slate-500 font-medium">Active Containers</p>
                         <p className="text-lg font-bold text-slate-900">1,248</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold text-emerald-500">+8.2%</span>
                      <span className="text-[10px] text-slate-400">Across 32 locations</span>
                   </div>
                </div>

                {/* Floating Card: Active Investors */}
                <div className="absolute -top-4 -right-16 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-100 z-10 animate-[float_7s_ease-in-out_infinite_0.5s]">
                   <div className="flex items-center justify-between gap-6">
                     <div>
                       <p className="text-[10px] text-slate-500 font-medium">Active<br/>Investors</p>
                       <p className="text-lg font-bold text-slate-900">856</p>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                     </div>
                   </div>
                   <div className="mt-1 text-right">
                     <span className="text-[10px] font-bold text-emerald-500">+18.3%</span>
                     <p className="text-[9px] text-slate-400 mt-0.5">vs last month</p>
                   </div>
                </div>

                {/* Floating Card: Profit This Month */}
                <div className="absolute bottom-12 -right-8 bg-white/90 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-slate-100 z-10 w-64 animate-[float_6s_ease-in-out_infinite_1.5s]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Profit This Month</p>
                      <div className="flex items-baseline gap-2">
                         <p className="text-xl font-bold text-slate-900">$3.92M</p>
                         <span className="text-[10px] font-bold text-emerald-500">+18.7%</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">$</div>
                  </div>
                  <div className="flex items-end gap-1.5 h-12">
                     {[40, 60, 45, 80, 55, 75, 40, 60, 90, 70, 85, 60, 40].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
                     ))}
                  </div>
                </div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. Stats Strip */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="relative z-20 max-w-[1200px] mx-auto px-6 -mt-10 lg:-mt-16"
      >
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 lg:p-10 flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
               <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2"/><line x1="8" y1="10" x2="16" y2="10" strokeWidth="2"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">23.41B+</p>
              <p className="text-xs text-slate-500 font-medium">Transactions Annually</p>
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-slate-100"></div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
               <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">57%+</p>
              <p className="text-xs text-slate-500 font-medium">Of the world's transactions</p>
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-slate-100"></div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
               <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M8 14s1.5 2 4 2 4-2 4-2" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" strokeLinecap="round"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">94%+</p>
              <p className="text-xs text-slate-500 font-medium">Customer Satisfaction</p>
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-slate-100"></div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
               <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">99.9%</p>
              <p className="text-xs text-slate-500 font-medium">Platform Uptime</p>
            </div>
          </div>

        </div>
      </motion.section>



      {/* 5. Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 mb-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">POWERFUL FEATURES</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-900">Everything you need to scale</h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Card 1 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.6 }}
              className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 group hover:-translate-y-1 transition-transform"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                 <Box className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Container Management</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Track and manage all your containers in one place with real-time updates and smart alerts.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.6 }}
              className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 group hover:-translate-y-1 transition-transform"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                 <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Investment Tracking</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Monitor your investments, returns and performance in real-time with advanced analytics.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.6 }}
              className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 group hover:-translate-y-1 transition-transform"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                 <PieChart className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Advanced Analytics</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Get powerful insights with interactive charts and custom reports to make smarter decisions.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </motion.div>

            {/* Card 4 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.6 }}
              className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 group hover:-translate-y-1 transition-transform"
            >
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-6">
                 <Shield className="w-6 h-6 text-sky-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Secure & Reliable</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Bank-level security to protect your data and transactions with 99.9% uptime guarantee.
              </p>
              <a href="#" className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* 6. Bottom CTA */}
      <section className="py-24">
        <div className="max-w-[1300px] mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-[#f2f6fc] rounded-[2.5rem] p-12 lg:p-20 flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative"
          >
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-[45%] z-10"
            >
              <div className="w-14 h-14 bg-[#e8f0fe] rounded-2xl flex items-center justify-center mb-8">
                 <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><polyline points="21 15 16 10 5 21" /></svg>
              </div>
              <h2 className="text-4xl lg:text-[2.75rem] font-bold text-[#111827] leading-[1.1] mb-6 tracking-tight">
                Ready to grow your<br/>container investments?
              </h2>
              <p className="text-[#4b5563] text-lg mb-10 max-w-md leading-relaxed">
                Join thousands of investors who are scaling their portfolio with LMH trading.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/login" className="px-7 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 flex items-center gap-2">
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="px-7 py-3.5 text-base font-semibold text-[#374151] bg-white rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  Contact Sales
                </button>
              </div>
            </motion.div>

            {/* Right Dashboard Mockup */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4 }}
              className="lg:w-[55%] relative"
            >
               {/* Fade out on left edge */}
               <div className="absolute inset-0 bg-gradient-to-r from-[#f2f6fc] via-transparent to-transparent z-20 w-16 left-0" />
               
               <div className="bg-white rounded-l-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 w-[120%] lg:w-[850px] h-[500px] translate-x-4 flex flex-col relative overflow-hidden">
                  
                  {/* Mockup Navbar */}
                  <div className="flex justify-between items-center px-8 py-4 border-b border-slate-50">
                     <div className="flex items-center gap-2">
                       <img src="/lmh.png" alt="LMH Trading" className="w-6 h-6 object-contain rounded-sm" />
                       <span className="font-bold text-sm tracking-tight text-slate-800">LMH trading</span>
                     </div>
                     <div className="flex items-center gap-4">
                       <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center"><div className="w-3 h-3 bg-slate-200 rounded-sm"></div></div>
                       <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center"><div className="w-3 h-3 bg-slate-200 rounded-full"></div></div>
                       <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center"><div className="w-3 h-3 bg-slate-200 rounded-full"></div></div>
                       <div className="w-8 h-8 rounded-full bg-slate-800 ml-2 overflow-hidden border-2 border-white shadow-sm">
                         <img src="https://i.pravatar.cc/100?img=11" alt="avatar" />
                       </div>
                     </div>
                  </div>

                  <div className="flex h-full">
                     {/* Mockup Sidebar */}
                     <div className="w-48 border-r border-slate-50 p-4 space-y-1 shrink-0">
                        <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-slate-400 font-medium">
                          <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Home
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-white font-bold bg-blue-600 rounded-xl shadow-sm shadow-blue-600/20">
                          <div className="w-3 h-3 bg-white/80 rounded-sm"></div> Dashboard
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-slate-400 font-medium">
                          <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Containers
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-slate-400 font-medium">
                          <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Investments
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-slate-400 font-medium">
                          <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Sales
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-slate-400 font-medium">
                          <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Payouts
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-slate-400 font-medium">
                          <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Reports
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-slate-400 font-medium">
                          <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Investors
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-slate-400 font-medium mt-4">
                          <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Settings
                        </div>
                     </div>

                     {/* Mockup Main */}
                     <div className="flex-1 p-8 bg-[#fafafc] relative">
                        <div className="flex justify-between items-center mb-6">
                           <h3 className="text-xl font-bold text-slate-900">Dashboard</h3>
                           <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-bold">This Month</div>
                        </div>

                        <div className="flex gap-6">
                           {/* Total Revenue Card */}
                           <div className="flex-[1.5] bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-56 relative overflow-hidden">
                              <div className="p-6">
                                <div className="flex justify-between items-start mb-1">
                                  <p className="text-[10px] text-slate-400 font-medium">Total Revenue</p>
                                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">+12.5%</span>
                                </div>
                                <p className="text-2xl font-extrabold text-slate-900">$23.41M</p>
                                <p className="text-[9px] text-slate-400 mt-1">vs last month</p>
                              </div>
                              <svg className="w-full h-24 absolute bottom-0 left-0" viewBox="0 0 100 30" preserveAspectRatio="none">
                                <path d="M0,30 L0,25 C15,25 20,15 35,22 C50,29 60,10 75,18 C85,23 90,5 100,8 L100,30 Z" fill="rgba(37, 99, 235, 0.1)" />
                                <path d="M0,25 C15,25 20,15 35,22 C50,29 60,10 75,18 C85,23 90,5 100,8" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                              </svg>
                           </div>

                           {/* Containers by Status Card */}
                           <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] h-56 p-5 flex flex-col items-center">
                              <p className="text-[10px] text-slate-400 font-medium self-start mb-4">Containers by Status</p>
                              <div className="relative w-32 h-32 flex items-center justify-center">
                                 {/* CSS Donut Chart */}
                                 <div className="absolute inset-0 rounded-full border-[12px] border-blue-500 border-r-emerald-400 border-b-amber-400 border-l-blue-500 transform rotate-45"></div>
                                 <div className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-white transform -rotate-12 z-10"></div>
                                 <div className="bg-white w-20 h-20 rounded-full z-20 flex flex-col items-center justify-center">
                                    <span className="text-sm font-bold text-slate-900">1,248</span>
                                    <span className="text-[8px] text-slate-400">Total</span>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* List below (cut off) */}
                        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 h-32">
                           <p className="text-[10px] text-slate-400 font-medium mb-4">Transactions</p>
                           <div className="flex items-center gap-3 mb-4">
                              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center"><div className="w-2 h-2 bg-blue-600 rounded-full"></div></div>
                              <div className="h-3 bg-slate-100 w-24 rounded"></div>
                           </div>
                        </div>

                     </div>

                     {/* Overlapping Profit Card */}
                     <div className="absolute bottom-12 right-20 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-slate-100 p-5 w-72 z-30">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                             <p className="text-[9px] text-slate-400 font-medium">Profit This Month</p>
                             <div className="flex items-baseline gap-2">
                                <p className="text-xl font-bold text-slate-900">$3.92M</p>
                                <span className="text-[9px] font-bold text-emerald-500">+18.7%</span>
                             </div>
                           </div>
                           <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-bold">$</div>
                        </div>
                        <div className="flex items-end gap-1.5 h-12 w-full">
                           {[20, 30, 25, 40, 20, 45, 25, 40, 50, 35, 45, 30, 20, 40, 50, 30, 40, 20].map((h, i) => (
                              <div key={i} className={`flex-1 rounded-t-sm ${i === 8 || i === 14 ? 'bg-blue-600' : 'bg-blue-400'}`} style={{ height: `${h}%` }}></div>
                           ))}
                        </div>
                     </div>

                  </div>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
