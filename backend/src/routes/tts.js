import { Router } from 'express';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const router = Router();

/**
 * GET /api/tts?text=hello&voice=shanaya
 *
 * Streams an Indian-English MP3 back to the browser. Primary engine is
 * Microsoft Edge's Neural TTS (free, no auth, high quality) — it has genuine
 * en-IN voices that sound clearly Indian. Falls back to Google Translate's
 * public TTS if Edge fails (e.g. blocked on a network or transient error).
 *
 *   voice=shanaya  → en-IN-NeerjaNeural (female, teen-ish range)
 *   voice=narrator → en-IN-PrabhatNeural (male, adult narrator)
 *
 * The frontend chunks long text into ~180-char sentences before calling, so
 * each request stays under the upstream limits. Responses are cached for 24h
 * since the same phrase yields identical bytes.
 */

// Voices:
//   shanaya  → hi-IN-SwaraNeural   — Hindi female reading English. Thick
//                                    Indian English accent, youthful range.
//                                    QA confirms this one sounds great.
//   narrator → te-IN-MohanNeural at pitch=+18% — Telugu-locale male
//                                    with a notably more measured,
//                                    educational cadence than Prabhat
//                                    (English-India), Madhur (Hindi),
//                                    Salman (Urdu), Niranjan
//                                    (Gujarati), or Bashkar (Bengali)
//                                    which we've all cycled through.
//                                    SSML pitch +18 % raises the
//                                    formants so the adult voice reads
//                                    closer to a 25-yr-old tutor.
//                                    For a true young Indian tutor
//                                    voice, see the ElevenLabs path in
//                                    synthEdge — set
//                                    ELEVENLABS_API_KEY +
//                                    ELEVENLABS_VOICE_NARRATOR in env
//                                    and it overrides Edge entirely.
const VOICES = {
  shanaya:  { neural: 'hi-IN-SwaraNeural',    googleTl: 'en-IN' },
  narrator: { neural: 'te-IN-MohanNeural',    googleTl: 'en-IN', pitch: '+18%', rate: 1.0 },
};

/* Per-role ElevenLabs settings. Only consulted when the env vars are
 * set; falls back to safe defaults if not specified.
 *
 *   model_id           — eleven_turbo_v2_5 is the cheapest fast model
 *                        (~50% credit cost vs multilingual) and sounds
 *                        excellent for short conversational lines. Use
 *                        eleven_multilingual_v2 only if a specific role
 *                        needs richer emotion at 2× the cost.
 *   stability          — 0 = expressive (more variation), 1 = monotone.
 *                        Shanaya is a teen so a bit lower (more energy);
 *                        narrator stays mid for measured cadence.
 *   similarity_boost   — how closely to match the source voice (0–1).
 *                        Higher is more faithful; lower lets the model
 *                        diverge for more natural prosody.
 *   style              — 0 by default. Raising it amplifies the source
 *                        voice's style (good with cloned voices, can
 *                        over-act on stock library voices).
 *   use_speaker_boost  — true sharpens the speaker's identity at a tiny
 *                        latency cost. Worth keeping on. */
const ELEVEN_PROFILES = {
  shanaya: {
    model_id: 'eleven_turbo_v2_5',
    voice_settings: {
      stability: 0.42,
      similarity_boost: 0.78,
      style: 0.20,
      use_speaker_boost: true,
    },
  },
  narrator: {
    model_id: 'eleven_turbo_v2_5',
    voice_settings: {
      stability: 0.55,
      similarity_boost: 0.78,
      style: 0.10,
      use_speaker_boost: true,
    },
  },
};

/* ------------------------------------------------------------------ */
/* TTS cache                                                          */
/* ------------------------------------------------------------------ */
/* Small in-memory LRU keyed on (engine, voice, text). The narration  */
/* across the lesson is fixed, so every learner replaying Act 1       */
/* would otherwise re-bill ElevenLabs for the same line. With this    */
/* cache we synthesise each line once and serve every subsequent      */
/* request from the buffer — ~95% credit savings on retakes.          */
/*                                                                    */
/* Cap is set to a generous 400 entries (~20 MB at our bitrate); on   */
/* overflow we drop the oldest entry. The whole lesson fits in well   */
/* under that ceiling.                                                */
/* ------------------------------------------------------------------ */
const TTS_CACHE = new Map();          // Map<key, Buffer> in insertion order
const TTS_CACHE_MAX = 400;
function cacheGet(key) {
  const buf = TTS_CACHE.get(key);
  if (!buf) return null;
  // Refresh LRU position so popular lines stay warm.
  TTS_CACHE.delete(key);
  TTS_CACHE.set(key, buf);
  return buf;
}
function cacheSet(key, buf) {
  if (TTS_CACHE.size >= TTS_CACHE_MAX) {
    const oldest = TTS_CACHE.keys().next().value;
    if (oldest != null) TTS_CACHE.delete(oldest);
  }
  TTS_CACHE.set(key, buf);
}

