import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, enterDigit, hasExpired } from '../dist/calc.mjs';

test('a $52.38 bill at 18% preserves cents',()=>{
  assert.deepEqual(calculate(5238,18),{billCents:5238,tipCents:943,totalCents:6181,tipEachCents:943,totalEachCents:6181});
});
test('rounding total increases the tip without changing the bill',()=>{
  const result=calculate(5238,18,1,'total');
  assert.equal(result.totalCents,6200);assert.equal(result.tipCents,962);assert.equal(result.billCents,5238);
});
test('rounding tip leaves the original bill cents intact',()=>{
  const result=calculate(5238,18,1,'tip');assert.equal(result.tipCents,1000);assert.equal(result.totalCents,6238);
});
test('a split and rounded total is a whole dollar for every person',()=>{
  const result=calculate(5238,18,3,'total');assert.equal(result.totalEachCents,2100);assert.equal(result.tipEachCents,354);assert.equal(result.totalCents,6300);
});
test('rounding already whole amounts never adds an extra dollar',()=>{
  assert.equal(calculate(5000,20,1,'total').totalCents,6000);assert.equal(calculate(5000,20,1,'tip').tipCents,1000);
});
test('even a fraction of a cent rounds upward when rounding is enabled',()=>{
  assert.equal(calculate(1,18,1,'tip').tipCents,100);
  assert.equal(calculate(10000,0.0001,1,'total').totalCents,10100);
});
test('zero stays zero with every rounding and split option',()=>{
  for(const mode of ['none','tip','total'])for(const people of [1,3,30]){const result=calculate(0,18,people,mode);assert.equal(result.tipCents,0);assert.equal(result.totalCents,0);}
});
test('decimal rates and a 100% tip work',()=>{assert.equal(calculate(10000,18.5).tipCents,1850);assert.equal(calculate(1234,100).totalCents,2468);});
test('input respects cents, backspace, and the maximum bill',()=>{let amount=0;for(const digit of [1,2,3,4])amount=enterDigit(amount,digit);assert.equal(amount,1234);assert.equal(Math.floor(amount/10),123);assert.equal(enterDigit(999999999,9),999999999);});
test('automatic clear expires exactly at 15 minutes',()=>{assert.equal(hasExpired(1000,900999),false);assert.equal(hasExpired(1000,901000),true);});
test('invalid states are rejected',()=>{for(const args of [[-1,18],[1.5,18],[100,-1],[100,101],[100,18,0],[100,18,31]])assert.throws(()=>calculate(...args),RangeError);});
