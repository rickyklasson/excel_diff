import { equalEntries, compareArrays } from '../modules/utils';

const DiffType = {
  UNCHANGED: 'UNCHANGED',
  ADDITION: 'ADDITION',
  REMOVAL: 'REMOVAL',
  MODIFICATION: 'MODIFICATION',
  MODIFICATION_INTRA: 'MODIFICATION_INTRA',
};

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
      this.subDiffs = [];

      // Compute subDiffs as the direct difference between the 'after' and the 'before' values.
      for (let i = 0; i < this.after.length; i++) {
        let before = null;
        if (i < this.before.length) {
          // Normal case: Both 'before' and 'after' have elements to compare.
          before = this.before[i];
        }

        let diffType = DiffType.UNCHANGED;
        if (this.after[i] != before) {
          diffType = DiffType.MODIFICATION_INTRA;
        }
        this.subDiffs.push(new Diff(diffType, before, this.after[i]));
      }
    }
  }
}

class RangeFormat {
  constructor(startRow, startCol, rowCount, colCount, diffType) {
    this.startRow = startRow;
    this.startCol = startCol;
    this.rowCount = rowCount;
    this.colCount = colCount;
    this.diffType = diffType;
  }
}

class DiffHandler {
  constructor(list1, list2, userConfig) {
    this.list1 = list1;
    this.list2 = list2;
    this.userConfig = userConfig;
    this.diffs = [];
    this.collapsibleRowRanges = []; // List of row pairs: [[startRow, endRow], ..] that are unchanged and can be collapsed.
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
    this.collapsibleRowRanges = this.userConfig['collapse'] ? this.computeCollapsibleRows() : [];
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

  computeCollapsibleRows() {
    const MINCOLLAPSEROWS = 5;
    const COLLAPSEMARGIN = 1;

    let collapsibleRowRanges = [];
    let collapseStart = 1;
    let collapseEnd = null;

    let rowIdx = 1; // Excel ranges start at row 1 (not 0).
    for (let d of this.diffs) {
      if (d.type != DiffType.UNCHANGED || rowIdx == this.diffs.length - 1) {
        // End of collapsible segment.
        collapseEnd = rowIdx - 1;
        if (collapseEnd > collapseStart + MINCOLLAPSEROWS) {
          // Push [startRow, endRow] with margins on either side to the collapsibleRowRanges list.
          collapsibleRowRanges.push([collapseStart + COLLAPSEMARGIN, collapseEnd - COLLAPSEMARGIN]);
        }
        collapseStart = rowIdx + 1;
      }
      rowIdx++;
    }
    return collapsibleRowRanges;
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

  computeRangeFormatsOuter() {
    // Computes the rangeFormats for all complete rows, not subDiffs.
    let rangeFormatsOuter = [];
    let prevDiffType = DiffType.UNCHANGED;
    let rangeFormat = new RangeFormat(0, 0, 0, 0, DiffType.UNCHANGED);

    for (let diffIdx = 0; diffIdx < this.nrRows; diffIdx++) {
      let diff = this.diffs[diffIdx];

      if (diff.type == DiffType.UNCHANGED) {
        // Reached an unchanged row, push if current rangeFormat corresponds to a changed row.
        if (prevDiffType != DiffType.UNCHANGED) {
          rangeFormatsOuter.push(rangeFormat);
          rangeFormat = new RangeFormat(0, 0, 0, 0, DiffType.UNCHANGED);
        }
      } else {
        if (diff.type == prevDiffType) {
          // Same format as previously parsed format -> Expand the range to cover this diffIdx as well.
          rangeFormat.rowCount++;
        } else {
          // Not same format -> Push previous to list and create new rangeFormat.
          if (prevDiffType != DiffType.UNCHANGED) {
            rangeFormatsOuter.push(rangeFormat);
          }

          // New RangeFormat of the current diff type.
          rangeFormat = new RangeFormat(diffIdx, 0, 1, this.nrCols, diff.type);
        }
      }
      prevDiffType = diff.type;
    }
    if (rangeFormat.diffType != DiffType.UNCHANGED) {
      // Final iteration format
      rangeFormatsOuter.push(rangeFormat);
    }
    return rangeFormatsOuter;
  }

  getIntraCoordsXY() {
    // Reads the diff list and extracts 2d-coordinates (row, col) for each intra-diff.
    let coords = [];

    for (let row = 0; row < this.diffs.length; row++) {
      let diff = this.diffs[row];

      if (diff.type != DiffType.MODIFICATION) {
        continue;
      }

      for (let col = 0; col < diff.subDiffs.length; col++) {
        if (diff.subDiffs[col].type == DiffType.MODIFICATION_INTRA || diff.subDiffs[col].type == DiffType.ADDITION) {
          coords.push([col, row]);
        }
      }
    }
    return coords;
  }

  /**
   * Searches the list of coordinates and attempts to group adjacent coords into a larger coordinate
   * group. Group must be a rectangle.
   *
   * @param {list} coordsXY List of XY-coordinates, e.g.: [[0, 1], [0, 2], [0, 3], [1, 1], [1, 2]]
   * @param {list} startIdx Start idx for group search.
   * @param {obj}  cache Cache with keys corresponding to the coordsXY idx of already grouped coords.
   * @returns {list} List with contents: [nrCols, nrRows].
   */
  findCoordGroup(coordsXY, startIdx, cache) {
    const [startX, startY] = coordsXY[startIdx];
    let soughtX = startX + 1;
    let soughtY = startY;

    let nrCols = 1; // Start at 1 since startXY is included in result.
    // First search in X-direction until no more adjacent intra-diffs are found.
    for (let listIdx = startIdx + 1; listIdx < coordsXY.length; listIdx++) {
      if (listIdx in cache) {
        break;
      }

      const [evalX, evalY] = coordsXY[listIdx];

      // Adjacent cells in X-direction are expected to be directly after the start cell.
      if (evalX == soughtX && evalY == soughtY) {
        nrCols++;
        soughtX++;
        cache[listIdx] = 1; // Cache adjacent row cells since directly part of the group
      } else {
        break;
      }
    }

    // nrCols now corresponds to the width of the cell group.
    // Continue searching for rows.
    let nrRows = 1; // Start at 1 since startXY is included in result.
    let foundAtRow = []; // Indices of cells found at next row, directly below the first row.
    soughtX = startX;
    soughtY = startY + 1;
    for (let listIdx = startIdx + nrCols; listIdx < coordsXY.length; listIdx++) {
      if (listIdx in cache) {
        break;
      }

      const [evalX, evalY] = coordsXY[listIdx];

      // Exit condition: evalY is out of reach (at a too high Y-coordinate)
      if (evalY > soughtY) {
        break;
      }

      if (evalX == soughtX && evalY == soughtY) {
        foundAtRow.push(listIdx);

        if (foundAtRow.length == nrCols) {
          // Found complete row, cache all cells in row and continue searching for next row.
          for (let idx of foundAtRow) {
            cache[idx] = 1;
          }
          foundAtRow = [];

          nrRows++;
          soughtX = startX;
          soughtY++;
        } else {
          soughtX++;
        }
      }
    }
    return [nrCols, nrRows];
  }

  computeRangeFormatsIntra() {
    // Computes rangeFormats for subDiffs (intra-row diffs).

    let rangeFormatsIntra = [];
    let cache = {}; // Cache intraCoordsXY list idx of handled intra-diff cells.
    let intraCoordsXY = this.getIntraCoordsXY();

    for (const [idx, coordXY] of intraCoordsXY.entries()) {
      if (idx in cache) {
        continue;
      }
      let [startX, startY] = intraCoordsXY[idx];
      let [nrCols, nrRows] = this.findCoordGroup(intraCoordsXY, idx, cache);
      rangeFormatsIntra.push(new RangeFormat(startY, startX, nrRows, nrCols, DiffType.MODIFICATION_INTRA));
    }
    return rangeFormatsIntra;
  }

  computeRangeFormats() {
    let rangeFormatsOuter = this.computeRangeFormatsOuter();
    let rangeFormatsIntra = this.computeRangeFormatsIntra();

    return rangeFormatsOuter.concat(rangeFormatsIntra);
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

function getEqualEntries(list1, list2) {
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

function cleanDiffList(diffs, isSubDiff = false) {
  // Replace ADDITION-REMOVAL pair with MODIFICATION.
  let diffClean = [];
  let diffDeque = [];

  let modificationType = isSubDiff ? DiffType.MODIFICATION_INTRA : DiffType.MODIFICATION;

  for (let i = 0; i < diffs.length; i++) {
    let d = diffs[i];

    if (d.type === DiffType.UNCHANGED) {
      // New chunk, copy deque to cleaned list and move on to next iteration.
      diffClean = diffClean.concat(diffDeque);
      diffClean.push(d);
      diffDeque = [];
      continue;
    }

    if (diffDeque.length) {
      let top_diff = diffDeque[0];

      if (d.type == DiffType.ADDITION && top_diff.type == DiffType.REMOVAL) {
        let diff_mod = new Diff(modificationType, top_diff.before, d.after);
        diffClean.push(diff_mod);
        diffDeque.shift();
      } else if (d.type == DiffType.REMOVAL && top_diff.type == DiffType.ADDITION) {
        let diff_mod = new Diff(modificationType, d.before, top_diff.after);
        diffClean.push(diff_mod);
        diffDeque.shift();
      } else {
        // Same type as in deque, push to it.
        diffDeque.push(d);
      }
    } else {
      if (d.type == DiffType.ADDITION || d.type == DiffType.REMOVAL) {
        diffDeque.push(d);
      } else {
        throw new Error('Added diff of type MODIFICATION to diff_deque. This should never happen.');
      }
    }
  }

  if (diffDeque.length > 0) {
    diffClean = diffClean.concat(diffDeque);
  }

  return diffClean;
}

function diff1D(list1, list2) {
  let diffs = [];

  const [diffsStart, diffsEnd] = getEqualEntries(list1, list2);

  // Trim the lists before performing the rest of the algorithm.
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

  diffs = cleanDiffList(diffs);

  for (let d of diffs) {
    d.calculateSubDiff();
  }

  return diffs;
}

export { DiffHandler, diff2D, DiffType };
