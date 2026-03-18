import { getTenantConfig } from "@kemotsho/core/config/tenant";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using our platform.",
};

export default function TermsPage() {
  const config = getTenantConfig();
  
  // Variables requested
  const appName = config.name; // NEXT_PUBLIC_APP_NAME
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || config.name;
  const contactEmail = config.contact.email || "support@example.com"; // NEXT_PUBLIC_CONTACT_EMAIL

  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto max-w-3xl px-6 py-12 md:py-20">
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Terms of Service
      </h1>
      <p className="mb-8 text-muted-foreground">Last Updated: {lastUpdated}</p>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        
        {/* 1. ACCEPTANCE */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
          <p>
            These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") 
            and <strong>{companyName}</strong> ("we," "us," or "our"), concerning your access to and use of the <strong>{appName}</strong> website and application.
            By accessing the Site, you confirm that you have read, understood, and agreed to be bound by all of these Terms of Service.
          </p>
        </section>

        {/* 2. ACCOUNTS */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. User Accounts</h2>
          <p>
            To access certain features of the Site (such as exclusive content or newsletters), you may be required to register for an account using our secure authentication system.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>You agree to keep your password confidential and will be responsible for all use of your account and password.</li>
            <li>We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate or otherwise objectionable.</li>
            <li>You may delete your account at any time through your account settings or by contacting us.</li>
          </ul>
        </section>

        {/* 3. COMMUNICATIONS */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. Marketing and Communications</h2>
          <p>
            By creating an account, you agree that we may send you newsletters, marketing or promotional materials, and other information that may be of interest to you.
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Voluntary Subscription:</strong> These communications are entirely voluntary. You may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or instructions provided in any email we send.
            </li>
            <li>
              <strong>Service Alerts:</strong> Note that even if you opt out of marketing communications, we may still send you necessary administrative messages regarding your account security or significant changes to our terms.
            </li>
          </ul>
        </section>

        {/* 4. PROHIBITED ACTIVITIES */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. Prohibited Activities</h2>
          <p>
            You may not access or use the Site for any purpose other than that for which we make the Site available.
            As a user of the Site, you agree not to:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Systematically retrieve data or other content from the Site to create or compile a database or directory without written permission from us.</li>
            <li>Circumvent, disable, or otherwise interfere with security-related features of the Site.</li>
            <li>Upload or transmit viruses, Trojan horses, or other material that interferes with any party’s uninterrupted use and enjoyment of the Site.</li>
            <li>Use the Site in a manner inconsistent with any applicable laws or regulations.</li>
          </ul>
        </section>

        {/* 5. TERMINATION */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. Termination</h2>
          <p>
            We may terminate or suspend your account access immediately, without prior notice or liability, for any reason whatsoever, 
            including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. 
            If you wish to terminate your account, you may simply discontinue using the Service or delete your account.
          </p>
        </section>

        {/* 6. LIABILITY */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
          <p>
            In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, 
            exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the site.
          </p>
        </section>

        {/* 7. CONTACT */}
        <section className="mb-8 p-6 bg-slate-100 dark:bg-slate-900 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
          <p>In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:</p>
          <div className="mt-4">
            <p><strong>Email:</strong> <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">{contactEmail}</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
