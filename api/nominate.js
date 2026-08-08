// Clubhouse Leaderboard — public nomination endpoint.
// Teammates (no PIN) may APPEND a nomination only. Everything else stays manager-gated.
import { redis, KEY } from './_redis.js';
const rid = (p) => p + Math.random().toString(36).slice(2, 9);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const n = body && body.nomination;
  if (!n || !n.personId || !n.type || !n.by) {
    return res.status(400).json({ ok: false, error: 'bad nomination' });
  }

  const rec = await redis.get(KEY);
  if (!rec) return res.status(400).json({ ok: false, error: 'no board yet' });
  const board = rec.board;

  // Only accept nominations for real teammates on the board.
  const person = (board.people || []).find(p => p.id === String(n.personId));
  if (!person) return res.status(400).json({ ok: false, error: 'unknown teammate' });

  board.nominations = Array.isArray(board.nominations) ? board.nominations : [];
  if (board.nominations.length > 500) return res.status(429).json({ ok: false, error: 'queue full' });

  const by = String(n.by).slice(0, 60);
  const type = String(n.type).slice(0, 40);
  board.nominations.push({
    id: rid('n'), personId: String(n.personId), type,
    note: String(n.note || '').slice(0, 300), by, date: Date.now(),
  });
  board.activity = Array.isArray(board.activity) ? board.activity : [];
  board.activity.unshift({ id: rid('a'), at: Date.now(), actor: by, text: `nominated ${person.name} for ${type}` });
  if (board.activity.length > 400) board.activity.length = 400;

  const saved = { board, rev: (rec.rev || 0) + 1 };
  await redis.set(KEY, saved);
  return res.status(200).json({ ok: true, rev: saved.rev });
}
