export const WHATSAPP_NUMBER = '255687479859';
export const WHATSAPP_DISPLAY = '+255 687 479 859';
export const FEE_EUR = 162;

export function waLink(text) {
  const msg = text || 'Hello, I would like to pay the service fee for my application.';
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}
