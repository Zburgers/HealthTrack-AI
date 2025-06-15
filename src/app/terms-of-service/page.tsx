import React from 'react';
import LegalPageLayout from '@/components/layout/LegalPageLayout';

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <p className="mb-4">
        Last Updated: June 16, 2025
      </p>
      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">1. Acceptance of Terms</h2>
      <p>
        By accessing or using HealthTrack AI (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you disagree with any part of the terms, then you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">2. Description of Service</h2>
      <p>
        HealthTrack AI provides artificial intelligence-powered diagnostic support, clinical data analysis, and related services for healthcare professionals. The Service is intended to assist qualified medical professionals and is not a substitute for professional medical advice, diagnosis, or treatment.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">3. User Responsibilities</h2>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li>You must be a qualified healthcare professional or acting under the direct supervision of one to use the clinical decision support features.</li>
        <li>You are responsible for maintaining the confidentiality of your account and password.</li>
        <li>You agree to use the Service in compliance with all applicable laws and regulations, including but not limited to HIPAA.</li>
        <li>You are solely responsible for all clinical decisions made. HealthTrack AI is a supportive tool and does not replace professional judgment.</li>
        <li>You agree not to misuse the Service, including attempting to gain unauthorized access, introducing malicious software, or disrupting the Service.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">4. Intellectual Property</h2>
      <p>
        The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of HealthTrack AI and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">5. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. HEALTHTRACK AI MAKES NO WARRANTIES, EXPRESS OR IMPLIED, REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF THE SERVICE OR ITS CONTENT. YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK.
      </p>
      <p className="mt-2">
        HEALTHTRACK AI DOES NOT PROVIDE MEDICAL ADVICE. ANY INFORMATION OR OUTPUT PROVIDED BY THE SERVICE IS FOR INFORMATIONAL AND SUPPORT PURPOSES ONLY AND SHOULD BE INDEPENDENTLY VERIFIED BY A QUALIFIED HEALTHCARE PROFESSIONAL.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">6. Limitation of Liability</h2>
      <p>
        IN NO EVENT SHALL HEALTHTRACK AI, NOR ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (I) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (II) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (III) ANY CONTENT OBTAINED FROM THE SERVICE; AND (IV) UNAUTHORIZED ACCESS, USE OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE) OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE, AND EVEN IF A REMEDY SET FORTH HEREIN IS FOUND TO HAVE FAILED OF ITS ESSENTIAL PURPOSE.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">7. Governing Law</h2>
      <p>
        These Terms shall be governed and construed in accordance with the laws of [Your State/Country, e.g., Delaware, United States], without regard to its conflict of law provisions.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">8. Changes to Terms</h2>
      <p>
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">9. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us at <a href="mailto:legal@healthtrack.ai" className="text-pink-400 hover:text-pink-300 underline">legal@healthtrack.ai</a>.
      </p>
    </LegalPageLayout>
  );
}
