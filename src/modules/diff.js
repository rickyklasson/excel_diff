import { equalEntries, compareArrays } from '../modules/utils';

const DiffType = {
  UNCHANGED: 0,
  ADDITION: 1,
  REMOVAL: 2,
  MODIFICATION: 3,
};

const DiffFormat = {
  UNCHANGED: {
    fill: {
      color: '#ffffff',
    },
    font: {
      color: '#000000',
      strikethrough: false,
    },
  },
  ADDITION: {
    fill: {
      color: '#daf5d4',
    },
    font: {
      color: '#053d0c',
      strikethrough: false,
    },
  },
  REMOVAL: {
    fill: {
      color: '#ebcacb',
    },
    font: {
      color: '#93141a',
      strikethrough: true,
    },
  },
  MODIFICATION_UNCHANGED: {
    fill: {
      color: '#eaeef6',
    },
    font: {
      color: '#000000',
      strikethrough: false,
    },
  },
  MODIFICATION: {
    fill: {
      color: '#c3cce3',
    },
    font: {
      color: '#142093',
      strikethrough: false,
    },
  },
};

class RangeFormat {
  constructor(startRow, startCol, rowCount, colCount, format) {
    this.startRow = startRow;
    this.startCol = startCol;
    this.colCount = colCount;
    this.rowCount = rowCount;
    this.format = format;
  }
}

class DiffHandler {
  constructor(list1, list2) {
    this.list1 = list1;
    this.list2 = list2;
    this.diffs = [];
    this.nrRows = 0;
    this.nrCols = 0;
    this.diffValues = [];
    this.rangeFormats = [];
    this.stats = {
      added: 0,
      modified: 0,
      removed: 0,
    };
  }

  computeStats() {
    let added = 0,
      modified = 0,
      removed = 0;

    for (let diff of this.diffs) {
      if (diff.type === DiffType.ADDITION) {
        added++;
      } else if (diff.type === DiffType.MODIFICATION) {
        modified++;
      } else if (diff.type === DiffType.REMOVAL) {
        removed++;
      }
    }
    let stats = { added: added, modified: modified, removed: removed };
    return stats;
  }

  compute() {
    this.diffs = diff2D(this.list1, this.list2);
    this.nrRows = this.diffs.length;
    this.nrCols = this.calcNrCols();
    this.diffValues = this.computeDiffValues();
    this.stats = this.computeStats();
    this.rangeFormats = this.computeRangeFormats();
  }

  calcNrCols() {
    let maxCols = 0;
    for (let i = 0; i < this.list1.length; i++) {
      if (this.list1[i].length > maxCols) {
        maxCols = this.list1[i].length;
      }
    }
    for (let i = 0; i < this.list2.length; i++) {
      if (this.list2[i].length > maxCols) {
        maxCols = this.list2[i].length;
      }
    }
    return maxCols;
  }

  computeDiffValues() {
    let diffValues = [];

    for (let diffIdx = 0; diffIdx < this.nrRows; diffIdx++) {
      let rowData = [];
      let diff = this.diffs[diffIdx];

      for (let colIdx = 0; colIdx < this.nrCols; colIdx++) {
        let data = '';

        if (diff.type == DiffType.ADDITION || diff.type == DiffType.MODIFICATION) {
          if (diff.after != null && colIdx < diff.after.length) {
            data = diff.after[colIdx];
          }
        } else {
          // REMEOVAL || UNCHANGED
          if (diff.before != null && colIdx < diff.before.length) {
            data = diff.before[colIdx];
          }
        }
        rowData.push(data);
      }
      diffValues.push(rowData);
    }
    return diffValues;
  }

