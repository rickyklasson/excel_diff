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
    } else if (i == 7) {
      expect(dh.diffs[i].type).toBe(DiffType.UNCHANGED);
    }
  }

  expect(dh.diffs.length).toBe(9);
});

test('diff2D with different nr cols', () => {
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
    if (i < 5) {
      expect(dh.diffs[i].type).toBe(DiffType.MODIFICATION);
    }
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

test('rangeFormat no changes', () => {
  let list1 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();
  expect(dh.rangeFormats).toEqual([]);
});

test('rangeFormat two insertions', () => {
  let list1 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [35, 36, 37, 38, 39, 40],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [55, 56, 57, 58, 59, 50],
    [61, 62, 63, 64, 65, 66],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  for (let rf of dh.rangeFormats) {
    expect(rf.diffType).toBe(DiffType.ADDITION);
  }
});

test('rangeFormat three removals', () => {
  let list1 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  for (let rf of dh.rangeFormats) {
    expect(rf.diffType).toBe(DiffType.REMOVAL);
  }
});

test('rangeFormat two modifications', () => {
  let list1 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 43, 35, 63],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 84, 65, 88],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  for (let rf of dh.rangeFormats.slice(0, 2)) {
    expect(rf.diffType).toBe(DiffType.MODIFICATION);
  }
});

test('rangeFormat one addition followed by one removal', () => {
  let list1 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [12, 90, 32, 42, 52, 62],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 84, 65, 88],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  for (let rf of dh.rangeFormats.slice(0, 1)) {
    expect(rf.diffType).toBe(DiffType.MODIFICATION);
  }
});

test('rangeFormat two additions two removals', () => {
  let list1 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [7, 8, 9, 10, 11, 12],
    [11, 12, 13, 14, 15, 16],
    [17, 18, 19, 20, 21, 22],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [51, 52, 53, 54, 55, 56],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  for (let i = 0; i < dh.rangeFormats.length; i++) {
    if (i < 2) {
      expect(dh.rangeFormats[i].diffType).toBe(DiffType.ADDITION);
    } else {
      expect(dh.rangeFormats[i].diffType).toBe(DiffType.REMOVAL);
    }
  }
});

test('rangeFormat two subsequent modifications', () => {
  // Ensure that two subsequent modifications are converted into single RangeFormat covering both rows.
  let list1 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [71, 52, 73, 54, 55, 76],
    [81, 82, 63, 64, 65, 86],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.rangeFormats[0].startRow).toBe(5);
  expect(dh.rangeFormats[0].startCol).toBe(0);
  expect(dh.rangeFormats[0].rowCount).toBe(2);
  expect(dh.rangeFormats[0].colCount).toBe(6);
});

test('rangeFormat block of intra-modification surrounded', () => {
  // Ensure that a 2x3 block of intra-diffs are converted to a single RangeFormat.
  let list1 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 132, 133, 134, 135, 36],
    [41, 142, 143, 144, 145, 46],
    [51, 152, 153, 154, 155, 56],
    [61, 62, 63, 64, 65, 66],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();
  console.log(dh.rangeFormats);

  expect(dh.rangeFormats.length).toBe(2); // One MODIFICATION and one MODIFICATION_INTRA
  expect(dh.rangeFormats[0].diffType).toBe(DiffType.MODIFICATION);
  expect(dh.rangeFormats[0].startCol).toBe(0);
  expect(dh.rangeFormats[0].startRow).toBe(3);
  expect(dh.rangeFormats[0].rowCount).toBe(3);
  expect(dh.rangeFormats[0].colCount).toBe(6);

  expect(dh.rangeFormats[1].diffType).toBe(DiffType.MODIFICATION_INTRA);
  expect(dh.rangeFormats[1].startCol).toBe(1);
  expect(dh.rangeFormats[1].startRow).toBe(3);
  expect(dh.rangeFormats[1].rowCount).toBe(3);
  expect(dh.rangeFormats[1].colCount).toBe(4);
});

test('rangeFormat block of intra-modification at end', () => {
  // Ensure that a 2x3 block of intra-diffs are converted to a single RangeFormat.
  let list1 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 154, 155, 156],
    [61, 62, 63, 164, 165, 166],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.rangeFormats.length).toBe(2); // One MODIFICATION and one MODIFICATION_INTRA
  expect(dh.rangeFormats[0].diffType).toBe(DiffType.MODIFICATION);
  expect(dh.rangeFormats[0].startCol).toBe(0);
  expect(dh.rangeFormats[0].startRow).toBe(5);
  expect(dh.rangeFormats[0].rowCount).toBe(2);
  expect(dh.rangeFormats[0].colCount).toBe(6);

  expect(dh.rangeFormats[1].diffType).toBe(DiffType.MODIFICATION_INTRA);
  expect(dh.rangeFormats[1].startCol).toBe(3);
  expect(dh.rangeFormats[1].startRow).toBe(5);
  expect(dh.rangeFormats[1].rowCount).toBe(2);
  expect(dh.rangeFormats[1].colCount).toBe(3);
});

