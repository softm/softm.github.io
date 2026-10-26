import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const random=()=>randomBytes(32).toString('base64url');
export const challenge=value=>createHash('sha256').update(value).digest('base64url');
export function fail(code,status=400){const error=Error(code);error.status=status;throw error;}
export function validProof(value){return typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);}
export function verifyProof(verifier,expected){if(!validProof(verifier)||!validProof(expected))return false;return timingSafeEqual(Buffer.from(challenge(verifier)),Buffer.from(expected));}
export function requireSite(registry,siteId,origin){const site=registry.sites[siteId];if(!site||!site.origins.includes(origin))fail('site-origin-not-allowed',403);return site;}
export function checkTicket(ticket,verifier,now=Date.now()){
  if(!ticket||ticket.used||ticket.expiresAt.toMillis()<=now||!verifyProof(verifier,ticket.challenge))fail('expired-or-invalid-code',401);
}
