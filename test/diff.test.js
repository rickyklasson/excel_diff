import { DiffHandler, DiffType } from '../src/modules/diff';

test('Dummy test', () => {
  expect(1).toBe(1);
});

test('diff2D with empty lists', () => {
  let list1 = [];
  let list2 = [];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.stats.added).toBe(0);
  expect(dh.stats.modified).toBe(0);
  expect(dh.stats.removed).toBe(0);

  expect(dh.diffs.length).toBe(0);
});

test('diff2D with empty list1', () => {
  let list1 = [];
  let list2 = [
    [1, 2, 3, 4],
    ['a', 'b', 'c', 'd'],
    [5, 6, 7, 8],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.stats.added).toBe(3);
  expect(dh.stats.modified).toBe(0);
  expect(dh.stats.removed).toBe(0);

  for (let i = 0; i < dh.diffs.length; i++) {
    expect(dh.diffs[i].type).toBe(DiffType.ADDITION);
  }

  expect(dh.diffs.length).toBe(3);
});

test('diff2D with empty list2', () => {
  let list1 = [
    ['a', 'b', 'c', 'd'],
    [5, 6, 7, 8],
  ];
  let list2 = [];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.stats.added).toBe(0);
  expect(dh.stats.modified).toBe(0);
  expect(dh.stats.removed).toBe(2);

  for (let i = 0; i < dh.diffs.length; i++) {
    expect(dh.diffs[i].type).toBe(DiffType.REMOVAL);
  }

  expect(dh.diffs.length).toBe(2);
});

test('diff2D with identical lists', () => {
  let list1 = [
    ['a1ias', 'b', 'c', 'd'],
    ['a', 'b', 'c', '123j'],
    [8992, 12, 'io1n2c', 'dakpisj'],
    [5, 6, 7, 811],
  ];
  let list2 = [
    ['a1ias', 'b', 'c', 'd'],
    ['a', 'b', 'c', '123j'],
    [8992, 12, 'io1n2c', 'dakpisj'],
    [5, 6, 7, 811],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.stats.added).toBe(0);
  expect(dh.stats.modified).toBe(0);
  expect(dh.stats.removed).toBe(0);

  for (let i = 0; i < dh.diffs.length; i++) {
    expect(dh.diffs[i].type).toBe(DiffType.UNCHANGED);
  }

  expect(dh.diffs.length).toBe(4);
});

test('diff2D with identical start and end', () => {
  let list1 = [
    ['a1ias', 'b', 'c', 'd'],
    ['a', 'b', 'c', '123j'],
    ['uajsd'],
    ['uajsd'],
    ['uajsd'],
    ['uajsd'],
    ['uajsd'],
    [8992, 12, 'io1n2c', 'dakpisj'],
    [5, 6, 7, 811],
  ];
  let list2 = [
    ['a1ias', 'b', 'c', 'd'],
    ['a', 'b', 'c', '123j'],
    ['uajs12a'],
    ['uajs12a'],
    [8992, 12, 'io1n2c', 'dakpisj'],
    [5, 6, 7, 811],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.stats.added).toBe(0);
  expect(dh.stats.modified).toBe(2);
  expect(dh.stats.removed).toBe(3);

  for (let i = 0; i < dh.diffs.length; i++) {
    if (i <= 1) {
      expect(dh.diffs[i].type).toBe(DiffType.UNCHANGED);
    } else if (i <= 3) {
      expect(dh.diffs[i].type).toBe(DiffType.MODIFICATION);
    } else if (i <= 6) {
      expect(dh.diffs[i].type).toBe(DiffType.REMOVAL);
    } else {
      expect(dh.diffs[i].type).toBe(DiffType.UNCHANGED);
    }
  }

  expect(dh.diffs.length).toBe(9);
});

test('diff2D with differing nr cols', () => {
  let list1 = [[1], [1, 2], [1, 2, 3], [1, 2, 3, 4], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]];
  let list2 = [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.stats.added).toBe(1);
  expect(dh.stats.modified).toBe(3);
  expect(dh.stats.removed).toBe(1);

  for (let i = 0; i < dh.diffs.length; i++) {
    if (i <= 0) {
      expect(dh.diffs[i].type).toBe(DiffType.REMOVAL);
    } else if (i <= 1) {
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

test('diff2D with only modifications', () => {
  let list1 = [[1], [1, 2], [1, 2, 3], [1, 2, 3, 4], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]];
  let list2 = [
    [1, 3],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.stats.added).toBe(0);
  expect(dh.stats.modified).toBe(5);
  expect(dh.stats.removed).toBe(0);

  for (let i = 0; i < dh.diffs.length; i++) {
    expect(dh.diffs[i].type).toBe(DiffType.MODIFICATION);
  }

  expect(dh.nrCols).toBe(13);
  expect(dh.diffs.length).toBe(5);
});

test('diff2D with every other modifications', () => {
  let list1 = [
    [1],
    [1, 2],
    [1, 2, 3],
    [1, 2, 3, 4],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9],
  ];
  let list2 = [
    [1],
    [3, 2],
    [1, 2, 3],
    [6, 8, 3, 4],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    [7, 8, 3, 4, 5],
    [6, 7, 8, 9],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.stats.added).toBe(0);
  expect(dh.stats.modified).toBe(3);
  expect(dh.stats.removed).toBe(0);

  for (let i = 0; i < dh.diffs.length; i++) {
    if (i % 2 == 0) {
      expect(dh.diffs[i].type).toBe(DiffType.UNCHANGED);
    } else {
      expect(dh.diffs[i].type).toBe(DiffType.MODIFICATION);
    }
  }

  expect(dh.nrCols).toBe(13);
  expect(dh.diffs.length).toBe(7);
});
