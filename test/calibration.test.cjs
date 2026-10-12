const test = require('node:test');
const assert = require('node:assert/strict');
test('the milliliter interface preserves saved calibrations and corrects volume in the requested direction', async () => {
  const { calibrationFromOffset, offsetFromCalibration } = await import('../src/lib/calibration.mjs');
  for (const base of [360, 415, 500]) for (const saved of [280, 360, 362, 415, 500, 1000]) {
    assert.equal(calibrationFromOffset(offsetFromCalibration(saved, base), base), saved);
  }
  assert.equal(calibrationFromOffset(0, 360), 360);
  assert.equal(calibrationFromOffset(100, 360), 362);
  assert.equal(calibrationFromOffset(-100, 360), 358);
  assert.throws(() => calibrationFromOffset('', 360));
  assert.throws(() => calibrationFromOffset(-20000, 360));
});