test('rangeFormat two separate blocks of intra-modifications', () => {
  // Ensure that a 2x3 block of intra-diffs are converted to a single RangeFormat.
  let list1 = [
    [10, 20, 3, 4, 5, 6],
    [110, 120, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 154, 155, 156],
    [61, 62, 63, 164, 165, 166],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.rangeFormats.length).toBe(4); // Two MODIFICATION and two MODIFICATION_INTRA
  expect(dh.rangeFormats[0].diffType).toBe(DiffType.MODIFICATION);
  expect(dh.rangeFormats[0].startCol).toBe(0);
  expect(dh.rangeFormats[0].startRow).toBe(0);
  expect(dh.rangeFormats[0].rowCount).toBe(2);
  expect(dh.rangeFormats[0].colCount).toBe(6);

  expect(dh.rangeFormats[1].diffType).toBe(DiffType.MODIFICATION);
  expect(dh.rangeFormats[1].startCol).toBe(0);
  expect(dh.rangeFormats[1].startRow).toBe(5);
  expect(dh.rangeFormats[1].rowCount).toBe(2);
  expect(dh.rangeFormats[1].colCount).toBe(6);

  expect(dh.rangeFormats[2].diffType).toBe(DiffType.MODIFICATION_INTRA);
  expect(dh.rangeFormats[2].startCol).toBe(0);
  expect(dh.rangeFormats[2].startRow).toBe(0);
  expect(dh.rangeFormats[2].rowCount).toBe(2);
  expect(dh.rangeFormats[2].colCount).toBe(2);

  expect(dh.rangeFormats[3].diffType).toBe(DiffType.MODIFICATION_INTRA);
  expect(dh.rangeFormats[3].startCol).toBe(3);
  expect(dh.rangeFormats[3].startRow).toBe(5);
  expect(dh.rangeFormats[3].rowCount).toBe(2);
  expect(dh.rangeFormats[3].colCount).toBe(3);
});

test('rangeFormat two adjacent blocks of intra-modifications', () => {
  // Ensure that a 2x3 block of intra-diffs are converted to a single RangeFormat.
  let list1 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 132, 133, 134, 35, 36],
    [41, 142, 143, 144, 45, 46],
    [51, 52, 53, 154, 155, 156],
    [61, 62, 63, 164, 165, 166],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();

  expect(dh.rangeFormats.length).toBe(3); // Two MODIFICATION and two MODIFICATION_INTRA
  expect(dh.rangeFormats[0].diffType).toBe(DiffType.MODIFICATION);
  expect(dh.rangeFormats[0].startCol).toBe(0);
  expect(dh.rangeFormats[0].startRow).toBe(3);
  expect(dh.rangeFormats[0].rowCount).toBe(4);
  expect(dh.rangeFormats[0].colCount).toBe(6);

  expect(dh.rangeFormats[1].diffType).toBe(DiffType.MODIFICATION_INTRA);
  expect(dh.rangeFormats[1].startCol).toBe(1);
  expect(dh.rangeFormats[1].startRow).toBe(3);
  expect(dh.rangeFormats[1].rowCount).toBe(2);
  expect(dh.rangeFormats[1].colCount).toBe(3);

  expect(dh.rangeFormats[2].diffType).toBe(DiffType.MODIFICATION_INTRA);
  expect(dh.rangeFormats[2].startCol).toBe(3);
  expect(dh.rangeFormats[2].startRow).toBe(5);
  expect(dh.rangeFormats[2].rowCount).toBe(2);
  expect(dh.rangeFormats[2].colCount).toBe(3);
});

test('rangeFormat two overlapping blocks of intra-modifications', () => {
  // Ensure that a 2x3 block of intra-diffs are converted to a single RangeFormat.
  let list1 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 32, 33, 34, 35, 36],
    [41, 42, 43, 44, 45, 46],
    [51, 52, 53, 54, 55, 56],
    [61, 62, 63, 64, 65, 66],
  ];
  let list2 = [
    [1, 2, 3, 4, 5, 6],
    [11, 12, 13, 14, 15, 16],
    [21, 22, 23, 24, 25, 26],
    [31, 132, 133, 134, 35, 36],
    [41, 142, 143, 144, 145, 46],
    [51, 52, 53, 154, 155, 56],
    [61, 62, 63, 64, 65, 66],
  ];

  let dh = new DiffHandler(list1, list2, { colorblind: false });
  dh.compute();
  console.log(dh.rangeFormats);

  expect(dh.rangeFormats.length).toBe(4); // Two MODIFICATION and two MODIFICATION_INTRA
  expect(dh.rangeFormats[0].diffType).toBe(DiffType.MODIFICATION);
  expect(dh.rangeFormats[0].startCol).toBe(0);
  expect(dh.rangeFormats[0].startRow).toBe(3);
  expect(dh.rangeFormats[0].rowCount).toBe(3);
  expect(dh.rangeFormats[0].colCount).toBe(6);

  expect(dh.rangeFormats[1].diffType).toBe(DiffType.MODIFICATION_INTRA);
  expect(dh.rangeFormats[1].startCol).toBe(1);
  expect(dh.rangeFormats[1].startRow).toBe(3);
  expect(dh.rangeFormats[1].rowCount).toBe(2);
  expect(dh.rangeFormats[1].colCount).toBe(3);

  expect(dh.rangeFormats[2].diffType).toBe(DiffType.MODIFICATION_INTRA);
  expect(dh.rangeFormats[2].startCol).toBe(4);
  expect(dh.rangeFormats[2].startRow).toBe(4);
  expect(dh.rangeFormats[2].rowCount).toBe(2);
  expect(dh.rangeFormats[2].colCount).toBe(1);

  expect(dh.rangeFormats[3].diffType).toBe(DiffType.MODIFICATION_INTRA);
  expect(dh.rangeFormats[3].startCol).toBe(3);
  expect(dh.rangeFormats[3].startRow).toBe(5);
  expect(dh.rangeFormats[3].rowCount).toBe(1);
  expect(dh.rangeFormats[3].colCount).toBe(1);
});
