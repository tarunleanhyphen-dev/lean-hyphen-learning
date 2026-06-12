/**
 * Sidebar — the persistent act-navigation rail (Netlify "Spot the Scam"
 * layout). Each act is clickable (jumps to that act); "SHOW SCENES" expands a
 * list of that act's scenes, and clicking a scene deep-links into it.
 *
 *   onNavigate(actId)            → open an act at its start
 *   onNavigateScene(actId, idx)  → open an act at scene `idx`
 */
import { useState } from 'react';
import { Home } from 'lucide-react';
import { lesson, scenarios } from '../../../../data/lessons/scamSmart.js';
import MusicToggle from './MusicToggle.jsx';

const ACT_SUB = { act1: 'The Hook', act2: 'The Scenarios', act3: 'The Patterns', act4: 'The Challenge' };
const ORDER = ['act1', 'act2', 'act3', 'act4'];

// Scene labels per act — index = the `?scene=` value each act understands.
export const ACT_SCENES = {
  act1: ['The group chat', 'The hook'],
  act2: scenarios.map((s) => `${s.n} · ${s.title}`),
  act3: ['Intro', 'Deepfakes & AI', 'OTP Scams', 'Gaming Scams', 'The urgency'],
  act4: ['Briefing', 'Spot the fake link', 'Real or Scam', "What's wrong", 'Match the response', 'Boss level', 'Scoreboard'],
};

export default function Sidebar({ current = 'act1', onNavigate, onNavigateScene, onHome }) {
  const [open, setOpen] = useState(current);

  return (
    <aside className="ssh__side">
      <div className="ssh__brand ssh__brandrow">
        <button className="ssh__brandbtn" onClick={onHome} title="Lesson home">
          <div className="ssh__brandtitle">{lesson.title}</div>
          <div className="ssh__brandsub">{lesson.module}</div>
        </button>
        <MusicToggle />
      </div>
      <button className="ssh__homebtn" onClick={onHome}>
        <Home size={15} /> Lesson home
      </button>

      <nav className="ssh__acts">
        {ORDER.map((id, i) => {
          const on = id === current;
          const expanded = open === id;
          const scenes = ACT_SCENES[id] || [];
          return (
            <div key={id} className={`ssh__act ${on ? 'is-on' : ''}`}>
              <button className="ssh__acthead" onClick={() => onNavigate?.(id)}>
                <div className="ssh__actname">Act {i + 1}</div>
                <div className="ssh__actsub">{ACT_SUB[id]}</div>
              </button>
              <button
                className="ssh__scenes"
                onClick={() => setOpen(expanded ? null : id)}
                aria-expanded={expanded}
              >
                SHOW SCENES {expanded ? '⌃' : '⌄'}
              </button>
              {expanded && (
                <div className="ssh__scenelist">
                  {scenes.map((label, idx) => (
                    <button key={idx} className="ssh__scene" onClick={() => onNavigateScene?.(id, idx)}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
