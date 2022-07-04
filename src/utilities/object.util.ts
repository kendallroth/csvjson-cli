/**
 * Determine whether a value is an object
 *
 * @param   value - Value to check
 * @returns Whether value is an object
 */
const isObject = (value: any): boolean =>
  Boolean(value) && typeof value === "object";

/**
 * Dynamically sets a deeply nested value in an object (returns new object)
 *
 * NOTE: By default it will create any missing nested keys!
 *
 * @param   obj       - Object which contains the value to set
 * @param   path      - Path to nested key being set
 * @param   value     - Target value to set
 * @param   recursive - Whether to create non-existing paths
 * @returns Updated nested object
 */
const setDeep = (
  obj: Record<string, any> = {},
  [first, ...rest]: string[],
  value: any,
  recursive = true,
): Record<string, any> => {
  // Optional prevent creating recursive keys if path is invalid/missing
  if (!recursive && typeof obj[first] === "undefined") return obj;
  // Arrays are currently not supported (will ignore)
  if (Array.isArray(obj[first])) return obj;

  return {
    ...obj,
    [first]: rest.length ? setDeep(obj[first], rest, value, recursive) : value,
  };
};

export { isObject, setDeep };
