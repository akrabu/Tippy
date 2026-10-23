export const DEFAULT_PREFERENCES = Object.freeze({
  rounding: 'total', showRounding: true, tapRounding: true, theme: 'classic',
  autoClear: true, layout: 'phone', appearance: 'automatic', rate: 18, people: 1,
});

export function calculate(billCents, rate, people = 1, rounding = 'none') {
  if (!Number.isSafeInteger(billCents) || billCents < 0 || billCents > 999999999) throw new RangeError('Invalid bill');
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new RangeError('Invalid tip percentage');
  if (!Number.isInteger(people) || people < 1 || people > 30) throw new RangeError('Invalid party size');
  if (!['none', 'tip', 'total'].includes(rounding)) throw new RangeError('Invalid rounding mode');
  const rateUnits = Math.round(rate * 10000);
  const tipNumerator = billCents * rateUnits;
  let tipCents = Math.round(tipNumerator / 1000000);
  let totalCents = billCents + tipCents;
  if (rounding === 'tip') {
    tipCents = Math.ceil(tipNumerator / (100000000 * people)) * 100 * people;
    totalCents = billCents + tipCents;
  } else if (rounding === 'total') {
    totalCents = Math.ceil((billCents * 1000000 + tipNumerator) / (100000000 * people)) * 100 * people;
    tipCents = totalCents - billCents;
  }
  return { billCents, tipCents, totalCents, tipEachCents: Math.round(tipCents / people), totalEachCents: Math.round(totalCents / people) };
}

export function enterDigit(billCents, digit) {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) return billCents;
  const next = billCents * 10 + digit;
  return next <= 999999999 ? next : billCents;
}

export function hasExpired(lastActive, now = Date.now()) {
  return !Number.isFinite(lastActive) || now - lastActive >= 15 * 60 * 1000;
}
