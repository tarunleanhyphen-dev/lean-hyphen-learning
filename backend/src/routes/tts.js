import { Router } from 'express';

const router = Router();

/**
 * GET /api/tts?text=hello&voice=shanaya
 *
 * Proxies Google Translate's public TTS endpoint and streams the MP3 back to
 * the browser with proper CORS headers. This bypasses two issues we hit with
 * client-side Web Speech: (1) CORS on the upstream endpoint, (2) Chrome's
 * macOS-specific bug where Web Speech is silent.
 *
 * Notes:
 *  - Google Translate TTS caps each request at ~200 characters. The frontend
 *    chunks long text into sentences before calling this route.
 *  - Voices supported: 'shanaya' (en-IN), 'narrator' (en-GB). We can swap to
 *    a paid provider later (ElevenLabs, Gemini, OpenAI) by replacing the
 *    upstream URL.
 */
router.get('/', async (req, res, next) => {
  try {
    const text = (req.query.text || '').toString().slice(0, 200);
    const voice = (req.query.voice || 'shanaya').toString();
    if (!text) {
      const err = new Error('text query param required');
      err.status = 400;
      throw err;
    }

    const tl = voice === 'narrator' ? 'en-GB' : 'en-IN';
    const upstream = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(text)}`;

    const upstreamRes = await fetch(upstream, {
      headers: {
        // Some Google edges refuse without a browsery UA.
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.warn('[tts proxy] upstream', upstreamRes.status, text.slice(0, 200));
      const err = new Error(`Upstream TTS returned ${upstreamRes.status}`);
      err.status = 502;
      throw err;
    }

    res.set('Content-Type', upstreamRes.headers.get('content-type') || 'audio/mpeg');
    // Cache for 24h — same phrase yields the same audio bytes.
    res.set('Cache-Control', 'public, max-age=86400, immutable');

    // Stream the MP3 bytes through.
    const buf = Buffer.from(await upstreamRes.arrayBuffer());
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

export default router;
