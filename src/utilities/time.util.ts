/**
 * Calculate elapsed performance time
 *
 * @param   startTime - Start performance time
 * @param   endTime   - End performance time
 * @returns Elapsed tiem
 */
const getTime = (startTime: number, endTime: number) => {
  return `${(endTime - startTime).toFixed(2)} ms`;
};

/**
 * Pause execution for a number of milliseconds
 *
 * @param time - Time to pause (ms)
 */
const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

export { getTime, sleep };
