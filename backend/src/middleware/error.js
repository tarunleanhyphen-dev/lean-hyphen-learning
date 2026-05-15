export function notFound(req, res) {
  res.status(404).json({ error: 'Not found', path: req.path });
}

// 4-arg form is required for Express error middleware.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) console.error('[api error]', err);
  res.status(status).json({ error: err.message || 'Server error' });
}
