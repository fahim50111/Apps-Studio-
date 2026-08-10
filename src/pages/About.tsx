import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { updateSEO } from '../lib/seo';
import { openExternal } from '../lib/security';
import {
  ShieldCheck,
  Download,
  Layers,
  Users,
  Mail,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import LogoMark from '../components/LogoMark';

const CONTACT_EMAIL = 'fahinur.xo.je';
const WHATSAPP_URL = 'https://wa.me/message/L3EUGB2Q7GHXN1';

export default function About() {
  useEffect(() => {
    updateSEO({
      title: 'About Us — Apps Studio',
      description:
        'Learn about Apps Studio — a free platform to discover and download premium unlocked apps and mod games, safely and quickly.',
    });
  }, []);

  const features = [
    {
      icon: <Download className="h-5 w-5 text-accent" />,
      title: 'Free Downloads',
      text: 'Every app and game is available to download for free, with direct verified links.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-accent2" />,
      title: 'Safety First',
      text: 'We only surface links we consider safe, with clear category and version info.',
    },
    {
      icon: <Layers className="h-5 w-5 text-accent3" />,
      title: 'Multiple Versions',
      text: 'Many apps offer several versions so you can pick exactly what fits your device.',
    },
    {
      icon: <Sparkles className="h-5 w-5 text-accent" />,
      title: 'Always Fresh',
      text: 'New apps and updates are added regularly, ranked by popularity and downloads.',
    },
  ];

  return (
    <div className="px-4 py-6">
      {/* hero */}
      <div className="relative overflow-hidden rounded-3xl border border-line/70 bg-panel p-7 text-center">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-accent2/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <LogoMark className="h-16 w-16" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-fg">
          About Apps Studio
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mute">
          Apps Studio is a free platform to discover and download premium
          unlocked apps, mod games and useful tools — all in one fast, clean and
          safe place.
        </p>
      </div>

      {/* mission */}
      <div className="mt-7 rounded-2xl border border-line/70 bg-panel p-6">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-accent" />
          <h2 className="font-display text-base font-bold text-fg">Our Mission</h2>
        </div>
        <p className="text-sm leading-relaxed text-mute">
          We believe great software should be easy to find and try. Apps Studio
          helps you discover premium experiences without barriers — so you can
          focus on what you actually want to use.
        </p>
      </div>

      {/* features */}
      <h2 className="font-display mb-3 mt-7 px-1 text-sm font-bold text-fg">
        Why Apps Studio
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-line/70 bg-panel p-5"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-panel2">
              {f.icon}
            </div>
            <h3 className="mb-1.5 text-sm font-bold text-fg">{f.title}</h3>
            <p className="text-xs leading-relaxed text-mute">{f.text}</p>
          </div>
        ))}
      </div>

      {/* disclaimer */}
      <div className="mt-7 rounded-2xl border border-line/70 bg-panel p-6">
        <h2 className="font-display mb-2 text-base font-bold text-fg">
          Disclaimer
        </h2>
        <p className="text-xs leading-relaxed text-mute">
          Apps Studio is an app discovery platform provided for educational and
          personal use. All trademarks, logos and brand names are the property
          of their respective owners. We do not host files on our own servers;
          downloads are provided via third-party links. Please support official
          developers by purchasing premium apps where possible.
        </p>
      </div>

      {/* contact */}
      <h2 className="font-display mb-3 mt-7 px-1 text-sm font-bold text-fg">
        Get in Touch
      </h2>
      <div className="overflow-hidden rounded-2xl border border-line/70 bg-panel">
        <div className="flex items-center gap-3 border-b border-line/60 px-4 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel2">
            <Mail className="h-4.5 w-4.5 text-accent2" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-mute">
              Contact
            </p>
            <p className="select-all truncate text-sm font-semibold text-fg">
              {CONTACT_EMAIL}
            </p>
          </div>
        </div>
        <button
          onClick={() => openExternal(WHATSAPP_URL)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-panel2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel2">
            <MessageCircle className="h-4.5 w-4.5 text-[#25D366]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-mute">Chat</p>
            <p className="text-sm font-semibold text-fg">WhatsApp</p>
          </div>
        </button>
      </div>

      <div className="mt-6 flex justify-center gap-4 text-xs font-semibold text-mute">
        <Link to="/privacy" className="transition hover:text-accent">
          Privacy Policy
        </Link>
        <span>·</span>
        <Link to="/request" className="transition hover:text-accent">
          Request an App
        </Link>
      </div>
    </div>
  );
}
