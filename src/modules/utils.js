function compareArrays(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  // We can use either array length here since length inequality is checked above.
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function interp(xList, yList, value) {
  // Interpolates value between points in xList and projects onto yList.
  let x1, x2, y1, y2;
  let found = false;

  for (let i = 0; i < xList.length; i++) {
    if (value < xList[i]) {
      if (i == 0) {
        x1 = 0;
        y1 = 0;
        x2 = xList[0];
        y2 = yList[0];
      } else {
        x1 = xList[i - 1];
        y1 = yList[i - 1];
        x2 = xList[i];
        y2 = yList[i];
      }
      found = true;
      break;
    }
  }
  if (!found) {
    return yList[yList.length - 1];
  }

  return y1 + ((value - x1) / (x2 - x1)) * (y2 - y1);
}

function estComputationTime(colCount, rowCount) {
  // Estimates the diff computation time based on the used range dimensions of a sheet.
  // Should be called with the dimensions of the sheet with the least rows.
  // Uses parameters dervied from an empirical estimation.
  // Returns estimated time [s] for computation.

  // Empirically measured constants.
  const BASELINE_ROWS = 1000;
  const BASELINE_COLS = 25;
  const BASELINE_TIME = 1250; // [ms]

  const ROW_COUNTS = [100, 500, 1000, 2000, 5000, 10000, 25000];
  const ROW_FACTORS = [0.2, 0.5, 1, 1.7, 5, 12, 50];
  const COL_COUNTS = [1, 5, 10, 25, 50, 100, 200];
  const COL_FACTORS = [0.2, 0.3, 0.55, 1, 2.5, 7, 12];

  let rowFactor = interp(ROW_COUNTS, ROW_FACTORS, rowCount);
  let colFactor = interp(COL_COUNTS, COL_FACTORS, colCount);

  return Math.floor((1250 * rowFactor * colFactor) / 1000);
}

function equalEntries(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return compareArrays(a, b);
  } else {
    return a == b;
  }
}

export { compareArrays, estComputationTime, equalEntries };
