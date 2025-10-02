"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const supabaseOptimized_1 = require("../services/supabaseOptimized");
const clerkAuthOptimized_1 = require("../middleware/clerkAuthOptimized");
const generateCertificateId_1 = require("../utils/generateCertificateId");
const router = express_1.default.Router();
const verifySchema = joi_1.default.object({
    certificateId: joi_1.default.string().required(),
});
const generateSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    email: joi_1.default.string().email().required(),
});
router.post('/verify', async (req, res) => {
    const { error: vErr } = verifySchema.validate(req.body);
    if (vErr)
        return res.status(400).json({ error: vErr.message });
    const { certificateId } = req.body;
    const { data, error } = await supabaseOptimized_1.supabase
        .from('participants')
        .select('id, name, email, revoked, revoke_reason, revoked_at, event_id, created_at')
        .eq('certificate_id', certificateId)
        .single();
    if (error || !data)
        return res.json({ valid: false });
    return res.json({
        valid: !data.revoked,
        participant: data
    });
});
router.post('/generate', clerkAuthOptimized_1.requireAdminOptimized, async (req, res) => {
    const { error: vErr } = generateSchema.validate(req.body);
    if (vErr)
        return res.status(400).json({ error: vErr.message });
    const { name, email } = req.body;
    const certificateId = (0, generateCertificateId_1.generateCertificateId)(name, email);
    const { data: exists } = await supabaseOptimized_1.supabase.from('participants').select('id').eq('certificate_id', certificateId).limit(1);
    if (exists && exists.length > 0) {
        const regenerated = `${certificateId}-${Date.now().toString().slice(-4)}`;
        return res.json({ certificateId: regenerated, note: 'regenerated due to collision' });
    }
    return res.json({ certificateId });
});
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = router;
//# sourceMappingURL=certificates.js.map