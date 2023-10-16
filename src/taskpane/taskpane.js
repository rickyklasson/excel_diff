/*global document, Office*/

let _count = 0;
let sheet1Selector = document.getElementById("select-1");
let sheet2Selector = document.getElementById("select-2");
let sheetNamesOld = [];

sheet1Selector.addEventListener("change", (event) => {
  console.log(`Selected:${event.target.value}`);
  sheet1Selector.value = event.target.value;
});


Office.onReady(() => {
  document.getElementById("run-diff").onclick = runDiff;
  document.getElementById("dummy-data").onclick = addDummyData;

  updateSheetLists();
  setInterval(updateSheetLists, 1000);
});

function updateSheetLists() {
  /* Add periodic function to update list of worksheets if it has updated. */

  Excel.run(async (context) => {
    //console.log("updateSheetLists()");

    // Load sheets from workbook.
    // TODO: Can we compare sheets from different workbooks?
    let sheets = context.workbook.worksheets;
    sheets.load("items/name");
    await context.sync();

    let sheetNames = []
    sheets.items.forEach((sheet) => {
      sheetNames.push(sheet.name);
    });

    if (JSON.stringify(sheetNames) === JSON.stringify(sheetNamesOld)) {
      return;
    }
    //console.log("Updating lists!");
    
    let sheet1SelName = sheetNamesOld[sheet1Selector.selectedIndex];
    let sheet2SelName = sheetNamesOld[sheet2Selector.selectedIndex];

    // Remove all options currently in selector list.
    while (sheet1Selector.length > 0) {
      sheet1Selector.remove(0);
    }
    while (sheet2Selector.length > 0) {
      sheet2Selector.remove(0);
    }
      
    // Add updated options to selectors.
    sheets.items.forEach((sheet, key) => {
      sheet1Selector[key] = new Option(sheet.name, sheet.name);
      sheet2Selector[key] = new Option(sheet.name, sheet.name);
    });
    
    // Re-assign selection after clearing both lists.
    if (sheetNames.includes(sheet1SelName)) {
      sheet1Selector.selectedIndex = sheetNames.indexOf(sheet1SelName)
    }
    if (sheetNames.includes(sheet2SelName)) {
      sheet2Selector.selectedIndex = sheetNames.indexOf(sheet2SelName)
    }

    sheetNamesOld = [...sheetNames];
    await context.sync();
  });
}

function addDummyData() {
  Excel.run(async (context) => {
    let extraSheet1 = Math.floor(Math.random() * 1000);
    let extraSheet2 = Math.floor(Math.random() * 1000);

    context.workbook.worksheets.add(`Sheet${extraSheet1}`);
    context.workbook.worksheets.add(`Sheet${extraSheet2}`);
    await context.sync();

    let sheet1 = context.workbook.worksheets.getItem(`Sheet${extraSheet1}`);
    let sheet2 = context.workbook.worksheets.getItem(`Sheet${extraSheet2}`);

    let sheet1Values = [
      [1, 'one'],
      [2, 'two'],
      [3, 'three'],
      [4, 'four'],
      [5, 'five'],
      [6, 'six'],
      [7, 'seven'],
      [8, 'eight'],
      [9, 'nine'],
    ];

    let sheet2Values = [
      [1, 'one'],
      [2, 'two'],
      [4, 'four'],
      [5, 'five'],
      [6, 'six'],
      [7, 'seven'],
      [7.5, 'seven and a half'],
      [8, 'eights'],
      [9, 'nine'],
      [10, 'ten'],
    ];

    sheet1.getRange("A1:B9").values = sheet1Values;
    sheet2.getRange("A1:B10").values = sheet2Values;
    await context.sync();
  });
}

/* ---- DIFF FUNCTIONS ---- */

const DiffType = {
  UNCHANGED: 0,
  ADDITION: 1,
  REMOVAL: 2,
  MODIFICATION: 3,
}

class DiffHandler {
  constructor(diffs) {
    this.diffs = diffs;
  }

  toString() {
    console.log('---- DIFF ----');
    for (let i = 0; i < this.diffs.length; i++) {
      console.log(this.diffs[i].toString());
    }
  }

  getNrRows() {
    return this.diffs.length;
  }

  getNrCols() {
    let maxCols = 0;
    for (let i = 0; i < this.getNrRows(); i++) {
      let diff = this.diffs[i];
      if (diff.before != null && diff.before.length > maxCols) {
        maxCols = diff.before.length;
      }
      if (diff.after != null && diff.after.length > maxCols) {
        maxCols = diff.after.length;
      }
    }
    return maxCols;
  }

  getPaddedDiffData() {
    let diffData = [];
    let nrCols = this.getNrCols();

    for (let diffIdx = 0; diffIdx < this.getNrRows(); diffIdx++) {
      let rowData = [];
      let diff = this.diffs[diffIdx];

      for (let colIdx = 0; colIdx < nrCols; colIdx++) {
        let data = '';
        if (diff.before != null && colIdx < diff.before.length) {
          data = diff.before[colIdx];
        }
        else if (diff.after != null && colIdx < diff.after.length) {
          data = diff.after[colIdx];
        }
        rowData.push(data);
      }
      diffData.push(rowData);
    }
    return diffData;
  }

