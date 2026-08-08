// Clubhouse Leaderboard — board API (read + authenticated save)
// Storage: Vercel KV (Upstash Redis). One document under KEY holds the whole board.
import { redis, KEY } from './_redis.js';

function deepClone(o){ return JSON.parse(JSON.stringify(o)); }

function findManager(board, pin){
  const ms = (board && board.settings && board.settings.managers) || [];
  return ms.find(m => m.pin === pin) || null;
}
function ownerOf(board, m){
  return !!(m && board && board.settings && board.settings.ownerId === m.id);
}
// Public/teammate reads must never expose PINs. Only the owner sees codes.
function stripPins(board, includePins){
  const b = deepClone(board);
  if (!includePins && b.settings && Array.isArray(b.settings.managers)) {
    b.settings.managers = b.settings.managers.map(m => ({ id: m.id, name: m.name }));
  }
  return b;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const rec = await redis.get(KEY); // { board, rev } | null
    const pin = (req.query.pin || '').toString().trim();
    if (!rec) return res.status(200).json({ board: null, rev: 0, auth: { ok: false } });

    const m = pin ? findManager(rec.board, pin) : null;
    const owner = ownerOf(rec.board, m);
    return res.status(200).json({
      board: stripPins(rec.board, owner),          // pins only for the owner
      rev: rec.rev || 0,
      auth: m ? { ok: true, manager: { id: m.id, name: m.name }, isOwner: owner } : { ok: false },
    });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { pin, board } = body || {};
    if (!board || !Array.isArray(board.people)) {
      return res.status(400).json({ ok: false, error: 'bad board' });
    }

    const rec = await redis.get(KEY);
    const stored = rec && rec.board;
    const storedManagers = (stored && stored.settings && stored.settings.managers) || [];

    // Setup phase: no board yet, or a board with no managers — anyone may write (until the first manager exists).
    let owner = false, manager = null;
    if (!stored || storedManagers.length === 0) {
      owner = true; // treat setup writes as owner-level
    } else {
      manager = findManager(stored, (pin || '').toString().trim());
      if (!manager) return res.status(403).json({ ok: false, error: 'invalid pin' });
      owner = ownerOf(stored, manager);
    }

    const inS = board.settings || {};
    const stS = (stored && stored.settings) || {};
    const merged = {
      people:      Array.isArray(board.people)      ? board.people      : (stored ? stored.people : []),
      nominations: Array.isArray(board.nominations) ? board.nominations : (stored ? stored.nominations || [] : []),
      activity:    Array.isArray(board.activity)    ? board.activity    : (stored ? stored.activity || [] : []),
      updated:     board.updated || Date.now(),
      settings:    { lastUnlock: inS.lastUnlock || stS.lastUnlock || null },
    };

    if (owner) {
      // Owner (or setup) may change the manager list + ownership. Preserve stored PINs when the
      // client didn't send one (non-owner clients never receive PINs, so they can't resend them).
      const byId = Object.fromEntries((stS.managers || []).map(x => [x.id, x]));
      merged.settings.managers = (inS.managers || []).map(x => ({
        id: x.id,
        name: x.name,
        pin: (x.pin != null && x.pin !== '') ? x.pin : (byId[x.id] ? byId[x.id].pin : x.pin),
      })).filter(x => x.pin != null && x.pin !== ''); // drop managers with no resolvable PIN
      merged.settings.ownerId = inS.ownerId || stS.ownerId || (merged.settings.managers[0] && merged.settings.managers[0].id) || null;
    } else {
      // Non-owner managers can edit the board but never the manager list / codes.
      merged.settings.managers = stS.managers || [];
      merged.settings.ownerId = stS.ownerId || null;
    }

    const saved = { board: merged, rev: (rec && rec.rev ? rec.rev : 0) + 1 };
    await redis.set(KEY, saved);
    return res.status(200).json({ ok: true, rev: saved.rev });
  }

  res.status(405).json({ ok: false, error: 'method not allowed' });
}
