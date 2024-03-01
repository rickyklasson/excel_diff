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

function estComputationTime(colCount1, rowCount1, colCount2, rowCount2) {
  // Estimates the diff computation time based on the used range dimensions of the currently selected sheets.
  // Uses parameters dervied from an empirical estimation.
  // Returns estimated time [s] for computation.

  // TODO: Update with actual estimation based on row and column count.
  return Math.floor(Math.random() * 100);
}

function equalEntries(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return compareArrays(a, b);
  } else {
    return a == b;
  }
}

export { compareArrays, estComputationTime, equalEntries };
