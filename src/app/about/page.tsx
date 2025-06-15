'use client';
import React from 'react';
import Image from 'next/image';
import LegalPageLayout from '@/components/layout/LegalPageLayout';
import Link from 'next/link';
import { Github, Linkedin, Mail, Briefcase, Brain, Zap, Target, Code } from 'lucide-react';

export default function AboutPage() {
  return (
    <LegalPageLayout title="The Visionary Behind HealthTrack AI">
      <section className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 mb-12 md:mb-16">
        <div className="flex-shrink-0 w-48 h-48 md:w-60 md:h-60 rounded-full overflow-hidden shadow-2xl border-4 border-purple-500/70 relative">
          <Image 
            src="https://avatars.githubusercontent.com/u/95270855?s=400&u=0375c6d0b2bdf8d401015a9c25e937f6dfa18879&v=4" 
            alt="Nakshatra Kundlas" 
            layout="fill"
            objectFit="cover"
            className="transform hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="text-center md:text-left flex-grow">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 mb-2">
            Nakshatra Kundlas
          </h1>
          <p className="text-xl text-gray-300 mb-4 font-medium">Founder & Lead Innovator, HealthTrack AI</p>
          <p className="text-gray-400 italic max-w-xl mx-auto md:mx-0">
            "A tech enthusiast and early adopter, I'm constantly at the forefront of emerging technologies. My passion lies in leveraging cutting-edge AI to build innovative solutions that create a meaningful impact on the world."
          </p>
          <div className="mt-6 flex justify-center md:justify-start space-x-4">
            <Link href="https://github.com/zburgers" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors">
              <Github size={28} />
            </Link>
            <Link href="https://www.linkedin.com/in/nakshatrakundlas" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors">
              <Linkedin size={28} />
            </Link>
            <a href="mailto:nakshatra.kundlas@outlook.com" className="text-gray-400 hover:text-purple-400 transition-colors">
              <Mail size={28} />
            </a>
          </div>
        </div>
      </section>

      <section className="mb-12 md:mb-16">
        <h2 className="text-3xl font-semibold text-purple-300 mb-6 flex items-center"><Target size={28} className="mr-3 text-pink-400"/>The Vision Behind HealthTrack AI</h2>
        <div className="bg-slate-700/30 p-6 rounded-lg shadow-lg">
          <p className="text-gray-300 leading-relaxed">
            HealthTrack AI was born from a desire to bridge the gap between the vast potential of artificial intelligence and the critical needs of modern healthcare. My vision is to empower clinicians with intelligent tools that augment their expertise, streamline workflows, and ultimately improve patient outcomes. By turning cutting-edge research into practical, user-friendly applications, we aim to alleviate the burdens of information overload and diagnostic uncertainty, allowing medical professionals to focus on what they do best: care for patients.
          </p>
        </div>
      </section>

      <section className="mb-12 md:mb-16">
        <h2 className="text-3xl font-semibold text-purple-300 mb-6 flex items-center"><Code size={28} className="mr-3 text-teal-400"/>Tech Philosophy & Approach</h2>
        <div className="bg-slate-700/30 p-6 rounded-lg shadow-lg">
          <p className="text-gray-300 leading-relaxed mb-4">
            Staying ahead of the technology curve isn't just a goal; it's a core principle. I believe in a hands-on approach, constantly experimenting with the latest AI advancements and frameworks. HealthTrack AI is built on a foundation of robust and scalable technologies, with a focus on:
          </p>
          <ul className="list-disc list-inside pl-5 text-gray-300 space-y-2">
            <li><strong>Advanced AI/ML:</strong> Leveraging Python, LangChain, HuggingFace Transformers, and Large Language Models (LLMs) to build sophisticated diagnostic and analytical capabilities.</li>
            <li><strong>Data-Driven Insights:</strong> Utilizing Vector Databases and RAG (Retrieval Augmented Generation) systems for efficient information retrieval and contextual understanding from complex medical data.</li>
            <li><strong>Scalable Infrastructure:</strong> Employing tools like Docker and cloud platforms to ensure reliability and performance.</li>
            <li><strong>User-Centric Design:</strong> Focusing on creating intuitive and efficient interfaces that seamlessly integrate into clinical workflows.</li>
          </ul>
        </div>
      </section>

      <section className="mb-12 md:mb-16">
        <h2 className="text-3xl font-semibold text-purple-300 mb-6 flex items-center"><Zap size={28} className="mr-3 text-yellow-400"/>What Drives Me</h2>
        <div className="bg-slate-700/30 p-6 rounded-lg shadow-lg">
          <ul className="list-none pl-0 text-gray-300 space-y-3">
            <li className="flex items-start"><Brain size={20} className="mr-3 mt-1 text-purple-400 flex-shrink-0"/> Experimenting with the latest AI advancements and pushing the boundaries of what's possible.</li>
            <li className="flex items-start"><Briefcase size={20} className="mr-3 mt-1 text-green-400 flex-shrink-0"/> Building practical, real-world applications that harness the power of cutting-edge technology.</li>
            <li className="flex items-start"><Zap size={20} className="mr-3 mt-1 text-orange-400 flex-shrink-0"/> Turning complex AI capabilities into user-friendly solutions that are accessible and impactful.</li>
            <li className="flex items-start"><Target size={20} className="mr-3 mt-1 text-red-400 flex-shrink-0"/> Contributing to the future of technology and making a positive difference through innovation.</li>
          </ul>
        </div>
      </section>

      <p className="text-center text-gray-400 mt-12 text-sm">
        HealthTrack AI is a testament to the power of combining passion with technology. <br/>Let's revolutionize healthcare together.
      </p>

    </LegalPageLayout>
  );
}