  computeRangeFormats() {
    // TODO: More efficient format ranges, i.e. not one for each cell, but convert into
    // ranges that span multiple cells/rows.
    let rangeFormats = [];

    for (let diffIdx = 0; diffIdx < this.nrRows; diffIdx++) {
      let diff = this.diffs[diffIdx];

      // Compile a list of formats to apply to the resulting sheet. One for each line of ADDITION/REMOVAL/MODIFICATION
      // and one for each intra-modified cell.
      if (diff.type == DiffType.ADDITION) {
        rangeFormats.push(new RangeFormat(diffIdx, 0, 1, this.nrCols, DiffFormat.ADDITION));
      } else if (diff.type == DiffType.REMOVAL) {
        rangeFormats.push(new RangeFormat(diffIdx, 0, 1, this.nrCols, DiffFormat.REMOVAL));
      } else if (diff.type == DiffType.MODIFICATION) {
        rangeFormats.push(
          new RangeFormat(diffIdx, 0, 1, this.nrCols, DiffFormat.MODIFICATION_UNCHANGED)
        );

        for (let colIdx = 0; colIdx < this.nrCols; colIdx++) {
          if (diff.before[colIdx] != diff.after[colIdx]) {
            rangeFormats.push(new RangeFormat(diffIdx, colIdx, 1, 1, DiffFormat.MODIFICATION));
          }
        }
      }
    }
    return rangeFormats;
  }
}

class Diff {
  constructor(type, before = null, after = null) {
    this.type = type;
    this.before = before;
    this.after = after;
    this.subDiffs = [];
  }

  toString() {
    if (this.type == DiffType.ADDITION) {
      return `+  ${this.after}`;
    } else if (this.type == DiffType.REMOVAL) {
      return `- ${this.before}`;
    } else {
      return `  ${this.before}`;
    }
  }

  calculateSubDiff() {
    if (this.type == DiffType.MODIFICATION) {
      this.subDiffs = diff1D(this.before, this.after);
    }
  }
}

/**
 * Computes the LCS (Longest Common Subsequence) lengths for the given lists. The lists are expected to be 2D, i.e.
 * lists of lists. Wikipedia explanation: https://en.wikipedia.org/wiki/Longest_common_subsequence
 *
 * @param {list} list1 First list for LCS algorithm.
 * @param {list} list2 Second list for LCS algorithm.
 * @returns {list}  2D list of LCS lengths.
 */