router.get('/', async (req, res, next) => {
  try {
    const text = (req.query.text || '').toString().slice(0, 400);
    const voiceKey = (req.query.voice || 'shanaya').toString();
    if (!text) {
      const err = new Error('text query param required');
      err.status = 400;
      throw err;
    }

    const voice = VOICES[voiceKey] || VOICES.shanaya;
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const elevenVoiceId = voiceKey === 'narrator'
      ? process.env.ELEVENLABS_VOICE_NARRATOR
      : process.env.ELEVENLABS_VOICE_SHANAYA;
    const elevenProfile = ELEVEN_PROFILES[voiceKey] || ELEVEN_PROFILES.shanaya;

    // Cache key: prefer the engine that will actually serve this request
    // so a config change (e.g. switching ElevenLabs voice id) automatically
    // invalidates only the affected entries.
    const engine = elevenKey && elevenVoiceId ? `el:${elevenVoiceId}:${elevenProfile.model_id}` : `edge:${voice.neural}`;
    const cacheKey = `${engine}|${text}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      res.set('Content-Type', 'audio/mpeg');
      res.set('Cache-Control', 'public, max-age=86400, immutable');
      res.set('X-TTS-Source', 'cache');
      res.send(cached);
      return;
    }

    let buf;
    let source = null;
    // ElevenLabs override — if the API key is set, use ElevenLabs first
    // for whichever voice keys have an env-configured voice ID. Falls
    // silently through to Edge/Google if not set or fails (rate limit,
    // network, etc.) so the lesson never breaks.
    if (elevenKey && elevenVoiceId) {
      try {
        buf = await synthEleven(elevenKey, elevenVoiceId, text, elevenProfile);
        source = 'elevenlabs';
      } catch (elevenErr) {
        // eslint-disable-next-line no-console
        console.warn('[tts] elevenlabs failed, falling back to edge:', elevenErr?.message);
      }
    }
    if (!buf) {
      try {
        buf = await synthEdge(voice.neural, text, { pitch: voice.pitch, rate: voice.rate });
        source = source || 'edge';
      } catch (edgeErr) {
        // eslint-disable-next-line no-console
        console.warn('[tts] edge failed, falling back to google:', edgeErr?.message);
        buf = await synthGoogle(voice.googleTl, text);
        source = source || 'google';
      }
    }

    cacheSet(cacheKey, buf);
    res.set('X-TTS-Source', source || 'unknown');

    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'public, max-age=86400, immutable');
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/* Edge Neural TTS (primary)                                          */
/* ------------------------------------------------------------------ */

async function synthEdge(voiceName, text, prosody = {}) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  // msedge-tts wraps the input in an SSML <prosody> tag using these
  // options — `pitch` accepts "+12%" / "+50Hz" / "+2st", `rate` accepts
  // 1.0 (default) / "+10%". This is *true* SSML pitch shift (handled
  // by the voice model itself), distinct from client-side playbackRate.
  const options = {};
  if (prosody.pitch) options.pitch = prosody.pitch;
  if (typeof prosody.rate === 'number' || typeof prosody.rate === 'string') options.rate = prosody.rate;
  const { audioStream } = tts.toStream(text, options);

  const chunks = [];
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      try { tts.close(); } catch {}
      reject(new Error('edge tts timeout'));
    }, 8000);

    audioStream.on('data', (c) => chunks.push(c));
    audioStream.on('end', () => { clearTimeout(timeout); resolve(); });
    audioStream.on('closed', () => { clearTimeout(timeout); resolve(); });
    audioStream.on('error', (e) => { clearTimeout(timeout); reject(e); });
  });

  try { tts.close(); } catch {}

  const buf = Buffer.concat(chunks);
  if (buf.length < 200) throw new Error(`edge tts returned ${buf.length} bytes`);
  return buf;
}

/* ------------------------------------------------------------------ */
/* ElevenLabs TTS (optional override)                                 */
/*                                                                    */
/* Activated by setting env vars:                                     */
/*   ELEVENLABS_API_KEY        = xi-...                               */
/*   ELEVENLABS_VOICE_NARRATOR = the voice_id of an Indian-male voice */
/*   ELEVENLABS_VOICE_SHANAYA  = (optional) voice_id for Shanaya      */
/*                                                                    */
/* The free tier (10k chars/month) is enough to evaluate. Pick a       */
/* voice from https://elevenlabs.io/app/voice-library — search for    */
/* "Indian male tutor" or similar. Copy the Voice ID and put it in    */
/* ELEVENLABS_VOICE_NARRATOR. Restart the backend. Done — every       */
/* narrator line will now come from that voice instead of Edge.       */
/*                                                                    */
/* Uses the cheapest/fastest model (eleven_turbo_v2_5) and MP3 22kHz  */
/* 32kbps output to keep latency low.                                 */
/* ------------------------------------------------------------------ */
async function synthEleven(apiKey, voiceId, text, profile = ELEVEN_PROFILES.shanaya) {
  // 22 kHz / 32 kbps is plenty for speech, half the credit cost of the
  // 44 kHz tier, and indistinguishable on phone speakers / laptops.
  const upstream = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`;
  const r = await fetch(upstream, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: profile.model_id,
      voice_settings: profile.voice_settings,
    }),
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`elevenlabs ${r.status}: ${body.slice(0, 120)}`);
  }
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 200) throw new Error(`elevenlabs returned ${buf.length} bytes`);
  return buf;
}

/* ------------------------------------------------------------------ */
/* Google Translate TTS (fallback)                                    */
/* ------------------------------------------------------------------ */

async function synthGoogle(tl, text) {
  // Google Translate caps each request at ~200 chars; chunking happens client-side.
  const upstream = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;
  const r = await fetch(upstream, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Referer': 'https://translate.google.com/',
    },
  });
  if (!r.ok) throw new Error(`google tts ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

export default router;
