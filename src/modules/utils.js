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
};

function equalEntries(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return compareArrays(a, b);
  } else {
    return a == b;
  }
};

export { compareArrays, equalEntries };