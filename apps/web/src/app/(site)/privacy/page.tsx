import { getTenantConfig } from "@kemotsho/core/config/tenant";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy and data collection practices.",
};

export default function PrivacyPage() {
  const config = getTenantConfig();
  
  // Variables requested
  const appName = config.name; // NEXT_PUBLIC_APP_NAME
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || config.name;
  const contactEmail = config.contact.email || "support@example.com"; // NEXT_PUBLIC_CONTACT_EMAIL
  const contactAddress = config.contact.address || "123 App Street, Cloud City"; // NEXT_PUBLIC_CONTACT_ADDRESS

  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto max-w-3xl px-6 py-12 md:py-20">
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Privacy Policy
      </h1>
      <p className="mb-8 text-muted-foreground">Last Updated: {lastUpdated}</p>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        
        {/* INTRODUCTION */}
        <section className="mb-8">
          <p>
            Welcome to <strong>{appName}</strong>  we, operated by <strong>{companyName}</strong>. 
            We are committed to protecting your personal information and your right to privacy. 
            When you use our services, you trust us with your personal information. We take your privacy very seriously.
          </p>
        </section>

        {/* 1. INFORMATION WE COLLECT */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
          <p>We collect information that you provide securely during the account creation process and typical usage of our platform.</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Account Information:</strong> When you register , we collect your email address, name, and profile picture (if provided).
            </li>
            <li>
              <strong>User Content:</strong> Data you create or upload (such as text, images, or configurations) is stored securely in our database .
            </li>
            <li>
              <strong>Marketing Subscription Data (Voluntary):</strong> If you actively opt-in to our newsletter, we collect your email address to send you updates, news, and marketing materials. 
              <strong>Subscription is entirely voluntary</strong>, and you may unsubscribe at any time.
            </li>
            <li>
              <strong>Usage Data:</strong> We may collect metadata about how you access the feature, such as log files, time stamps, and device information to improve service reliability.
            </li>
          </ul>
        </section>

        {/* 2. HOW WE USE YOUR INFORMATION */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect or receive:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>To facilitate account creation and logon processes .</li>
            <li>To provide and manage your access to the service content found on {appName}.</li>
            <li>
                <strong>To send you Marketing and Promotional Communications:</strong> We may use your email address to send you marketing emails, but only if you have voluntarily opted-in to receive them. 
                You can opt-out of our marketing emails at any time (see the "Your Privacy Rights" section below).
            </li>
            <li>To send you administrative information, such as security alerts or policy updates.</li>
            <li>To enforce our terms, conditions, and policies for business purposes, to comply with legal and regulatory requirements or in connection with our contract.</li>
          </ul>
        </section>

        {/* 3. DATA STORAGE & SECURITY */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. Data Storage & Security </h2>
          <p>
            We use <strong>Google </strong> products (including Authentication and database) to secure and store your data. 
            Google employs robust physical and technical security measures. However, please remember that no transmission over the internet 
            or information storage technology can be guaranteed to be 100% secure.
          </p>
        </section>

        {/* 4. THIRD-PARTY SERVICES */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. Sharing with Third Parties</h2>
          <p>
            We do not sell your personal data. We may share data with the following categories of third parties solely for business purposes:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Cloud Computing Services:</strong> Google Cloud Platform (for hosting and database).</li>
            <li><strong>Payment Processors:</strong> To handle billing and subscriptions securely.</li>
            <li><strong>Analytics Providers:</strong> To understand how users interact with our website to improve user experience.</li>
          </ul>
        </section>

        {/* 5. YOUR RIGHTS */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. Your Privacy Rights</h2>
          <p>
            Depending on your location (e.g., GDPR in Europe, CCPA in California), you may have rights regarding your personal information, including:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>The right to request access to and obtain a copy of your personal information.</li>
            <li>The right to request rectification or erasure of your data.</li>
            <li>The right to restrict the processing of your personal information.</li>
            <li>
                <strong>Right to Withdraw Consent (Unsubscribe):</strong> In cases where we rely on your consent to process your personal information (such as marketing newsletters), 
                you have the right to withdraw your consent at any time. You can unsubscribe from our marketing emails by clicking the "unsubscribe" link in the emails or by contacting us.
            </li>
          </ul>
          <p>
            To exercise these rights, please contact us at the email provided below. 
            
          </p>
        </section>

        {/* 6. CONTACT */}
        <section className="mb-8 p-6 bg-slate-100 dark:bg-slate-900 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">6. Contact Us</h2>
          <p className="mb-2">
            If you have questions or comments about this policy, you may contact us using the information below:
          </p>
          <div className="mt-4">
            <p><strong>Entity Name:</strong> {companyName}</p>
            <p><strong>Email:</strong> <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">{contactEmail}</a></p>
            <p><strong>Address:</strong> {contactAddress}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
