'use client';
import React from 'react';
import LegalPageLayout from '@/components/layout/LegalPageLayout';
import Link from 'next/link';

const CitationEntry: React.FC<{ style: string; content: string; isHtml?: boolean }> = ({ style, content, isHtml }) => (
  <div className="mb-3 text-sm">
    <strong className="text-purple-300 font-semibold">{style}:</strong>{' '}
    {isHtml ? <span dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} /> : <span>{content}</span>}
  </div>
);

export default function CitationsPage() {
  const mimicIVCitations = [
    { style: "MLA", content: 'Johnson, Alistair, et al. "MIMIC-IV" (version 2.2). PhysioNet (2023). RRID:SCR_007345. <a href="https://doi.org/10.13026/66mf-vq43" target="_blank" rel="noopener noreferrer" class="text-pink-400 hover:text-pink-300 underline">https://doi.org/10.13026/66mf-vq43</a>', isHtml: true },
    { style: "APA", content: 'Johnson, A., Bulgarelli, L., Pollard, T., Horng, S., Celi, L. A., & Mark, R. (2023). MIMIC-IV (version 2.2). PhysioNet. RRID:SCR_007345. <a href="https://doi.org/10.13026/66mf-vq43" target="_blank" rel="noopener noreferrer" class="text-pink-400 hover:text-pink-300 underline">https://doi.org/10.13026/66mf-vq43</a>', isHtml: true },
    { style: "Chicago", content: 'Johnson, Alistair, Bulgarelli, Lucas, Pollard, Tom, Horng, Steven, Celi, Leo Anthony, and Roger Mark. "MIMIC-IV" (version 2.2). PhysioNet (2023). RRID:SCR_007345. <a href="https://doi.org/10.13026/66mf-vq43" target="_blank" rel="noopener noreferrer" class="text-pink-400 hover:text-pink-300 underline">https://doi.org/10.13026/66mf-vq43</a>', isHtml: true },
    { style: "Harvard", content: 'Johnson, A., Bulgarelli, L., Pollard, T., Horng, S., Celi, L. A., and Mark, R. (2023) \'MIMIC-IV\' (version 2.2), PhysioNet. RRID:SCR_007345. Available at: <a href="https://doi.org/10.13026/66mf-vq43" target="_blank" rel="noopener noreferrer" class="text-pink-400 hover:text-pink-300 underline">https://doi.org/10.13026/66mf-vq43</a>', isHtml: true },
    { style: "Vancouver", content: 'Johnson A, Bulgarelli L, Pollard T, Horng S, Celi L A, Mark R. MIMIC-IV (version 2.2). PhysioNet. 2023. RRID:SCR_007345. Available from: <a href="https://doi.org/10.13026/66mf-vq43" target="_blank" rel="noopener noreferrer" class="text-pink-400 hover:text-pink-300 underline">https://doi.org/10.13026/66mf-vq43</a>', isHtml: true },
  ];

  const physioNetCitations = [
    { style: "APA", content: 'Goldberger, A., Amaral, L., Glass, L., Hausdorff, J., Ivanov, P. C., Mark, R., ... & Stanley, H. E. (2000). PhysioBank, PhysioToolkit, and PhysioNet: Components of a new research resource for complex physiologic signals. Circulation [Online]. 101 (23), pp. e215–e220. RRID:SCR_007345.', isHtml: false },
    { style: "MLA", content: 'Goldberger, A., et al. "PhysioBank, PhysioToolkit, and PhysioNet: Components of a new research resource for complex physiologic signals. Circulation [Online]. 101 (23), pp. e215–e220." (2000). RRID:SCR_007345.', isHtml: false },
    { style: "Chicago", content: 'Goldberger, A., L. Amaral, L. Glass, J. Hausdorff, P. C. Ivanov, R. Mark, J. E. Mietus, G. B. Moody, C. K. Peng, and H. E. Stanley. "PhysioBank, PhysioToolkit, and PhysioNet: Components of a new research resource for complex physiologic signals. Circulation [Online]. 101 (23), pp. e215–e220." (2000). RRID:SCR_007345.', isHtml: false },
    { style: "Harvard", content: 'Goldberger, A., Amaral, L., Glass, L., Hausdorff, J., Ivanov, P.C., Mark, R., Mietus, J.E., Moody, G.B., Peng, C.K. and Stanley, H.E., 2000. PhysioBank, PhysioToolkit, and PhysioNet: Components of a new research resource for complex physiologic signals. Circulation [Online]. 101 (23), pp. e215–e220. RRID:SCR_007345.', isHtml: false },
    { style: "Vancouver", content: 'Goldberger A, Amaral L, Glass L, Hausdorff J, Ivanov PC, Mark R, Mietus JE, Moody GB, Peng CK, Stanley HE. PhysioBank, PhysioToolkit, and PhysioNet: Components of a new research resource for complex physiologic signals. Circulation [Online]. 101 (23), pp. e215–e220. RRID:SCR_007345.', isHtml: false },
  ];

  return (
    <LegalPageLayout title="Citations & Acknowledgements">
      <p className="mb-6 text-gray-300">
        HealthTrack AI leverages and builds upon the important work of many researchers, datasets, open-source projects, and technology partners. We are grateful for their contributions to the scientific, medical, and developer communities.
      </p>

      <h2 className="text-2xl font-semibold text-purple-300 mt-8 mb-4">Dataset Acknowledgements</h2>
      
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-pink-400 mt-6 mb-3">MIMIC-IV Dataset</h3>
        <div className="bg-slate-700/30 p-4 rounded-lg mb-6">
          <p className="mb-3 text-gray-300">
            MIMIC-IV (Medical Information Mart for Intensive Care IV) is a large, freely-available database comprising deidentified health-related data from patients who were admitted to the critical care units of the Beth Israel Deaconess Medical Center (BIDMC) in Boston, Massachusetts. It contains data from 2008-2019.
          </p>
          <p className="mb-3 text-gray-300">
            HealthTrack AI utilizes a curated subset of approximately 10,000 deidentified patient records from the MIMIC-IV v2.2 `hosp` (hospital admissions) and `note` (deidentified clinical notes) modules. This data is instrumental in training embedding models for our similar case search feature, allowing clinicians to find relevant real-world case precedents. We do not currently utilize the ICU-specific (e.g., `chartevents`) or Emergency Department (`ed`) modules for this core feature.
          </p>
          <p className="text-gray-400 text-xs mb-3">
            For more information, please visit the <a href="https://mimic.mit.edu/" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">Official MIMIC Website</a>.
          </p>
          <h4 className="text-lg font-medium text-purple-200 mt-4 mb-2">How to Cite MIMIC-IV (v2.2):</h4>
          {mimicIVCitations.map((citation, index) => (
            <CitationEntry key={`mimic-${index}`} style={citation.style} content={citation.content} isHtml={citation.isHtml} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold text-pink-400 mt-6 mb-3">PhysioNet</h3>
        <div className="bg-slate-700/30 p-4 rounded-lg mb-6">
          <p className="mb-3 text-gray-300">
            PhysioNet offers free web access to large collections of recorded physiologic signals (PhysioBank) and related open-source software (PhysioToolkit). We acknowledge PhysioNet for its role in hosting and disseminating valuable datasets like MIMIC-IV.
          </p>
          <h4 className="text-lg font-medium text-purple-200 mt-4 mb-2">How to Cite PhysioNet:</h4>
          {physioNetCitations.map((citation, index) => (
            <CitationEntry key={`physionet-${index}`} style={citation.style} content={citation.content} isHtml={citation.isHtml} />
          ))}
        </div>
      </section>

      <h2 className="text-2xl font-semibold text-purple-300 mt-10 mb-4">Core Technologies & Partners</h2>
      <section className="space-y-6 mb-8">
        <div className="bg-slate-700/30 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-teal-300 mb-2">MongoDB Atlas Vector Search</h3>
          <p className="text-gray-300">
            HealthTrack AI's rapid similar case search is powered by MongoDB Atlas Vector Search. This technology enables us to perform efficient similarity searches across the embeddings generated from the MIMIC-IV dataset, providing clinicians with quick access to comparable patient scenarios. We thank MongoDB for providing the robust and scalable platform that underpins this critical feature.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Learn more about <a href="https://www.mongodb.com/products/platform/atlas-vector-search" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">MongoDB Atlas Vector Search</a>.
          </p>
        </div>
        <div className="bg-slate-700/30 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-orange-300 mb-2">Google Cloud Vertex AI</h3>
          <p className="text-gray-300">
            Our advanced AI models for tasks such as differential diagnosis and SOAP note enhancement are developed and deployed using Google Cloud Vertex AI. This platform provides the cutting-edge infrastructure and tools necessary for building and scaling sophisticated AI solutions in healthcare. We acknowledge Google Cloud for their powerful Vertex AI platform.
          </p>
           <p className="text-gray-400 text-xs mt-2">
            Discover <a href="https://cloud.google.com/vertex-ai" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">Google Cloud Vertex AI</a>.
          </p>
        </div>
      </section>

      <h2 className="text-2xl font-semibold text-purple-300 mt-10 mb-4">Open Source & Design Acknowledgements</h2>
      <section className="mb-8">
        <div className="bg-slate-700/30 p-4 rounded-lg">
          <p className="text-gray-300 mb-2">This application is built with the help of numerous open-source projects and design resources, including but not limited to:</p>
          <ul className="list-disc list-inside pl-4 text-gray-300 space-y-1 text-sm">
            <li><Link href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">Next.js</Link> by Vercel</li>
            <li><Link href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">Tailwind CSS</Link></li>
            <li><Link href="https://www.framer.com/motion/" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">Framer Motion</Link></li>
            <li><Link href="https://lucide.dev/" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 underline">Lucide Icons</Link></li>
            <li>React, TypeScript, and many other foundational libraries.</li>
          </ul>
        </div>
      </section>
      
      <h2 className="text-2xl font-semibold text-purple-300 mt-10 mb-4">Project Origins & Hackathons</h2>
      <section className="mb-8">
        <div className="bg-slate-700/30 p-4 rounded-lg">
          <p className="text-gray-300">
            HealthTrack AI was initially conceptualized and developed as part of our participation in the <strong>AI In Action Google Hackathon</strong> and the <strong>Hack the Vibe</strong> hackathon. These events provided a valuable platform for innovation and rapid prototyping, shaping the foundation of this project.
          </p>
        </div>
      </section>

    </LegalPageLayout>
  );
}
