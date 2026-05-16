import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, Lightbulb, Sparkles } from 'lucide-react';

/**
 * Multi-purpose MCQ.
 *
 *  kind:
 *    'single'      — exactly one correct answer (right/wrong feedback)
 *    'multi-spot'  — multiple correct (checkboxes; show which were correct)
 *    'prediction'  — opinion/prediction; no right/wrong, just feedback
 *    'opinion'     — same as prediction (alias for end-of-act reflection MCQ)
 *
 *  Each option: { id, label, correct?: boolean }
 */
export default function MultipleChoice({
  prompt,
  options,
  explanation,
  kind = 'single',
  continueLabel = 'Continue',
  onContinue,
}) {
  const isMulti = kind === 'multi-spot';
  const isOpinion = kind === 'prediction' || kind === 'opinion';

  const [selected, setSelected] = useState(isMulti ? [] : null);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id) => {
    if (submitted) return;
    if (isMulti) {
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelected(id);
    }
  };

  const canSubmit = isMulti ? selected.length > 0 : Boolean(selected);
  const submit = () => { if (canSubmit) setSubmitted(true); };

  const score = isMulti && submitted
    ? scoreMulti(options, selected)
    : null;

  const allGood = isMulti && score && score.missed === 0 && score.wrong === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-ink-300/20 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mcq-prompt"
    >
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-ink-700">
        {isOpinion ? <Sparkles className="h-3.5 w-3.5" /> : <Lightbulb className="h-3.5 w-3.5" />}
        {kind === 'prediction' ? 'Quick prediction' : isMulti ? 'Spot the trick' : isOpinion ? 'Your take' : 'Quick check'}
      </div>

      <h3 id="mcq-prompt" className="text-lg font-semibold leading-snug text-ink-900 sm:text-xl">
        {prompt}
        {isMulti && <span className="ml-2 text-sm font-medium text-ink-500">(pick all that apply)</span>}
      </h3>

      <ul className="mt-5 space-y-2">
        {options.map((opt) => {
          const isPicked = isMulti ? selected.includes(opt.id) : selected === opt.id;
          const showCorrect = submitted && !isOpinion && opt.correct;
          const showWrong = submitted && !isOpinion && isPicked && !opt.correct;
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => toggle(opt.id)}
                disabled={submitted && !isPicked && !showCorrect}
                aria-pressed={isPicked}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15px] leading-snug transition sm:text-base ${
                  showCorrect
                    ? 'border-teal-500/60 bg-teal-500/10 text-ink-900'
                    : showWrong
                      ? 'border-coral-500/60 bg-coral-500/10 text-ink-900'
                      : isPicked
                        ? 'border-saffron-500 bg-saffron-500/10 text-ink-900'
                        : 'border-ink-300/30 bg-cream-50 text-ink-700 hover:border-saffron-500/60 hover:bg-saffron-500/5'
                }`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                  showCorrect ? 'bg-teal-500 text-white'
                  : showWrong ? 'bg-coral-500 text-white'
                  : isPicked ? 'bg-saffron-500 text-ink-900'
                  : 'bg-white text-ink-500 ring-1 ring-ink-300/30'
                }`}>
                  {showCorrect ? <Check className="h-4 w-4" />
                    : showWrong ? <X className="h-4 w-4" />
                    : isMulti ? (isPicked ? <Check className="h-4 w-4" /> : '')
                    : opt.id.toUpperCase()}
                </span>
                <span className="flex-1">{opt.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {submitted && (explanation || isMulti) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`mt-5 rounded-2xl p-4 ring-1 ${
              isOpinion ? 'bg-saffron-500/10 ring-saffron-500/30'
              : allGood ? 'bg-teal-500/10 ring-teal-500/30'
              : 'bg-saffron-500/10 ring-saffron-500/30'
            }`}
          >
            <div className={`mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${
              isOpinion ? 'text-saffron-600' : allGood ? 'text-teal-500' : 'text-saffron-600'
            }`}>
              {isOpinion ? <><Sparkles className="h-3.5 w-3.5" /> Worth knowing</>
                : allGood ? <><Check className="h-3.5 w-3.5" /> Sharp eye</>
                : <><Lightbulb className="h-3.5 w-3.5" /> Here's the read</>}
            </div>
            {explanation && (
              <p className="text-[14px] leading-relaxed text-ink-700 sm:text-[15px]">{explanation}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
        {!submitted ? (
          <button type="button" disabled={!canSubmit} onClick={submit} className="btn-primary">
            {isOpinion ? 'Share my take' : 'Submit answer'} <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={() => onContinue?.({ selected, correct: !isOpinion && !isMulti ? options.find((o) => o.id === selected)?.correct : null })} className="btn-primary">
            {continueLabel} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function scoreMulti(options, selectedIds) {
  let right = 0, wrong = 0, missed = 0;
  for (const opt of options) {
    const picked = selectedIds.includes(opt.id);
    if (opt.correct && picked) right += 1;
    else if (!opt.correct && picked) wrong += 1;
    else if (opt.correct && !picked) missed += 1;
  }
  return { right, wrong, missed };
}
