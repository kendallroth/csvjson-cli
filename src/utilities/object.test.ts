// Utilities
import { isObject, setDeep } from "./object.util";

describe("'isObject'", () => {
  it("detects object values", () => {
    const inputs = [{}, { key: "value" }];

    const output = inputs.map((i) => isObject(i));

    const expected = inputs.map(() => true);
    expect(output).toStrictEqual(expected);
  });

  it("detects non-object values", () => {
    const inputs = [null, undefined, NaN, true, false, ""];

    const output = inputs.map((i) => isObject(i));

    const expected = inputs.map(() => false);
    expect(output).toStrictEqual(expected);
  });
});

describe("'setDeep'", () => {
  it("can set with valid nested path", () => {
    const input = { level1: { level2: { target: 1 } } };

    const output = setDeep(input, ["level1", "level2", "target"], 2);

    const expected = { level1: { level2: { target: 2 } } };
    expect(output).toStrictEqual(expected);
  });

  it("can set with missing nested path", () => {
    const input = { level1: { level2: { target: 1 } } };

    const output = setDeep(input, ["level1", "invalid", "target"], 2);

    const expected = {
      level1: { invalid: { target: 2 }, level2: { target: 1 } },
    };
    expect(output).toStrictEqual(expected);
  });

  it("can ignore setting with missing nested path", () => {
    const input = { level1: { level2: { target: 1 } } };

    const output = setDeep(input, ["level1", "invalid", "target"], 2, false);

    const expected = { level1: { level2: { target: 1 } } };
    expect(output).toStrictEqual(expected);
  });

  it("can set with mismatching nested type", () => {
    const input = { level1: { level2: 1 } };

    const output = setDeep(input, ["level1", "level2", "target"], 2, true);

    const expected = { level1: { level2: { target: 2 } } };
    expect(output).toStrictEqual(expected);
  });
});
