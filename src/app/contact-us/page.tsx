import React from 'react';
import LegalPageLayout from '@/components/layout/LegalPageLayout';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactUsPage() {
  return (
    <LegalPageLayout title="Contact Us">
      <p className="text-center text-lg mb-8">
        We'd love to hear from you! Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-slate-700/50 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-purple-300 mb-3 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-pink-400" /> General Inquiries
          </h3>
          <p>For general questions, support, or information about HealthTrack AI:</p>
          <a href="mailto:info@healthtrack.ai" className="text-pink-400 hover:text-pink-300 underline break-all">info@healthtrack.ai</a>
        </div>
        <div className="bg-slate-700/50 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-purple-300 mb-3 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-pink-400" /> Sales & Partnerships
          </h3>
          <p>For sales inquiries, demos, or partnership opportunities:</p>
          <a href="mailto:sales@healthtrack.ai" className="text-pink-400 hover:text-pink-300 underline break-all">sales@healthtrack.ai</a>
        </div>
      </div>

      <div className="bg-slate-700/50 p-6 rounded-lg shadow-md mb-12">
        <h3 className="text-xl font-semibold text-purple-300 mb-3 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-pink-400" /> Our Office
        </h3>
        <p>HealthTrack AI Holdings, Inc.</p>
        <p>[Your Company Address Placeholder]</p>
        <p>[City, State, Zip Code]</p>
        <p>[Country]</p>
      </div>
      
      {/* Placeholder for a contact form if you plan to add one */}
      {/* <h2 className="text-2xl font-semibold text-purple-300 mt-10 mb-5 text-center">Send Us a Message</h2> */}
      {/* <p className="text-center mb-6">Alternatively, fill out the form below and we'll get back to you as soon as possible.</p> */}
      {/* <div className="bg-slate-700/50 p-8 rounded-lg shadow-md"> */}
      {/*   <p className="text-center">[Contact Form Placeholder]</p> */}
      {/* </div> */}

      <p className="text-center mt-10">
        We aim to respond to all inquiries within 24-48 business hours.
      </p>
    </LegalPageLayout>
  );
}
