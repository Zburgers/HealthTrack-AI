'use client'
import React from 'react';
import { Bot, ArrowRight, TrendingUp, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon, title, description, color }) => (
  <motion.div 
    className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm shadow-lg border border-white/60"
    whileHover={{ y: -5, boxShadow: "0px 15px 30px -10px rgba(0,0,0,0.1)" }}
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
    <p className="mt-4 text-gray-600">{description}</p>
  </motion.div>
);

export default function LandingPageV2() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-800 font-sans">
      
      {/* Navbar */}
      <motion.nav 
        className="fixed top-0 w-full bg-white/80 backdrop-blur-lg z-50 border-b border-white/20"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      >
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center gap-2">
            <Bot className="text-blue-500 h-8 w-8" />
            <span className="font-bold text-2xl text-blue-900">HealthTrack AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#why-us" className="text-gray-600 hover:text-blue-600 transition-colors">Why Us</a>
            <a href="#security" className="text-gray-600 hover:text-blue-600 transition-colors">Security</a>
          </div>
          <motion.a 
            href="/login" 
            className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold shadow-lg shadow-blue-500/30"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.a>
        </div>
      </motion.nav>

      <main className="flex-grow pt-24">
        {/* Hero */}
        <motion.section 
          id="hero" 
          className="container mx-auto px-6 py-20 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
            variants={itemVariants}
          >
            AI Diagnosis That Gets You <span className="italic">Excited</span>
          </motion.h1>
          <motion.p 
            className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            The must-have app for Gen Z doctors who know good vibes make great diagnoses.
          </motion.p>
          <motion.div 
            className="mt-10 flex justify-center gap-4"
            variants={itemVariants}
          >
            <motion.a 
              href="/login" 
              className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg shadow-xl shadow-blue-600/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Up Now
            </motion.a>
            <motion.a 
              href="#features" 
              className="px-8 py-4 bg-white/70 border border-white text-gray-700 rounded-full font-bold text-lg shadow-lg"
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
            >
              Learn More <ArrowRight className="inline ml-2" size={20}/>
            </motion.a>
          </motion.div>
        </motion.section>

        {/* Features Showcase */}
        <motion.section 
          id="features" 
          className="py-24 bg-white/50"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-6 text-center">
            <motion.h2 className="text-4xl font-bold text-blue-900 mb-4" variants={itemVariants}>Boring no more.</motion.h2>
            <motion.p className="text-lg text-gray-600 max-w-2xl mx-auto mb-16" variants={itemVariants}>
              HealthTrack is more than just a tool—it's your AI partner in making better, faster clinical decisions.
            </motion.p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Zap className="text-yellow-800"/>} 
                title="Instant Analysis"
                description="Go from patient notes to actionable insights in seconds. Our AI handles the heavy lifting."
                color="bg-yellow-400/50"
              />
               <FeatureCard 
                icon={<TrendingUp className="text-green-800"/>} 
                title="Better Outcomes"
                description="Diagnoses improved by 30%. Identify high-risk patients earlier and improve care quality."
                color="bg-green-400/50"
              />
               <FeatureCard 
                icon={<Bot className="text-pink-800"/>} 
                title="Assisting, Not Replacing"
                description="You're the expert. HealthTrack provides suggestions, but you always have the final say."
                color="bg-pink-400/50"
              />
            </div>
          </div>
        </motion.section>

        {/* Security Section */}
        <motion.section 
          id="security" 
          className="py-24"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-6 text-center">
            <motion.div variants={itemVariants}>
              <ShieldCheck className="mx-auto h-16 w-16 text-blue-500 bg-blue-100 p-3 rounded-full"/>
            </motion.div>
            <motion.h2 className="text-4xl font-bold text-blue-900 mt-6" variants={itemVariants}>
              Secure. Private. Compliant.
            </motion.h2>
            <motion.p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4" variants={itemVariants}>
              We take data privacy seriously. Your data is yours, always. HealthTrack is built with enterprise-grade security to ensure HIPAA compliance and patient data protection.
            </motion.p>
          </div>
        </motion.section>

      </main>

      {/* Footer */}
      <footer className="bg-white/20 border-t border-white/30 mt-24">
        <div className="container mx-auto py-8 px-6 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} HealthTrack AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