function computeLCSLength(list1, list2) {
  /* Computes an LCS table for lists l1 and l2. */
  let n = list1.length;
  let m = list2.length;

  // Store results in an (n+1) * (m+1) matrix. +1 for empty strings.
  let lcs = Array(n + 1)
    .fill()
    .map(() => Array(m + 1).fill(0));

  for (let i = 0; i < n + 1; i++) {
    for (let j = 0; j < m + 1; j++) {
      if (i === 0 || j === 0) {
        lcs[i][j] = 0;
      } else if (compareArrays(list1[i - 1], list2[j - 1])) {
        lcs[i][j] = 1 + lcs[i - 1][j - 1];
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }
  return lcs;
}

function trimEqualEntries(list1, list2) {
  // Compares the lists for equals entries at start and end. These entries can then be directly
  // added to the list of diffs and do not need to be part of the LCS calculation.

  let diffsStart = []; // Diffs to prepend to the final diffs list
  let diffsEnd = []; // Diffs to append to the final diffs list
  let startIdx, endIdxOne, endIdxTwo;

  if (list1.length === 0 || list2.length === 0) {
    return [diffsStart, diffsEnd];
  }

  startIdx = 0;
  while (startIdx < list1.length && startIdx < list2.length) {
    if (equalEntries(list1[startIdx], list2[startIdx])) {
      let d = new Diff(DiffType.UNCHANGED, list1[startIdx], list1[startIdx]);
      diffsStart.push(d);
    } else {
      break;
    }
    startIdx++;
  }

  endIdxOne = list1.length - 1;
  endIdxTwo = list2.length - 1;
  while (endIdxOne > startIdx && endIdxTwo > startIdx) {
    if (equalEntries(list1[endIdxOne], list2[endIdxTwo])) {
      diffsEnd.unshift(new Diff(DiffType.UNCHANGED, list1[endIdxOne], list1[endIdxOne]));
    } else {
      break;
    }
    endIdxOne--;
    endIdxTwo--;
  }

  return [diffsStart, diffsEnd];
}

function clean_diff_list(diffs) {
  let diff_clean = [];
  let diff_deque = [];

  for (let i = 0; i < diffs.length; i++) {
    let d = diffs[i];

    // New chunk, copy deque to cleaned list and move on to next iteration.
    if (d.type === DiffType.UNCHANGED) {
      diff_clean = diff_clean.concat(diff_deque);
      diff_clean.push(d);
      diff_deque = [];
      continue;
    }

    if (diff_deque.length) {
      let top_diff = diff_deque[0];

      if (d.type == DiffType.ADDITION && top_diff.type == DiffType.REMOVAL) {
        let diff_mod = new Diff(DiffType.MODIFICATION, top_diff.before, d.after);
        diff_clean.push(diff_mod);
        diff_deque.shift();
      } else if (d.type == DiffType.REMOVAL && top_diff.type == DiffType.ADDITION) {
        let diff_mod = new Diff(DiffType.MODIFICATION, d.before, top_diff.after);
        diff_clean.push(diff_mod);
        diff_deque.shift();
      } else {
        // Same type as in deque, push to it.
        diff_deque.push(d);
      }
    } else {
      if (d.type == DiffType.ADDITION || d.type == DiffType.REMOVAL) {
        diff_deque.push(d);
      } else {
        throw new Error('This should never happen. Fix implementation!');
      }
    }
  }

  if (diff_deque.length > 0) {
    diff_clean = diff_clean.concat(diff_deque);
  }

  return diff_clean;
}

function diff1D(list1, list2) {
  let diffs = [];

  const [diffsStart, diffsEnd] = trimEqualEntries(list1, list2);

  // Actually trim the lists before performing the rest of the algorithm.
  list1 = list1.slice(diffsStart.length, diffsEnd.length ? -diffsEnd.length : list1.length);
  list2 = list2.slice(diffsStart.length, diffsEnd.length ? -diffsEnd.length : list2.length);

  let lcs = computeLCSLength(list1, list2);

  let i = list1.length;
  let j = list2.length;

  // Iterate until reaching end of both lists.
  while (i != 0 || j != 0) {
    // If reached end of one of the lists, append the remaining additions and removals.
    if (i === 0) {
      diffs.push(new Diff(DiffType.ADDITION, null, list2[j - 1]));
      j--;
    } else if (j === 0) {
      diffs.push(new Diff(DiffType.REMOVAL, list1[i - 1], null));
      i--;
    }

    // Otherwise, parts of both lists remain. If current entries are equal, they belong to the lcs.
    else if (equalEntries(list1[i - 1], list2[j - 1])) {
      diffs.push(new Diff(DiffType.UNCHANGED, list1[i - 1], list1[i - 1]));
      i--;
      j--;
    }

    // In any other case, move in the direction of the lcs.
    else if (lcs[i - 1][j] <= lcs[i][j - 1]) {
      diffs.push(new Diff(DiffType.ADDITION, null, list2[j - 1]));
      j--;
    } else {
      diffs.push(new Diff(DiffType.REMOVAL, list1[i - 1], null));
      i--;
    }
  }

  diffs.reverse();

  if (diffsStart.length) {
    diffs.unshift(...diffsStart);
  }
  if (diffsEnd.length) {
    diffs = diffs.concat(diffsEnd);
  }

  return diffs;
}

function diff2D(list1, list2) {
  let diffs = diff1D(list1, list2);

  diffs = clean_diff_list(diffs);

  for (let d of diffs) {
    d.calculateSubDiff();
  }

  return diffs;
}

export { DiffHandler, diff2D, DiffType };
