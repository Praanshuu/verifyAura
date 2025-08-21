// backend/src/routes/certificates.ts
import express from 'express';
import Joi from 'joi';
import { supabase } from '../services/supabase';
import { requireAdmin } from '../middleware/clerkAuth';
import { generateCertificateId } from '../utils/generateCertificateId';

const router = express.Router();

const verifySchema = Joi.object({
  certificateId: Joi.string().required(),
});

const generateSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
});

/**
 * POST /api/certificates/verify
 * Body: { certificateId }
 */
router.post('/verify', async (req, res) => {
  const { error: vErr } = verifySchema.validate(req.body);
  if (vErr) return res.status(400).json({ error: vErr.message });

  const { certificateId } = req.body;

  const { data, error } = await supabase
    .from('participants')
    .select('id, name, email, revoked, revoke_reason, revoked_at, event_id, created_at')
    .eq('certificate_id', certificateId)
    .single();

  if (error || !data) return res.json({ valid: false });

  return res.json({
    valid: !data.revoked,
    participant: data
  });
});

/**
 * POST /api/certificates/generate
 * Admin only - create a new certificate id for a user (without inserting into participants table)
 */
router.post('/generate', requireAdmin, async (req, res) => {
  const { error: vErr } = generateSchema.validate(req.body);
  if (vErr) return res.status(400).json({ error: vErr.message });

  const { name, email } = req.body;
  const certificateId = generateCertificateId(name, email);

  // Optionally ensure uniqueness (very unlikely collision) - check DB
  const { data: exists } = await supabase.from('participants').select('id').eq('certificate_id', certificateId).limit(1);
  if (exists && exists.length > 0) {
    // if collision, regenerate with stronger randomness
    const regenerated = `${certificateId}-${Date.now().toString().slice(-4)}`;
    return res.json({ certificateId: regenerated, note: 'regenerated due to collision' });
  }

  return res.json({ certificateId });
});

/**
 * GET /api/certificates/health
 */
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