  toSheet(sheetName) {
    Excel.run(async (context) => {
      try {
        let resultSheet = context.workbook.worksheets.getItem(sheetName);
        let nrRows = this.getNrRows();
        let nrCols = this.getNrCols();
  
        let diffData = this.getPaddedDiffData();
        let range = resultSheet.getRangeByIndexes(0, 0, nrRows, nrCols);

        range.load("values");
        await context.sync();
        
        range.values = diffData;
        await context.sync();
      } catch (error) {
        console.log(error);
      }
    });
  }
}

class Diff {
  constructor(type, before = null, after = null) {
    this.type = type;
    this.before = before;
    this.after = after;
    this.subDiff = null;
  }

  toString() {
    if (this.type == DiffType.ADDITION) {
      return `+  ${this.after}`;
    }
    else if (this.type == DiffType.REMOVAL) {
      return `- ${this.before}`;
    }
    else {
      return `  ${this.before}`;
    }
  }
}

const compareArrays = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b);
}

const equalEntries = (a, b) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return compareArrays(a, b);
  }
  else {
    return a == b;
  }
}

/**
 * Computes the LCS (Longest Common Subsequence) lengths for the given lists. The lists are expected to be 2D, i.e.
 * lists of lists. Wikipedia explanation: https://en.wikipedia.org/wiki/Longest_common_subsequence
 * 
 * @param {list} l1 First list for LCS algorithm. 
 * @param {list} l2 Second list for LCS algorithm.
 * @returns {list}  2D matrix of LCS lengths. 
 */
function computeLCSLength(list_one, list_two) {
  /* Computes an LCS table for lists l1 and l2. */
  let n = list_one.length;
  let m = list_two.length;

  // Store results in an (n+1) * (m+1) matrix. +1 for empty strings.
  let lcs = Array(n + 1).fill().map(() => Array(m + 1).fill(0))

  try {
    for (let i = 0; i < n + 1; i++) {
      for (let j = 0; j < m + 1; j++) {
        if (i === 0 || j === 0) {
          lcs[i][j] = 0;
        }
        else if (compareArrays(list_one[i - 1], list_two[j - 1])) {
          lcs[i][j] = 1 + lcs[i - 1][j - 1];
        }
        else {
          lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
  return lcs;
}

function diff1D(list_one, list_two) {
  let lcs = computeLCSLength(list_one, list_two);
  let diffs = []

  let i = list_one.length;
  let j = list_two.length;

  console.log(`LCS: ${lcs}`);

  // Iterate until reaching end of both lists.
  while (i != 0 || j != 0) {
    // If reached end of one of the lists, append the remaining additions and removals.
    if (i === 0) {
      diffs.push(new Diff(DiffType.ADDITION, before = null, after = list_two[j - 1]));
      j--;
    }
    else if (j === 0) {
      diffs.push(new Diff(DiffType.REMOVAL, before = list_one[i - 1], after = null));
      i--;
    }

    // Otherwise, parts of both lists remain. If current entries are equal, they belong to the lcs.
    else if (equalEntries(list_one[i - 1], list_two[j - 1])) {
      diffs.push(new Diff(DiffType.UNCHANGED, before=list_one[i - 1], after=list_one[i - 1]));
      i--;
      j--;
    }

    // In any other case, move in the direction of the lcs.
    else if (lcs[i - 1][j] <= lcs[i][j - 1]) {
      diffs.push(new Diff(DiffType.ADDITION, before = null, after = list_two[j - 1]));
      j--;
    }
    else {
      diffs.push(new Diff(DiffType.REMOVAL, before = list_one[i - 1], after = null));
      i--;
    }
  }

  diffs = diffs.reverse();

  return diffs;
}

function runDiff() {
  Excel.run(async (context) => {
    console.log("runDiff()");

    try {
      // Get data from selected excel sheets.
      let sheet1Name = sheet1Selector.options[sheet1Selector.selectedIndex].value;
      let sheet2Name = sheet2Selector.options[sheet2Selector.selectedIndex].value;
      console.log(`Comparing    ${sheet1Name}    to    ${sheet2Name}`)

      let sheet1 = context.workbook.worksheets.getItem(sheet1Name);
      let sheet2 = context.workbook.worksheets.getItem(sheet2Name);

      let range1 = sheet1.getUsedRange();
      let range2 = sheet2.getUsedRange();
      range1.load("values");
      range2.load("values");
      await context.sync();

      let list1 = range1.values;
      let list2 = range2.values;

      console.log(`LIST 1: ${list1}`)
      console.log(`LIST 2: ${list2}`)
  
      // Perform the diff algorithm to get a list of Diffs.
      let diffs = diff1D(list1, list2);
      let diffHandler = new DiffHandler(diffs);
      console.log(diffHandler.toString())

      // Clean the diff list.

      // Create corresponding formatting lists for the output.

      // Create sheet to display diff.
      let resultSheetName = `Result_${Math.floor(Math.random() * 1000)}`;
      context.workbook.worksheets.add(resultSheetName);
      await context.sync();

      // Display diff in result sheet.
      diffHandler.toSheet(resultSheetName);

      // TODO: Write methods to view and hide the computed diff.
    } catch (error) {
      console.log(error);
    }

    await context.sync();
  });
}
