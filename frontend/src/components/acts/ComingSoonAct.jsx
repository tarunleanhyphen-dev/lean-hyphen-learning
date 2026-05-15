import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

/**
 * Shared placeholder shell for Acts 2/3/4 until they are built out.
 * Keeps routing + lesson-page wiring intact today; swap with real components later.
 */
export default function ComingSoonAct({ actId, title, summary }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
      <span className="chip bg-saffron-500/15 text-saffron-400">
        <Sparkles className="h-3 w-3" /> Coming soon
      </span>
      <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-xl text-base text-white/70">{summary}</p>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-sm text-white/70">
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
          For the dev team
        </div>
        <p>
          This Act is scaffolded — replace
          <code className="mx-1 rounded bg-white/10 px-1 py-0.5 text-xs">{`frontend/src/components/acts/${actId.toUpperCase()}/`}</code>
          with the real component. The lesson page already routes to it.
        </p>
      </div>

      <Link to="/" className="mt-8 btn-ghost">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>
    </div>
  );
}
