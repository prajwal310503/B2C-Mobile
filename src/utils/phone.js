// Normalise typed or pasted input to a 10-digit Indian mobile number:
// drops +91 / leading 0 prefixes, spaces, dashes and any other non-digits.
// While someone is still typing "+91…", up to 12 digits are kept so the prefix
// can be recognised and stripped once the full number is in.
export const toMobile = (value) => {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length >= 11 && digits.startsWith('0')) digits = digits.slice(1);
  const max = digits.startsWith('91') ? 12 : digits.startsWith('0') ? 11 : 10;
  return digits.slice(0, max);
};
