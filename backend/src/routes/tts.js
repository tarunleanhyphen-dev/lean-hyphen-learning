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
//   narrator → en-IN-PrabhatNeural at pitch=+15% — the only genuine
//                                    English-India male voice Edge
//                                    serves. Earlier attempts (Madhur
//                                    hi-IN, Salman ur-IN, Niranjan
//                                    gu-IN, Bashkar bn-IN) used non-
//                                    English locales reading English,
//                                    which left a synthetic edge. We
//                                    now use Prabhat for genuine
//                                    Indian-English phonetics + SSML
//                                    pitch +15 % to raise the formants
//                                    so the adult voice reads younger
//                                    (closer to a peer-age tutor). For
//                                    a *truly* young Indian tutor
//                                    voice, see the ElevenLabs path
//                                    in synthEdge — set
//                                    ELEVENLABS_API_KEY +
//                                    ELEVENLABS_VOICE_NARRATOR in env
//                                    and it overrides Edge entirely.
const VOICES = {
  shanaya:  { neural: 'hi-IN-SwaraNeural',    googleTl: 'en-IN' },
  narrator: { neural: 'en-IN-PrabhatNeural',  googleTl: 'en-IN', pitch: '+15%', rate: 1.0 },
};

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

    let buf;
    // ElevenLabs override — if the API key is set, use ElevenLabs first
    // for whichever voice keys have an env-configured voice ID. That
    // gives a real human-sounding Indian tutor voice when configured,
    // and silently falls through to Edge/Google if not set or fails.
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    const elevenVoiceId = voiceKey === 'narrator'
      ? process.env.ELEVENLABS_VOICE_NARRATOR
      : process.env.ELEVENLABS_VOICE_SHANAYA;
    if (elevenKey && elevenVoiceId) {
      try {
        buf = await synthEleven(elevenKey, elevenVoiceId, text);
      } catch (elevenErr) {
        // eslint-disable-next-line no-console
        console.warn('[tts] elevenlabs failed, falling back to edge:', elevenErr?.message);
      }
    }
    if (!buf) {
      try {
        buf = await synthEdge(voice.neural, text, { pitch: voice.pitch, rate: voice.rate });
      } catch (edgeErr) {
        // eslint-disable-next-line no-console
        console.warn('[tts] edge failed, falling back to google:', edgeErr?.message);
        buf = await synthGoogle(voice.googleTl, text);
      }
    }

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
async function synthEleven(apiKey, voiceId, text) {
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
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
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
