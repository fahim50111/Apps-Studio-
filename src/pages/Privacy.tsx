import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { updateSEO } from '../lib/seo';
import { ShieldCheck } from 'lucide-react';

const CONTACT_EMAIL = 'fahinur.xo.je';

export default function Privacy() {
  useEffect(() => {
    updateSEO({
      title: 'Privacy Policy — Apps Studio',
      description:
        'Read the Apps Studio privacy policy to understand what data we collect and how it is used.',
    });
  }, []);

  const updated = 'February 2025';

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 ring-1 ring-accent/25">
          <ShieldCheck className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-extrabold text-fg">
            Privacy Policy
          </h1>
          <p className="text-xs text-mute">Last updated: {updated}</p>
        </div>
      </div>

      <div className="space-y-5">
        <Section title="Introduction">
          Apps Studio ("we", "us", or "our") respects your privacy. This policy
          explains what limited information we handle when you use our website
          and how we protect it. By using Apps Studio, you agree to the
          practices described here.
        </Section>

        <Section title="Information We Collect">
          Apps Studio does not require you to create an account, and we do not
          ask for personal information such as your name, email or phone number
          to browse or download. The limited data we handle includes:
          <ul className="mt-3 space-y-2">
            <Bullet>
              <b className="text-fg">App requests:</b> if you voluntarily submit
              a request, we store the app name and any note you provide.
            </Bullet>
            <Bullet>
              <b className="text-fg">Local preferences:</b> your theme choice and
              notification "seen" markers are stored only in your browser's local
              storage — never on our servers.
            </Bullet>
            <Bullet>
              <b className="text-fg">Anonymous usage counts:</b> we increment a
              download counter per app. This is not linked to you.
            </Bullet>
          </ul>
        </Section>

        <Section title="How We Use Information">
          We use the limited data solely to operate and improve the service — for
          example to show popular apps, process your requests, and remember your
          theme preference on this device.
        </Section>

        <Section title="Cookies & Local Storage">
          We do not use tracking cookies. Local storage is used only for theme
          preference and notification state on your device.
        </Section>

        <Section title="Notifications">
          If you allow browser notifications, we may alert you when new apps are
          added. You can revoke this permission at any time from your browser
          settings. Notifications are optional and disabled by default.
        </Section>

        <Section title="Third-Party Links">
          Downloads are delivered through third-party hosts (such as file-sharing
          services). When you follow a download link you leave Apps Studio and
          become subject to that provider's own privacy policy. We are not
          responsible for the content or practices of third-party sites.
        </Section>

        <Section title="Data Security">
          We rely on Google Firebase infrastructure with strict access rules.
          Public visitors can only read the catalog, increment download counts,
          and submit size-limited requests. All other database operations are
          restricted.
        </Section>

        <Section title="Children's Privacy">
          Apps Studio is not directed to children under 13, and we do not
          knowingly collect personal information from them.
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy from time to time. Changes take effect when
          posted on this page, and the "Last updated" date will be revised
          accordingly.
        </Section>

        <Section title="Contact">
          If you have any questions about this Privacy Policy, contact us at{' '}
          <span className="select-all font-semibold text-fg">
            {CONTACT_EMAIL}
          </span>
          .
        </Section>
      </div>

      <div className="mt-8 flex justify-center gap-4 text-xs font-semibold text-mute">
        <Link to="/about" className="transition hover:text-accent">
          About Us
        </Link>
        <span>·</span>
        <Link to="/" className="transition hover:text-accent">
          Home
        </Link>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line/70 bg-panel p-5">
      <h2 className="font-display mb-2 text-sm font-bold text-fg">{title}</h2>
      <div className="text-sm leading-relaxed text-mute">{children}</div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <span>{children}</span>
    </li>
  );
}
