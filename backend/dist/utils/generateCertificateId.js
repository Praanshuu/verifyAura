"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCertificateId = generateCertificateId;
exports.generateUniqueCertificateId = generateUniqueCertificateId;
const nanoid_1 = require("nanoid");
const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
const nano = (0, nanoid_1.customAlphabet)(alphabet, 6);
function generateCertificateId(eventCode, eventDate) {
    const year = new Date(eventDate).getFullYear().toString().slice(-2);
    const randomCode = nano();
    return `${eventCode}${year}${randomCode}`.toUpperCase();
}
async function generateUniqueCertificateId(supabase, eventCode, eventDate, maxAttempts = 5) {
    let attempt = 0;
    while (attempt < maxAttempts) {
        const candidate = generateCertificateId(eventCode, eventDate);
        const { data, error } = await supabase
            .from('participants')
            .select('id')
            .eq('certificate_id', candidate)
            .limit(1);
        if (error) {
            attempt++;
            continue;
        }
        if (!data || data.length === 0) {
            return candidate;
        }
        attempt++;
    }
    const fallback = `${generateCertificateId(eventCode, eventDate)}-${Date.now().toString().slice(-5)}`;
    return fallback.toUpperCase();
}
//# sourceMappingURL=generateCertificateId.js.map