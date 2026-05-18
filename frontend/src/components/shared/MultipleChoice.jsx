import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, Lightbulb, Sparkles } from 'lucide-react';

/**
 * Multi-purpose MCQ.
 *
 *  kind:
 *    'single'        — exactly one correct answer (right/wrong feedback)
 *    'multi-spot'    — multiple correct (checkboxes; show which were correct)
 *    'prediction'    — opinion/prediction; no right/wrong, just feedback
 *    'opinion'       — single-pick opinion; per-option tip after submit
 *    'opinion-multi' — pick *each* option to unlock its tip inline.
 *                      Continue enables only after every option's been opened.
 *
 *  Each option: { id, label, correct?: boolean, tip?: string }
 *
 *  When the picked option has a `tip`, it is shown in the explanation box
 *  after submit (option-specific takeaway). Falls back to top-level
 *  `explanation` if there's no per-option tip. If both are absent, the
 *  explanation box doesn't render at all — useful for prediction MCQs where
 *  the next scene is the answer.
 */
export default function MultipleChoice({
  prompt,
  options,
  explanation,
  kind = 'single',
  continueLabel = 'Continue',
  onContinue,
  onSpeakTip,
}) {
  const isMulti = kind === 'multi-spot';
  const isOpinion = kind === 'prediction' || kind === 'opinion';
  const isOpinionMulti = kind === 'opinion-multi';

  const [selected, setSelected] = useState(isMulti || isOpinionMulti ? [] : null);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id) => {
    if (submitted && !isOpinionMulti) return;
    if (isMulti) {
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else if (isOpinionMulti) {
      setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      setSelected(id);
    }
  };

  // 'opinion-multi' is auto-submit on first click; we use `submitted` for the
  // single-select kinds to gate revealing tips.
  const canSubmit = isMulti ? selected.length > 0 : isOpinionMulti ? false : Boolean(selected);
  const submit = () => { if (canSubmit) setSubmitted(true); };

  // Opinion-multi unlocks tips as each pick lands.
  const allUnlocked = isOpinionMulti && options.every((o) => selected.includes(o.id));

  // After submit (single-pick), if the picked option carries a per-option tip,
  // speak it aloud so the takeaway lands in the student's ear, not just on
  // screen. For opinion-multi, the parent handles per-pick speech via
  // onSpeakTip below.
  const pickedTip = !isMulti && !isOpinionMulti && submitted
    ? options.find((o) => o.id === selected)?.tip
    : null;
  const spokenRef = useRef(null);
  useEffect(() => {
    if (pickedTip && spokenRef.current !== pickedTip) {
      spokenRef.current = pickedTip;
      onSpeakTip?.(pickedTip);
    }
  }, [pickedTip, onSpeakTip]);

  // For opinion-multi: each newly added pick triggers TTS for that tip.
  const spokenIdsRef = useRef(new Set());
  useEffect(() => {
    if (!isOpinionMulti) return;
    selected.forEach((id) => {
      if (spokenIdsRef.current.has(id)) return;
      spokenIdsRef.current.add(id);
      const tip = options.find((o) => o.id === id)?.tip;
      if (tip) onSpeakTip?.(tip);
    });
  }, [isOpinionMulti, selected, options, onSpeakTip]);

  const explanationText = pickedTip || explanation;

  const score = isMulti && submitted
    ? scoreMulti(options, selected)
    : null;

  const allGood = isMulti && score && score.missed === 0 && score.wrong === 0;

  const chipLabel = kind === 'prediction'
    ? 'Quick prediction'
    : isMulti
      ? 'Spot the trick'
      : isOpinionMulti
        ? 'Explore each answer'
        : isOpinion
          ? 'Your take'
          : 'Quick check';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="my-4 w-full max-w-xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-ink-300/20 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mcq-prompt"
    >
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-ink-700">
        {isOpinion || isOpinionMulti ? <Sparkles className="h-3.5 w-3.5" /> : <Lightbulb className="h-3.5 w-3.5" />}
        {chipLabel}
      </div>

      <h3 id="mcq-prompt" className="text-lg font-semibold leading-snug text-ink-900 sm:text-xl">
        {prompt}
        {isMulti && <span className="ml-2 text-sm font-medium text-ink-500">(pick all that apply)</span>}
        {isOpinionMulti && <span className="ml-2 block text-sm font-medium text-ink-500 sm:inline">(tap each option to read its takeaway)</span>}
      </h3>

      <ul className="mt-5 space-y-2">
        {options.map((opt) => {
          const isPicked = (isMulti || isOpinionMulti) ? selected.includes(opt.id) : selected === opt.id;
          const showCorrect = submitted && !isOpinion && !isOpinionMulti && opt.correct;
          const showWrong = submitted && !isOpinion && !isOpinionMulti && isPicked && !opt.correct;
          const unlockedTip = isOpinionMulti && isPicked ? opt.tip : null;
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => toggle(opt.id)}
                disabled={isOpinionMulti ? isPicked : submitted && !isPicked && !showCorrect}
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
                    : (isMulti || isOpinionMulti) ? (isPicked ? <Check className="h-4 w-4" /> : '')
                    : opt.id.toUpperCase()}
                </span>
                <span className="flex-1">{opt.label}</span>
              </button>

              {/* Inline tip reveal beneath each picked option (opinion-multi only) */}
              <AnimatePresence>
                {unlockedTip && (
                  <motion.div
                    key="tip"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1.5 rounded-xl bg-saffron-500/10 px-4 py-3 text-[13px] leading-relaxed text-ink-700 ring-1 ring-saffron-500/30 sm:text-[14px]">
                      <span className="mb-0.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-saffron-600">
                        <Sparkles className="h-3 w-3" /> Takeaway
                      </span>
                      <div>{unlockedTip}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      {/* Single-pick / multi-spot explanation block (unchanged behaviour) */}
      <AnimatePresence>
        {!isOpinionMulti && submitted && (explanationText || isMulti) && (
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
              {isOpinion ? <><Sparkles className="h-3.5 w-3.5" /> Your takeaway</>
                : allGood ? <><Check className="h-3.5 w-3.5" /> Sharp eye</>
                : <><Lightbulb className="h-3.5 w-3.5" /> Here's the read</>}
            </div>
            {explanationText && (
              <p className="text-[14px] leading-relaxed text-ink-700 sm:text-[15px]">{explanationText}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
        {isOpinionMulti ? (
          <>
            <span className="text-[12px] font-semibold text-ink-500">
              {selected.length} of {options.length} explored
            </span>
            <button
              type="button"
              disabled={!allUnlocked}
              onClick={() => onContinue?.({ selected, correct: null })}
              className="btn-primary"
            >
              {allUnlocked ? continueLabel : 'Tap each option to unlock'} <ArrowRight className="h-4 w-4" />
            </button>
          </>
        ) : !submitted ? (
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
