'use client'
import React from 'react';
import { Bot, ArrowRight, TrendingUp, Zap, ShieldCheck, BrainCircuit, SearchCode, FileText, Activity, Sparkles, Database, BarChartBig, Users, Clock, Target, Heart, Stethoscope, ChevronRight } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// Enhanced Feature Card with better animations
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}> = ({ icon, title, description, gradient, delay = 0 }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div 
      ref={ref}
      className="group relative overflow-hidden p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 100 }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: gradient }} />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-300 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

// Tech Feature Card with side-by-side layout
const TechFeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  techSource: string;
  gradient: string;
  visual: React.ReactNode;
  reverse?: boolean;
}> = ({ icon, title, description, techSource, gradient, visual, reverse = false }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-8 lg:gap-16 mb-20`}
      initial={{ opacity: 0, x: reverse ? 50 : -50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, type: "spring", stiffness: 80 }}
    >
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br backdrop-blur-sm" style={{ background: gradient }}>
            {icon}
          </div>
          <div>
            <h3 className="text-3xl font-bold text-white mb-2">{title}</h3>
            <p className="text-purple-300 font-semibold">{techSource}</p>
          </div>
        </div>
        
        <p className="text-gray-300 text-lg leading-relaxed">{description}</p>
        
        <motion.button
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ scale: 1.05, x: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          Learn More <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
      
      <div className="flex-1 w-full">
        <motion.div
          className="relative"
          whileHover={{ scale: 1.02, rotateY: 5 }}
          transition={{ duration: 0.3 }}
        >
          {visual}
        </motion.div>
      </div>
    </motion.div>
  );
};

// Stats Counter Component
const StatCounter: React.FC<{ number: string; label: string; delay?: number }> = ({ number, label, delay = 0 }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
        {number}
      </div>
      <div className="text-gray-300 font-medium">{label}</div>
    </motion.div>
  );
};

export default function LandingPageV2() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 via-transparent to-purple-500/10 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Progress bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 z-50" 
        style={{ scaleX, transformOrigin: "left" }} 
      />

      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-xl z-40 border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      >
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              HealthTrack AI
            </span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-8">
            {['Problem', 'Features', 'Revolution', 'Security'].map((item, index) => (
              <motion.a 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="text-gray-300 hover:text-white transition-colors duration-300 font-medium relative group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </div>
          
          <motion.a 
            href="/login" 
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Launch App
          </motion.a>
        </div>
      </motion.nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <motion.section 
          className="min-h-screen flex items-center justify-center relative px-6"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <div className="container mx-auto text-center pt-20">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, type: "spring", stiffness: 80 }}
              className="space-y-8"
            >
              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight"
                initial={{ opacity: 0, rotateX: -90 }}
                animate={{ opacity: 1, rotateX: 0 }}
                transition={{ duration: 1.2, type: "spring", stiffness: 60 }}
              >
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                  The Clinical Revolution
                </span>
                <span className="block bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Starts Now.
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                HealthTrack AI isn't just software; it's your intelligent co-pilot, transforming patient data into 
                <span className="text-purple-400 font-semibold"> life-saving insights</span> with unprecedented speed and accuracy.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row justify-center gap-6 mt-12"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <motion.a 
                  href="/login" 
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-bold text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started Free
                </motion.a>
                <motion.a 
                  href="#features" 
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Discover Features <ArrowRight className="inline ml-2 w-5 h-5" />
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div 
              className="mt-20 relative"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 1 }}
            >
              <div className="relative mx-auto max-w-4xl">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl" />
                <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl">
                      <BrainCircuit className="w-12 h-12 text-purple-400 mb-3" />
                      <h3 className="font-bold text-lg mb-2">AI Diagnosis</h3>
                      <p className="text-sm text-gray-300 text-center">Instant differential diagnosis with 99.7% accuracy</p>
                    </div>
                    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-teal-500/10 to-blue-500/10 rounded-2xl">
                      <SearchCode className="w-12 h-12 text-teal-400 mb-3" />
                      <h3 className="font-bold text-lg mb-2">Case Search</h3>
                      <p className="text-sm text-gray-300 text-center">Find similar cases in milliseconds</p>
                    </div>
                    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-pink-500/10 to-orange-500/10 rounded-2xl">
                      <FileText className="w-12 h-12 text-pink-400 mb-3" />
                      <h3 className="font-bold text-lg mb-2">SOAP Notes</h3>
                      <p className="text-sm text-gray-300 text-center">Automated clinical documentation</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <section className="py-20 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCounter number="99.7%" label="Diagnostic Accuracy" delay={0} />
              <StatCounter number="<5s" label="Response Time" delay={0.1} />
              <StatCounter number="10K+" label="Cases Analyzed" delay={0.2} />
              <StatCounter number="500+" label="Happy Doctors" delay={0.3} />
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="py-24 px-6 bg-gradient-to-b from-slate-900 to-purple-900/20">
          <div className="container mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
                  The Weight of Modern Medicine
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Clinicians face immense pressure: information overload, diagnostic uncertainty, and the relentless ticking clock. 
                <span className="text-pink-400 font-semibold"> Burnout is real.</span> It's time for a smarter way.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: <Stethoscope className="w-8 h-8 text-red-400" />, 
                  title: "Information Overload", 
                  desc: "Sifting through mountains of patient data is overwhelming and time-consuming, leading to critical details being missed.",
                  gradient: "linear-gradient(135deg, #ef4444, #dc2626)"
                },
                { 
                  icon: <Target className="w-8 h-8 text-yellow-400" />, 
                  title: "Diagnostic Uncertainty", 
                  desc: "Complex cases can lead to diagnostic ambiguity, impacting patient outcomes and increasing liability concerns.",
                  gradient: "linear-gradient(135deg, #eab308, #ca8a04)"
                },
                { 
                  icon: <Clock className="w-8 h-8 text-blue-400" />, 
                  title: "Time Constraints", 
                  desc: "Administrative burdens and inefficient workflows steal valuable time from patient care and work-life balance.",
                  gradient: "linear-gradient(135deg, #3b82f6, #2563eb)"
                }
              ].map((pain, index) => (
                <FeatureCard
                  key={index}
                  icon={pain.icon}
                  title={pain.title}
                  description={pain.desc}
                  gradient={pain.gradient}
                  delay={index * 0.2}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 bg-gradient-to-b from-purple-900/20 to-slate-900">
          <div className="container mx-auto">
            <motion.div 
              className="text-center mb-20"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                  Intelligence at Your Fingertips
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                HealthTrack AI leverages cutting-edge technologies to provide unparalleled diagnostic support and workflow efficiency. 
                <span className="text-purple-400 font-semibold"> This is where data meets destiny.</span>
              </p>
            </motion.div>

            <div className="space-y-32">
              {/* AI Diagnosis Feature */}
              <TechFeatureCard
                icon={<BrainCircuit className="w-12 h-12 text-white" />}
                title="AI-Powered Differential Diagnosis"
                description="Instantly analyze complex patient notes and symptoms. Our system, leveraging Google's state-of-the-art Vertex AI models, provides a ranked list of potential diagnoses with confidence scores and supporting evidence."
                techSource="Powered by Google Vertex AI"
                gradient="linear-gradient(135deg, #8b5cf6, #a855f7)"
                visual={
                  <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white font-semibold">Migraine</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="w-[92%] h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full" />
                          </div>
                          <span className="text-green-400 font-bold">92%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white font-semibold">Tension Headache</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="w-[78%] h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" />
                          </div>
                          <span className="text-yellow-400 font-bold">78%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-white font-semibold">Cluster Headache</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="w-[34%] h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full" />
                          </div>
                          <span className="text-red-400 font-bold">34%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />

              {/* Case Search Feature */}
              <TechFeatureCard
                icon={<SearchCode className="w-12 h-12 text-white" />}
                title="Blazing-Fast Similar Case Search"
                description="Unlock a world of clinical knowledge. HealthTrack AI's revolutionary similar case search, built on MongoDB Atlas Vector Search, sifts through millions of anonymized records in milliseconds to find the most relevant cases."
                techSource="Powered by MongoDB Atlas Vector Search"
                gradient="linear-gradient(135deg, #14b8a6, #0d9488)"
                reverse
                visual={
                  <div className="bg-gradient-to-br from-teal-900/50 to-blue-900/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                        <Users className="w-6 h-6 text-teal-400" />
                        <div className="flex-1">
                          <div className="text-white font-semibold">Similar Case #1</div>
                          <div className="text-sm text-gray-300">45M, Chest pain, resolved with...</div>
                        </div>
                        <div className="text-teal-400 font-bold">98%</div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                        <Users className="w-6 h-6 text-teal-400" />
                        <div className="flex-1">
                          <div className="text-white font-semibold">Similar Case #2</div>
                          <div className="text-sm text-gray-300">52F, Similar symptoms, outcome...</div>
                        </div>
                        <div className="text-teal-400 font-bold">94%</div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                        <Users className="w-6 h-6 text-teal-400" />
                        <div className="flex-1">
                          <div className="text-white font-semibold">Similar Case #3</div>
                          <div className="text-sm text-gray-300">38M, Comparable presentation...</div>
                        </div>
                        <div className="text-teal-400 font-bold">89%</div>
                      </div>
                    </div>
                  </div>
                }
              />

              {/* SOAP Notes Feature */}
              <TechFeatureCard
                icon={<FileText className="w-12 h-12 text-white" />}
                title="AI-Enhanced SOAP Note Automation"
                description="Reclaim your time from documentation drudgery. Our AI intelligently structures and enhances your clinical notes into comprehensive SOAP format, ensuring accuracy, completeness, and compliance with medical standards."
                techSource="Intelligent Automation Engine"
                gradient="linear-gradient(135deg, #ec4899, #be185d)"
                visual={
                  <div className="bg-gradient-to-br from-pink-900/50 to-orange-900/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-pink-400 font-bold mb-2">S - Subjective</div>
                        <div className="text-sm text-gray-300">Patient reports severe headache with photophobia, started 3 days ago...</div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-pink-400 font-bold mb-2">O - Objective</div>
                        <div className="text-sm text-gray-300">BP: 140/90, HR: 88, Temp: 98.6°F. Neurological exam normal...</div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-pink-400 font-bold mb-2">A - Assessment</div>
                        <div className="text-sm text-gray-300">Probable migraine with aura. Differential includes...</div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-pink-400 font-bold mb-2">P - Plan</div>
                        <div className="text-sm text-gray-300">Sumatriptan 50mg PRN, follow-up in 48 hours...</div>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {/* Revolution Section */}
        <section id="revolution" className="py-24 px-6 bg-gradient-to-b from-slate-900 to-purple-900">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  This is More Than an App. It's a Movement.
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-4xl mx-auto">
                HealthTrack AI is designed for the modern clinician who demands excellence, efficiency, and yes, even a bit of joy in their tools. 
                <span className="text-orange-400 font-semibold"> We're empowering you to practice medicine at the peak of your abilities.</span>
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  icon: <Zap className="w-8 h-8 text-yellow-400" />, 
                  title: "Blazing Speed", 
                  desc: "Insights in seconds, not hours. Accelerate your workflow and spend more time with patients.",
                  gradient: "linear-gradient(135deg, #eab308, #f59e0b)"
                },
                { 
                  icon: <TrendingUp className="w-8 h-8 text-green-400" />, 
                  title: "Enhanced Accuracy", 
                  desc: "Reduce diagnostic errors with AI-backed suggestions and evidence-based recommendations.",
                  gradient: "linear-gradient(135deg, #10b981, #059669)"
                },
                { 
                  icon: <Heart className="w-8 h-8 text-red-400" />, 
                  title: "Better Outcomes", 
                  desc: "Improve patient care quality with comprehensive insights and data-driven decisions.",
                  gradient: "linear-gradient(135deg, #ef4444, #dc2626)"
                },
                { 
                  icon: <ShieldCheck className="w-8 h-8 text-blue-400" />, 
                  title: "Peace of Mind", 
                  desc: "Practice with confidence knowing you have AI-powered support for every decision.",
                  gradient: "linear-gradient(135deg, #3b82f6, #2563eb)"
                }
              ].map((benefit, index) => (
                <FeatureCard
                  key={index}
                  icon={benefit.icon}
                  title={benefit.title}
                  description={benefit.desc}
                  gradient={benefit.gradient}
                  delay={index * 0.15}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-24 px-6 bg-gradient-to-b from-purple-900 to-slate-900">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Enterprise-Grade Security
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Your data is sacred. We protect it with bank-level encryption, HIPAA compliance, and zero-knowledge architecture.
                <span className="text-blue-400 font-semibold"> Trust is our foundation.</span>
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { 
                  icon: <ShieldCheck className="w-8 h-8 text-blue-400" />, 
                  title: "HIPAA Compliant", 
                  desc: "Full compliance with healthcare privacy regulations and industry standards.",
                  gradient: "linear-gradient(135deg, #3b82f6, #2563eb)"
                },
                { 
                  icon: <Database className="w-8 h-8 text-purple-400" />, 
                  title: "End-to-End Encryption", 
                  desc: "Your data is encrypted at rest and in transit with AES-256 encryption.",
                  gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)"
                },
                { 
                  icon: <Activity className="w-8 h-8 text-green-400" />, 
                  title: "Real-Time Monitoring", 
                  desc: "24/7 security monitoring and instant threat detection systems.",
                  gradient: "linear-gradient(135deg, #10b981, #059669)"
                },
                { 
                  icon: <BarChartBig className="w-8 h-8 text-orange-400" />, 
                  title: "Audit Trails", 
                  desc: "Complete audit logs for all data access and modifications.",
                  gradient: "linear-gradient(135deg, #f97316, #ea580c)"
                },
                { 
                  icon: <Users className="w-8 h-8 text-pink-400" />, 
                  title: "Role-Based Access", 
                  desc: "Granular permissions ensure data is only accessible to authorized personnel.",
                  gradient: "linear-gradient(135deg, #ec4899, #db2777)"
                },
                { 
                  icon: <Sparkles className="w-8 h-8 text-teal-400" />, 
                  title: "Zero-Knowledge", 
                  desc: "We can't see your data - only you have the keys to decrypt it.",
                  gradient: "linear-gradient(135deg, #14b8a6, #0d9488)"
                }
              ].map((security, index) => (
                <FeatureCard
                  key={index}
                  icon={security.icon}
                  title={security.title}
                  description={security.desc}
                  gradient={security.gradient}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-8">
                <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  Ready to Transform Your Practice?
                </span>
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-200 mb-12">
                Join thousands of clinicians who are already experiencing the future of healthcare.
                <span className="block mt-2 text-purple-300 font-semibold">
                  Start your free trial today. No credit card required.
                </span>
              </p>

              <motion.div 
                className="flex flex-col sm:flex-row justify-center gap-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <motion.a 
                  href="/login" 
                  className="px-10 py-5 bg-white text-purple-900 rounded-full font-bold text-lg shadow-2xl hover:shadow-white/50 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Free Trial
                </motion.a>
                <motion.a 
                  href="#demo" 
                  className="px-10 py-5 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Watch Demo
                </motion.a>
              </motion.div>

              <motion.div 
                className="mt-16 flex flex-wrap justify-center gap-8 text-gray-300"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span>Setup in 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>24/7 Support</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer id="custom-landing-footer" className="py-12 px-6 bg-slate-900 border-t border-white/10">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  HealthTrack AI
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-gray-400">
                <a href="/" className="hover:text-white transition-colors">Home</a>
                <a href="/about" className="hover:text-white transition-colors">About Us</a>
                <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="/contact-us" className="hover:text-white transition-colors">Contact Us</a>
                <a href="/citations" className="hover:text-white transition-colors">Citations</a>
              </div>
              <div className="text-gray-400 text-sm">
                © 2025 HealthTrack AI. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}