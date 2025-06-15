import React from 'react';
import LegalPageLayout from '@/components/layout/LegalPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p className="mb-4">
        Effective Date: June 16, 2025
      </p>
      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">1. Introduction</h2>
      <p>
        Welcome to HealthTrack AI (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">2. Information We Collect</h2>
      <p>
        We may collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, when you participate in activities on the application or otherwise when you contact us.
      </p>
      <p className="mt-2">
        The personal information that we collect depends on the context of your interactions with us and the application, the choices you make and the products and features you use. The personal information we collect may include the following: names, email addresses, job titles, and other similar contact data.
      </p>
      <p className="mt-2">
        For healthcare professionals using our diagnostic support tools, we may process anonymized or de-identified patient data that you input. We do not intend to collect directly identifiable patient health information unless explicitly stated and under strict compliance with applicable laws like HIPAA.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">3. How We Use Your Information</h2>
      <p>
        We use personal information collected via our application for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
      </p>
      <ul className="list-disc list-inside mb-4 pl-4 space-y-1">
        <li>To facilitate account creation and logon process.</li>
        <li>To manage user accounts.</li>
        <li>To send administrative information to you.</li>
        <li>To protect our Services (e.g., for fraud monitoring and prevention).</li>
        <li>To respond to user inquiries/offer support to users.</li>
        <li>To improve our application, services, marketing, and your experience.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">4. Will Your Information Be Shared With Anyone?</h2>
      <p>
        We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
      </p>
      <p className="mt-2">
        Specifically, we may need to process your data or share your personal information in the following situations: Business Transfers, Affiliates, Business Partners, or with Service Providers (e.g., cloud hosting like Google Cloud for Vertex AI, database providers like MongoDB, analytics providers).
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">5. Data Security</h2>
      <p>
        We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. This includes encryption, access controls, and other industry-standard practices. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">6. Your Privacy Rights</h2>
      <p>
        Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. Please contact us to exercise these rights.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">7. HIPAA Compliance (if applicable)</h2>
      <p>
        HealthTrack AI is committed to complying with the Health Insurance Portability and Accountability Act (HIPAA) for any Protected Health Information (PHI) processed through our platform. We implement safeguards to protect PHI and will enter into Business Associate Agreements (BAAs) with covered entities as required.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">8. Changes to This Privacy Notice</h2>
      <p>
        We may update this privacy notice from time to time. The updated version will be indicated by an updated &quot;Effective Date&quot; and the updated version will be effective as soon as it is accessible. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-6 mb-3">9. Contact Us</h2>
      <p>
        If you have questions or comments about this notice, you may email us at <a href="mailto:privacy@healthtrack.ai" className="text-pink-400 hover:text-pink-300 underline">privacy@healthtrack.ai</a> or by post to:
      </p>
      <p className="mt-2">
        HealthTrack AI Holdings, Inc.<br />
        [Your Company Address Placeholder]<br />
        [City, State, Zip Code]<br />
        [Country]
      </p>
    </LegalPageLayout>
  );
}
