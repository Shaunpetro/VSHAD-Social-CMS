import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | VSHAD RoboSocial",
  description: "Privacy Policy for VSHAD RoboSocial CMS",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              VSHAD RoboSocial (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a social media content management 
              system that helps businesses create, schedule, and publish content to various social media platforms. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
              use our application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-white mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Account information (name, email address)</li>
              <li>Company profiles and branding information</li>
              <li>Content you create, upload, or schedule for publishing</li>
              <li>Social media account connections and access tokens</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-2 mt-4">2.2 Information from Social Media Platforms</h3>
            <p>
              When you connect your social media accounts (LinkedIn, Facebook, Instagram), we receive:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your profile information (name, profile picture)</li>
              <li>Page/account access tokens for publishing</li>
              <li>List of pages or accounts you manage</li>
              <li>Basic engagement metrics for published content</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-2 mt-4">2.3 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Device and browser information</li>
              <li>IP address and general location</li>
              <li>Usage patterns and feature interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide and maintain our service</li>
              <li>To publish content to your connected social media accounts on your behalf</li>
              <li>To generate AI-powered content suggestions based on your company profile</li>
              <li>To schedule and manage your content calendar</li>
              <li>To provide analytics and insights on your published content</li>
              <li>To improve and optimize our application</li>
              <li>To communicate with you about service updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Social Media Platforms:</strong> To publish content on your behalf (LinkedIn, Facebook, Instagram)
              </li>
              <li>
                <strong>AI Service Providers:</strong> To generate content suggestions (content is processed but not stored by these providers)
              </li>
              <li>
                <strong>Infrastructure Providers:</strong> For hosting and database services (Vercel, Neon)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure storage of access tokens</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. 
              You can request deletion of your data at any time by contacting us or disconnecting your social media accounts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Disconnect social media accounts at any time</li>
              <li>Export your data</li>
              <li>Opt-out of non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Third-Party Links</h2>
            <p>
              Our application may contain links to third-party websites or services. We are not responsible for 
              the privacy practices of these external sites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
            <p>
              Our service is not intended for users under 18 years of age. We do not knowingly collect 
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> petrographics.adm@gmail.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <a 
            href="/" 
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to App
          </a>
        </div>
      </div>
    </div>
  );
}