import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Pencil } from 'lucide-react';

export default function ReflectionPrompt({ prompt, placeholder, onSubmit, onSkip }) {
  const [value, setValue] = useState('');
  const canSubmit = value.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-ink-300/20 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflection-title"
    >
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-ink-700">
        <Pencil className="h-3.5 w-3.5" /> Reflection
      </div>
      <h3 id="reflection-title" className="text-xl font-semibold leading-snug text-ink-900 sm:text-2xl">
        {prompt}
      </h3>
      <p className="mt-2 text-sm text-ink-500">
        No right answer. Just one thought is enough.
      </p>

      <label htmlFor="reflection-input" className="sr-only">Your reflection</label>
      <textarea
        id="reflection-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={4}
        autoFocus
        className="mt-5 w-full resize-none rounded-2xl border border-ink-300/30 bg-cream-50 p-4 text-base text-ink-900 outline-none transition focus:border-saffron-500 focus:ring-2 focus:ring-saffron-500/20"
      />

      <div className="mt-5 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-medium text-ink-500 underline-offset-4 hover:text-ink-900 hover:underline"
        >
          Skip for now
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onSubmit?.(value.trim())}
          className="btn-primary"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
