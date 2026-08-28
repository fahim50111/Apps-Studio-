import { Link } from 'react-router-dom';
import { openExternal } from '../lib/security';
import { Mail, MessageCircle, ShieldCheck, Download } from 'lucide-react';
import LogoMark from './LogoMark';

const CONTACT_EMAIL = 'fahinur.xo.je';
const WHATSAPP_URL = 'https://wa.me/message/L3EUGB2Q7GHXN1';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-line/60 bg-panel/65">
      <div className="mx-auto max-w-5xl px-4 py-7">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <LogoMark className="h-9 w-9 shrink-0" />
              <span className="font-display text-lg font-extrabold tracking-tight text-fg">
                APPS<span className="text-accent">STUDIO</span>
              </span>
            </Link>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-mute">
              Fast app discovery for premium unlocked apps, mod games and useful
              tools. Browse safely and download quickly.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge icon={<ShieldCheck className="h-3.5 w-3.5 text-accent" />} text="Verified" />
              <Badge icon={<Download className="h-3.5 w-3.5 text-accent2" />} text="Direct Links" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-[160px_190px]">
            <div>
              <h4 className="font-display mb-3 text-xs font-bold uppercase tracking-wider text-fg">Menu</h4>
              <nav className="grid gap-2 text-sm text-mute">
                <Link to="/categories" className="transition hover:text-accent">Browse</Link>
                <Link to="/toplist" className="transition hover:text-accent">Top Charts</Link>
                <Link to="/request" className="transition hover:text-accent">Request</Link>
                <Link to="/about" className="transition hover:text-accent">About Us</Link>
                <Link to="/privacy" className="transition hover:text-accent">Privacy</Link>
              </nav>
            </div>

            <div>
              <h4 className="font-display mb-3 text-xs font-bold uppercase tracking-wider text-fg">Contact</h4>
              <div className="space-y-2 text-sm text-mute">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-accent2" />
                  <span className="select-all break-all">{CONTACT_EMAIL}</span>
                </span>
                <button onClick={() => openExternal(WHATSAPP_URL)} className="flex items-center gap-2 transition hover:text-accent">
                  <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  WhatsApp Support
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-line/60 pt-4 text-xs text-mute sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Apps Studio. All rights reserved.</p>
          <p className="text-mute/75">All trademarks belong to their respective owners.</p>
        </div>
      </div>
    </footer>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-lg border border-line bg-panel2 px-2.5 py-1 text-[11px] font-semibold text-mute">
      {icon}
      {text}
    </span>
  );
}
