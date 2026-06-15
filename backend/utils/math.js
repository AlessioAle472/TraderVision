/**
 * Math utility functions for the backend
 */

/**
 * Calculates the mean (average) of an array of numbers.
 */
const calculateMean = (arr) => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((acc, val) => acc + val, 0) / arr.length;
};

/**
 * Calculates the Standard Deviation of an array.
 */
const calculateStdDev = (arr, mean) => {
  if (!arr || arr.length === 0) return 0;
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
};

/**
 * Calculates the Simple Moving Average (SMA) of an array for a given number of periods.
 */
const calculateSMA = (arr, periods) => {
  if (!arr || arr.length === 0) return 0;
  const slice = arr.slice(0, periods);
  if (slice.length === 0) return 0;
  return Math.round(slice.reduce((acc, val) => acc + val, 0) / slice.length);
};

/**
 * Calculates the percentage difference between a current value and an average/previous value.
 */
const calculatePctDiff = (current, avg) => {
  if (avg === 0) return 0;
  return Math.round(((current - avg) / Math.abs(avg)) * 100);
};

/**
 * Calculates the Z-Score of the current value based on the previous periods.
 */
const calculateZScore = (arr, current, periods) => {
  if (!arr || arr.length === 0) return 0;
  const slice = arr.slice(0, periods);
  if (slice.length < periods / 2) return 0; // Need at least half the periods to be meaningful
  const mean = calculateMean(slice);
  const stdDev = calculateStdDev(slice, mean);
  if (stdDev === 0) return 0;
  return parseFloat(((current - mean) / stdDev).toFixed(2));
};

/**
 * Rounds a number to a specified number of decimal places.
 */
const roundDecimals = (num, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

module.exports = {
  calculateMean,
  calculateStdDev,
  calculateSMA,
  calculatePctDiff,
  calculateZScore,
  roundDecimals
};
