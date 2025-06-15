'use client'
import React from 'react';
import { Bot, ArrowRight, TrendingUp, Zap, ShieldCheck, BrainCircuit, SearchCode, FileText, Activity, Sparkles, Database, BarChartBig } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Re-styled and enhanced FeatureCard
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string; // Icon background color
  animationVariant: any;
}> = ({ icon, title, description, color, animationVariant }) => (
  <motion.div 
    className="p-6 rounded-2xl bg-white/70 backdrop-blur-md shadow-xl border border-white/60 transform transition-all duration-300 hover:shadow-2xl"
    variants={animationVariant}
    whileHover={{ y: -8, scale: 1.03, boxShadow: "0px 20px 40px -15px rgba(0,0,0,0.15)" }}
  >
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 rounded-full ${color} shadow-md`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    {/* Placeholder for a mini visual snippet if needed */}
    {/* <div className="mt-4 h-24 bg-gray-200/50 rounded-lg flex items-center justify-center text-gray-400 text-xs">Mini Snippet Area</div> */}
  </motion.div>
);

// New Card for Tech Spotlight / Core Features
const TechFeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  techSource: string; // e.g., "Powered by Vertex AI"
  color: string;
  animationVariant: any;
  children?: React.ReactNode; // For placeholder
}> = ({ icon, title, description, techSource, color, animationVariant, children }) => (
  <motion.div
    className="p-8 rounded-3xl bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-lg shadow-2xl border border-white/70 overflow-hidden"
    variants={animationVariant}
    whileHover={{ 
      scale: 1.02,
      boxShadow: "0px 25px 50px -12px rgba(0,0,0,0.2)" 
    }}
  >
    <div className="flex flex-col lg:flex-row items-start gap-6">
      <div className={`p-4 rounded-xl ${color} shadow-lg self-start`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-2xl font-bold text-blue-900 mb-2">{title}</h3>
        <p className="text-sm font-semibold text-purple-600 mb-3">{techSource}</p>
        <p className="text-gray-700 leading-relaxed mb-4">{description}</p>
        {children}
      </div>
    </div>
  </motion.div>
);


export default function LandingPageV2() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const globalContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 80, damping: 15 } }
  };
  
  const crazyTextVariant = {
    hidden: { opacity: 0, y: 50, rotateX: -90, skewY: 10 },
    visible: { 
      opacity: 1, y: 0, rotateX: 0, skewY: 0,
      transition: { type: "spring", stiffness: 50, damping: 12, duration: 0.8 } 
    }
  };

  const cardPopVariant = {
    hidden: { opacity: 0, scale: 0.5, rotate: -10 },
    visible: { 
      opacity: 1, scale: 1, rotate: 0,
      transition: { type: "spring", stiffness: 100, damping: 10, delay: Math.random() * 0.5 }
    }
  };
  
  const lineDrawVariant = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.5, ease: "circOut", delay: 0.5 }
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 text-gray-100 font-sans overflow-x-hidden">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-purple-500 z-[100]" style={{ scaleX, transformOrigin: "left" }} />

      {/* Navbar */}
      <motion.nav 
        className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-xl z-50 border-b border-slate-700/50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
      >
        <div className="container mx-auto flex items-center justify-between py-5 px-6">
          <div className="flex items-center gap-3">
            <Bot className="text-purple-400 h-9 w-9" />
            <span className="font-bold text-3xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">HealthTrack AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Problem', 'Features', 'Revolution', 'Security'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-gray-300 hover:text-purple-400 transition-colors duration-300 text-sm font-medium">{item}</a>
            ))}
          </div>
          <motion.a 
            href="/login" 
            className="px-7 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full font-semibold shadow-lg shadow-purple-500/40 text-sm"
            whileHover={{ scale: 1.05, y: -2, boxShadow: "0 10px 20px -5px rgba(168, 85, 247, 0.6)"}}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            Launch App
          </motion.a>
        </div>
      </motion.nav>

      <main className="flex-grow scroll-smooth snap-y snap-mandatory h-screen overflow-y-scroll">
        {/* Hero Section */}
        <motion.section 
          id="hero" 
          className="container mx-auto px-6 py-12 md:py-16 text-center relative overflow-hidden min-h-screen flex flex-col justify-center snap-start pt-32 pb-12"
          variants={globalContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Background abstract shapes */}
          <motion.div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600/30 rounded-full filter blur-3xl opacity-50 animate-pulse-slow" 
            initial={{ scale:0, opacity:0}} animate={{scale:1, opacity:0.3}} transition={{duration:2, delay:1}}/>
          <motion.div className="absolute -bottom-20 -right-10 w-96 h-96 bg-pink-500/30 rounded-full filter blur-3xl opacity-50 animate-pulse-slow-delay"
            initial={{ scale:0, opacity:0}} animate={{scale:1, opacity:0.3}} transition={{duration:2, delay:1.5}}/>

          <motion.h1 
            className="text-5xl md:text-7xl font-extrabold mb-6"
            variants={crazyTextVariant}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400">
              The Clinical Revolution <br/>Starts Now.
            </span>
          </motion.h1>
          <motion.p 
            className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-12"
            variants={itemVariants}
          >
            HealthTrack AI isn't just software; it's your intelligent co-pilot, transforming patient data into life-saving insights with unprecedented speed and accuracy. Experience the future of medicine, today.
          </motion.p>
          <motion.div 
            className="flex justify-center gap-6"
            variants={itemVariants}
          >
            <motion.a 
              href="/login" 
              className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full font-bold text-lg shadow-xl shadow-purple-500/50"
              whileHover={{ scale: 1.05, y: -3, transition: { type: 'spring', stiffness: 300 } }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Free
            </motion.a>
            <motion.a 
              href="#features" 
              className="px-10 py-4 bg-slate-700/50 border border-slate-600 text-gray-200 rounded-full font-bold text-lg shadow-lg backdrop-blur-sm"
               whileHover={{ scale: 1.05, y: -3, backgroundColor: "rgba(71, 85, 105, 0.7)", transition: { type: 'spring', stiffness: 300 } }}
               whileTap={{ scale: 0.95 }}
            >
              Discover Features <ArrowRight className="inline ml-2" size={20}/>
            </motion.a>
          </motion.div>
          <motion.div 
            className="mt-20"
            variants={itemVariants}
          >
            {/* Placeholder: Dynamic, abstract animation of data transforming into insights or a sleek product UI snippet */}
            <div className="w-full max-w-3xl h-64 mx-auto bg-slate-800/50 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-500">
              <Sparkles className="w-16 h-16 text-purple-400 animate-pulse" />
              <p className="ml-4">Placeholder: Animated Product Showcase (e.g., data flow) <br/> Dimensions: ~768x256px</p>
            </div>
          </motion.div>
        </motion.section>

        {/* Problem Section */}
        <motion.section
          id="problem"
          className="min-h-screen flex flex-col justify-center snap-start bg-slate-900/50 pt-32 pb-12 px-6 overflow-y-auto"
          variants={globalContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-6 text-center">
            <motion.h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400 mb-6" variants={itemVariants}>
              The Weight of Modern Medicine.
            </motion.h2>
            <motion.p className="text-lg text-gray-400 max-w-3xl mx-auto mb-16" variants={itemVariants}>
              Clinicians face immense pressure: information overload, diagnostic uncertainty, and the relentless ticking clock. Burnout is real. It's time for a smarter way.
            </motion.p>
            <div className="grid md:grid-cols-3 gap-8">
              { [
                { title: "Information Overload", desc: "Sifting through mountains of patient data is overwhelming and time-consuming." },
                { title: "Diagnostic Uncertainty", desc: "Complex cases can lead to diagnostic ambiguity, impacting patient outcomes." },
                { title: "Time Constraints", desc: "Administrative burdens and inefficient workflows steal valuable time from patient care." }
              ].map((pain, i) => (
                <motion.div 
                  key={i} 
                  className="p-6 bg-slate-800/70 rounded-xl shadow-lg border border-slate-700"
                  variants={cardPopVariant}
                >
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">{pain.title}</h3>
                  <p className="text-gray-400 text-sm">{pain.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Core Features Showcase (Tech Focused) */}
        <motion.section 
          id="features" 
          className="min-h-screen flex flex-col justify-center snap-start pt-32 pb-12 px-6 overflow-y-auto"
          variants={globalContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-6">
            <motion.h2 className="text-4xl md:text-5xl font-bold text-center mb-6" variants={itemVariants}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-teal-400">Intelligence at Your Fingertips.</span>
            </motion.h2>
            <motion.p className="text-lg text-gray-300 max-w-3xl mx-auto text-center mb-20" variants={itemVariants}>
              HealthTrack AI leverages cutting-edge technologies to provide unparalleled diagnostic support and workflow efficiency. This is where data meets destiny.
            </motion.p>
            
            <div className="space-y-12">
              <TechFeatureCard
                icon={<BrainCircuit className="w-10 h-10 text-purple-800"/>}
                title="AI-Powered Differential Diagnosis"
                description="Instantly analyze complex patient notes and symptoms. Our system, leveraging Google's state-of-the-art Vertex AI models, provides a ranked list of potential diagnoses with confidence scores. These models are meticulously tested and form the intelligent core of HealthTrack AI, offering insights that were previously unimaginable."
                techSource="Powered by Google Vertex AI"
                color="bg-purple-400/70"
                animationVariant={itemVariants}
              >
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-400 text-center">
                    {/* Placeholder: UI snippet of differential diagnosis output */}
                    Placeholder: Visual of AI Diagnosis Output (e.g., ranked list) <br/> Dimensions: ~400x150px
                  </p>
                  <div className="mt-2 h-20 bg-slate-700/50 rounded flex items-center justify-center">
                     <BarChartBig className="w-10 h-10 text-purple-300 opacity-50"/>
                  </div>
                </div>
              </TechFeatureCard>

              <TechFeatureCard
                icon={<SearchCode className="w-10 h-10 text-teal-800"/>}
                title="Blazing-Fast Similar Case Search"
                description="Unlock a world of clinical knowledge. HealthTrack AI's revolutionary similar case search, built on MongoDB Atlas Vector Search, sifts through millions of anonymized records in milliseconds. Find relevant precedents, compare treatment pathways, and validate your clinical intuition with data-backed confidence. This wouldn't be possible without MongoDB's incredible speed and scalability."
                techSource="Powered by MongoDB Atlas Vector Search"
                color="bg-teal-400/70"
                animationVariant={itemVariants}
              >
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                   <p className="text-sm text-slate-400 text-center">
                    {/* Placeholder: Animation of vector search in action */}
                    Placeholder: Animation of Similar Case Search (e.g., data points converging) <br/> Dimensions: ~400x150px
                  </p>
                  <div className="mt-2 h-20 bg-slate-700/50 rounded flex items-center justify-center">
                     <Database className="w-10 h-10 text-teal-300 opacity-50"/>
                  </div>
                </div>
              </TechFeatureCard>

              <TechFeatureCard
                icon={<FileText className="w-10 h-10 text-pink-800"/>}
                title="AI-Enhanced SOAP Note Automation"
                description="Reclaim your time from documentation drudgery. Our AI intelligently structures and enhances your clinical notes into comprehensive SOAP format, ensuring accuracy, completeness, and compliance. Focus more on your patients, less on paperwork."
                techSource="Intelligent Automation Engine"
                color="bg-pink-400/70"
                animationVariant={itemVariants}
              >
                <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                   <p className="text-sm text-slate-400 text-center">
                    {/* Placeholder: Before/After of SOAP note enhancement */}
                    Placeholder: SOAP Note Enhancement Example <br/> Dimensions: ~400x150px
                  </p>
                  <div className="mt-2 h-20 bg-slate-700/50 rounded flex items-center justify-center">
                     <FileText className="w-10 h-10 text-pink-300 opacity-50"/>
                  </div>
                </div>
              </TechFeatureCard>
            </div>
          </div>
        </motion.section>

        {/* The Revolution Section */}
        <motion.section
          id="revolution"
          className="min-h-screen flex flex-col justify-center snap-start bg-gradient-to-b from-slate-900/30 to-purple-900/30 pt-32 pb-12 px-6 overflow-y-auto"
          variants={globalContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-6 text-center">
            <motion.h2 className="text-4xl md:text-5xl font-bold mb-6" variants={itemVariants}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500">
                This is More Than an App. It's a Movement.
              </span>
            </motion.h2>
            <motion.p className="text-lg text-gray-300 max-w-3xl mx-auto mb-16" variants={itemVariants}>
              HealthTrack AI is designed for the modern clinician who demands excellence, efficiency, and yes, even a bit of joy in their tools. We're empowering you to practice medicine at the peak of your abilities.
            </motion.p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              { [
                { icon: <Zap className="text-yellow-300 w-6 h-6"/>, title: "Blazing Speed", desc: "Insights in seconds, not hours. Accelerate your workflow.", color: "bg-yellow-500/30" },
                { icon: <TrendingUp className="text-green-300 w-6 h-6"/>, title: "Enhanced Accuracy", desc: "Reduce diagnostic errors with AI-backed suggestions.", color: "bg-green-500/30" },
                { icon: <Bot className="text-sky-300 w-6 h-6"/>, title: "Intuitive Design", desc: "Powerful, yet surprisingly simple and delightful to use.", color: "bg-sky-500/30" },
                { icon: <Activity className="text-red-300 w-6 h-6"/>, title: "Reduced Burnout", desc: "Less admin, more focus on what truly matters: your patients.", color: "bg-red-500/30" }
              ].map((feat, i) => (
                <FeatureCard 
                  key={i}
                  icon={feat.icon}
                  title={feat.title}
                  description={feat.desc}
                  color={feat.color}
                  animationVariant={cardPopVariant}
                />
              ))}
            </div>
             <motion.div 
                className="mt-20"
                variants={itemVariants}
              >
                {/* Placeholder: Dynamic collage of UI snippets or other graphics representing flow and efficiency */}
                <div className="w-full max-w-4xl h-80 mx-auto bg-slate-800/50 rounded-2xl border border-slate-700 flex flex-col items-center justify-center text-slate-500 p-8">
                  <Sparkles className="w-12 h-12 text-orange-400 mb-4" />
                  <p className="text-center">Placeholder: "Why Us" Visual - Dynamic Collage of UI Snippets <br/> or Abstract Graphics Representing Flow and Efficiency. <br/> Dimensions: ~896x320px</p>
                  <p className="text-xs mt-2">(Imagine sleek, animated UI elements showcasing the app's beauty and ease of use here)</p>
                </div>
              </motion.div>
          </div>
        </motion.section>

        {/* Security Section */}
        <motion.section 
          id="security" 
          className="min-h-screen flex flex-col justify-center snap-start pt-32 pb-12 px-6 overflow-y-auto"
          variants={globalContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-6 text-center">
            <motion.div 
              variants={itemVariants}
              className="inline-block p-4 bg-blue-500/20 rounded-full mb-6"
              whileHover={{scale:1.1, rotate: 5}}
              transition={{type: "spring", stiffness:300}}
            >
              <ShieldCheck className="h-16 w-16 text-blue-400"/>
            </motion.div>
            <motion.h2 className="text-4xl md:text-5xl font-bold text-blue-400 mt-0" variants={itemVariants}>
              Secure. Private. Compliant.
            </motion.h2>
            <motion.p className="text-lg text-gray-400 max-w-2xl mx-auto mt-6" variants={itemVariants}>
              We understand the sanctity of patient data. HealthTrack AI is architected with enterprise-grade security, ensuring HIPAA compliance and robust data protection. Your trust is our utmost priority.
            </motion.p>
          </div>
        </motion.section>

        {/* Final CTA Section */}
        <motion.section
          id="cta"
          className="min-h-screen flex flex-col justify-center snap-start bg-gradient-to-t from-slate-900/30 to-purple-900/50 pt-32 pb-12 px-6 overflow-y-auto"
          variants={globalContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="container mx-auto px-6 text-center">
            <motion.h2 
              className="text-4xl md:text-6xl font-extrabold mb-6"
              variants={crazyTextVariant}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400">
                Ready to Redefine Your Practice?
              </span>
            </motion.h2>
            <motion.p 
              className="mt-4 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-12"
              variants={itemVariants}
            >
              Join the vanguard of clinicians embracing the future. Sign up for HealthTrack AI today and unlock a new era of diagnostic power and efficiency.
            </motion.p>
            <motion.a 
              href="/login" 
              className="px-12 py-5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full font-bold text-xl shadow-2xl shadow-purple-500/60 inline-block"
              whileHover={{ scale: 1.1, y: -5, transition: { type: 'spring', stiffness: 250, damping: 10 } }}
              whileTap={{ scale: 0.9 }}
              variants={itemVariants}
            >
              Start Your Free Trial Now
            </motion.a>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      {/* <footer className="bg-slate-900/50 border-t border-slate-700/50 mt-20">
        <div className="container mx-auto py-10 px-6 text-center text-gray-500">
          <div className="flex justify-center gap-6 mb-6">
            <a href="/privacy-policy" className="hover:text-purple-400">Privacy Policy</a>
            <a href="/terms-of-service" className="hover:text-purple-400">Terms of Service</a>
            <a href="/contact-us" className="hover:text-purple-400">Contact Us</a>
            <a href="/citations" className="hover:text-purple-400">Citations</a>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} HealthTrack AI. All rights reserved. Revolutionizing healthcare, one insight at a time.</p>
        </div>
      </footer> */}
      {/* CommonFooter will be used for all public pages including this one, managed by their respective layouts or directly if no specific layout */}
    </div>
  )
}
