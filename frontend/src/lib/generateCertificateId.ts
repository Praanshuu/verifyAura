import { customAlphabet } from 'nanoid';

const getRandomCode = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return customAlphabet(alphabet, 6)(); // 6-char alphanumeric
};

export function generateCertificateId(eventCode: string, eventDate: string) {
  const year = new Date(eventDate).getFullYear().toString().slice(-2);
  const randomCode = getRandomCode();
  return `${eventCode}${year}${randomCode}`.toUpperCase();
}
