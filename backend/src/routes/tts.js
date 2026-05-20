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
//   narrator → en-IN-PrabhatNeural — Indian English male. Replaced the
//                                    previous hi-IN-MadhurNeural which QA
//                                    flagged as "flaggy" — too news-anchor /
//                                    formal. Prabhat is a cleaner Indian
//                                    English baseline; the frontend plays
//                                    it back at 1.0× (not 0.92× like before)
//                                    so it reads as a peer voice, not an
//                                    older narrator.
const VOICES = {
  shanaya:  { neural: 'hi-IN-SwaraNeural',  googleTl: 'en-IN' },
  narrator: { neural: 'en-IN-PrabhatNeural', googleTl: 'en-IN' },
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
    try {
      buf = await synthEdge(voice.neural, text);
    } catch (edgeErr) {
      // eslint-disable-next-line no-console
      console.warn('[tts] edge failed, falling back to google:', edgeErr?.message);
      buf = await synthGoogle(voice.googleTl, text);
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

async function synthEdge(voiceName, text) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text);

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
