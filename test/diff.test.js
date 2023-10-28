import { DiffHandler, diff2D, DiffType } from "../src/modules/diff";

test("Dummy test", () => {
  expect(1).toBe(1);
});

test("diff2D with empty lists", () => {
  let list1 = [];
  let list2 = [];

  let dh = new DiffHandler(list1, list2);
  dh.compute();

  expect(dh.diffs.length).toBe(0);
});

test("diff2D with list1 being empty", () => {
  let list1 = [];
  let list2 = [
    [1, 2, 3, 4],
    ["a", "b", "c", "d"],
    [5, 6, 7, 8],
  ];

  let dh = new DiffHandler(list1, list2);
  dh.compute();

  for (let i = 0; i < dh.diffs.length; i++) {
    expect(dh.diffs[i].type).toBe(DiffType.ADDITION);
  }

  expect(dh.diffs.length).toBe(3);
});

test("diff2D with list2 being empty", () => {
  let list1 = [
    ["a", "b", "c", "d"],
    [5, 6, 7, 8],
  ];
  let list2 = [];

  let dh = new DiffHandler(list1, list2);
  dh.compute();

  for (let i = 0; i < dh.diffs.length; i++) {
    expect(dh.diffs[i].type).toBe(DiffType.REMOVAL);
  }

  expect(dh.diffs.length).toBe(2);
});

test("diff2D with identical lists", () => {
  let list1 = [
    ["a1ias", "b", "c", "d"],
    ["a", "b", "c", "123j"],
    [8992, 12, "io1n2c", "dakpisj"],
    [5, 6, 7, 811],
  ];
  let list2 = [
    ["a1ias", "b", "c", "d"],
    ["a", "b", "c", "123j"],
    [8992, 12, "io1n2c", "dakpisj"],
    [5, 6, 7, 811],
  ];

  let dh = new DiffHandler(list1, list2);
  dh.compute();

  for (let i = 0; i < dh.diffs.length; i++) {
    expect(dh.diffs[i].type).toBe(DiffType.UNCHANGED);
  }

  expect(dh.diffs.length).toBe(4);
});

test("diff2D with identical start and end", () => {
  let list1 = [
    ["a1ias", "b", "c", "d"],
    ["a", "b", "c", "123j"],
    ['uajsd'],
    ['uajsd'],
    ['uajsd'],
    ['uajsd'],
    ['uajsd'],
    [8992, 12, "io1n2c", "dakpisj"],
    [5, 6, 7, 811],
  ];
  let list2 = [
    ["a1ias", "b", "c", "d"],
    ["a", "b", "c", "123j"],
    ['uajs12a'],
    ['uajs12a'],
    [8992, 12, "io1n2c", "dakpisj"],
    [5, 6, 7, 811],
  ];

  let dh = new DiffHandler(list1, list2);
  dh.compute();

  for (let i = 0; i < dh.diffs.length; i++) {
    if (i <= 1) {
      expect(dh.diffs[i].type).toBe(DiffType.UNCHANGED);
    }
    else if (i <= 3) {
      expect(dh.diffs[i].type).toBe(DiffType.MODIFICATION);
    } else if (i <= 6) {
      expect(dh.diffs[i].type).toBe(DiffType.REMOVAL);
    } else {
      expect(dh.diffs[i].type).toBe(DiffType.UNCHANGED);
    }
  }

  expect(dh.diffs.length).toBe(9);
});

test("diff2D with differing nr cols", () => {
  let list1 = [
    [1],
    [1, 2],
    [1, 2, 3],
    [1, 2, 3, 4],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  ];
  let list2 = [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
  ];

  let dh = new DiffHandler(list1, list2);
  dh.compute();

  console.log(dh.diffs);

  for (let i = 0; i < dh.diffs.length; i++) {
    if (i <= 0) {
      expect(dh.diffs[i].type).toBe(DiffType.REMOVAL);
    }
    else if (i <= 1) {
      expect(dh.diffs[i].type).toBe(DiffType.UNCHANGED);
    } else if (i <= 4) {
      expect(dh.diffs[i].type).toBe(DiffType.MODIFICATION);
    } else {
      expect(dh.diffs[i].type).toBe(DiffType.ADDITION);
    }
  }

  expect(dh.nrCols).toBe(13);
  expect(dh.diffs.length).toBe(6);
});