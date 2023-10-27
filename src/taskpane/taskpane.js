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
      [5, 'fives'],
      [6, 'six'],
      [7, 'seven'],
      [8, 'eight'],
      [9, 'nine'],
      [11, 'eleven'],
      [12, 'twelve'],
      [13, 'thirteen'],
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
      [11, 'eleven'],
      [12, 'twelve'],
      [13, 'thirteen'],
    ];

    sheet1.getRange("A1:B12").values = sheet1Values;
    sheet2.getRange("A1:B13").values = sheet2Values;
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

const DiffFormat = {
  UNCHANGED: {
    fill: {
      color: '#ffffff',
    },
    font: {
      color: '#000000',
      strikethrough: false,
    }
  },
  ADDITION: {
    fill: {
      color: '#daf5d4',
    },
    font: {
      color: '#053d0c',
      strikethrough: false,
    }
  },
  REMOVAL: {
    fill: {
      color: '#ebcacb',
    },
    font: {
      color: '#93141a',
      strikethrough: true,
    }
  },
  MODIFICATION_UNCHANGED: {
    fill: {
      color: '#eaeef6',
    },
    font: {
      color: '#000000',
      strikethrough: false,
    }
  },
  MODIFICATION: {
    fill: {
      color: '#c3cce3',
    },
    font: {
      color: '#142093',
      strikethrough: false,
    }
  },
}

class CellFormat {
  constructor(row, col, format) {
    this.row = row;
    this.col = col;
    this.format = format;
  }
}

class DiffHandler {
  #nrCols;
  #nrRows;
  #diffs;
  constructor(list_one, list_two) {
    this.#diffs = diff2D(list_one, list_two);
    this.#nrRows = this.#diffs.length;
    this.#nrCols = this.calcNrCols();
    this.diffData = [];
    this.cellFormats = [];
  }

  toString() {
    console.log('---- DIFF ----');
    for (let i = 0; i < this.#diffs.length; i++) {
      console.log(this.#diffs[i].toString());
    }
  }

  calcNrCols() {
    let maxCols = 0;
    for (let i = 0; i < this.#nrRows; i++) {
      let diff = this.#diffs[i];
      if (diff.before != null && diff.before.length > maxCols) {
        maxCols = diff.before.length;
      }
      if (diff.after != null && diff.after.length > maxCols) {
        maxCols = diff.after.length;
      }
    }
    return maxCols;
  }

  get nrRows() {
    return this.#nrRows;
  }

  get nrCols() {
    return this.#nrCols;
  }

  setDiffData() {
    // TODO: Collapse unchanged rows?
    this.diffData = [];

    for (let diffIdx = 0; diffIdx < this.#nrRows; diffIdx++) {
      let rowData = [];
      let diff = this.#diffs[diffIdx];

      for (let colIdx = 0; colIdx < this.#nrCols; colIdx++) {
        let data = '';

        if (diff.type == DiffType.ADDITION || diff.type == DiffType.MODIFICATION) {
          if (diff.after != null && colIdx < diff.after.length) {
            data = diff.after[colIdx];
          }
        }
        else { // REMEOVAL || UNCHANGED
          if (diff.before != null && colIdx < diff.before.length) {
            data = diff.before[colIdx];
          }
        }
        rowData.push(data);
      }
      this.diffData.push(rowData);
    }
  }

  setDiffFormat() {
    this.cellFormats = [];

    for (let diffIdx = 0; diffIdx < this.#nrRows; diffIdx++) {
      let diff = this.#diffs[diffIdx];

      for (let colIdx = 0; colIdx < this.#nrCols; colIdx++) {
        let format = null;
        if (diff.type == DiffType.ADDITION) {
          format = DiffFormat.ADDITION; 
        }
        else if (diff.type == DiffType.REMOVAL) {
          format = DiffFormat.REMOVAL;
        }
        else if (diff.type == DiffType.MODIFICATION) {
          if (diff.before[colIdx] == diff.after[colIdx]) {
            format = DiffFormat.MODIFICATION_UNCHANGED;
          }
          else {
            format = DiffFormat.MODIFICATION;
          }
        }

        if (format != null) {
          this.cellFormats.push(new CellFormat(diffIdx, colIdx, format));
        }
      }
    }
  }

  toSheet(sheetName) {
    Excel.run(async (context) => {
      try {
        let resultSheet = context.workbook.worksheets.getItem(sheetName);
  
        let range = resultSheet.getRangeByIndexes(0, 0, this.#nrRows, this.#nrCols);
        range.load(["values"]);
        await context.sync();
        
        this.setDiffData();
        range.values = this.diffData;
        range.format.autofitColumns();
        
        this.setDiffFormat();
        
        for (let i = 0; i < this.cellFormats.length; i++) {
          let cellFormat = this.cellFormats[i];

          range.getCell(cellFormat.row, cellFormat.col).format.fill.color = cellFormat.format.fill.color;
          range.getCell(cellFormat.row, cellFormat.col).format.font.color = cellFormat.format.font.color;
          range.getCell(cellFormat.row, cellFormat.col).format.font.strikethrough = cellFormat.format.font.strikethrough;
        }

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
    this.subDiffs = [];
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

  calculateSubDiff() {
    if (this.type == DiffType.MODIFICATION) {
      this.subDiffs = diff1D(this.before, this.after);
    }
  }
}

const compareArrays = (a, b) => {
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

function trimEqualEntries(listOne, listTwo) {
  let diffsPre = []; // Diffs to prepend to the final diffs list
  let diffsPost = []; // Diffs to append to the final diffs list

  if (listOne.length === 0 || listTwo.length === 0) {
    return [diffsPre, diffsPost];
  }

  let i = 0;

  while (i < listOne.length && i < listTwo.length) {
    if (equalEntries(listOne[i], listTwo[i])) {
      diffsPre.push(new Diff(DiffType.UNCHANGED, before=listOne[i], after=listOne[i]));
    }
    else {
      break;  
    }
    i++;
  }

  j = listOne.length - 1;
  k = listTwo.length - 1;

  while (j > i && k > i) {
    if (equalEntries(listOne[j], listTwo[k])) {
      diffsPost.unshift(new Diff(DiffType.UNCHANGED, before = listOne[j], after = listOne[j]));
    }
    else {
      break;  
    }
    j--;
    k--;
  }

  return [diffsPre, diffsPost];
}

function diff1D(listOne, listTwo) {
  let diffs = [];
  const [diffsPre, diffsPost] = trimEqualEntries(listOne, listTwo);

  // Actually trim the lists before performing the rest of the algorithm.
  listOne = listOne.slice(diffsPre.length, diffsPost.length ? -diffsPost.length : listOne.length);
  listTwo = listTwo.slice(diffsPre.length, diffsPost.length ? -diffsPost.length : listOne.length);
  
  let lcs = computeLCSLength(listOne, listTwo);
  
  let i = listOne.length;
  let j = listTwo.length;
  
  //console.log(`LCS: ${lcs}`);
  
  // Iterate until reaching end of both lists.
  while (i != 0 || j != 0) {
    // If reached end of one of the lists, append the remaining additions and removals.
    if (i === 0) {
      diffs.push(new Diff(DiffType.ADDITION, before = null, after = listTwo[j - 1]));
      j--;
    }
    else if (j === 0) {
      diffs.push(new Diff(DiffType.REMOVAL, before = listOne[i - 1], after = null));
      i--;
    }

    // Otherwise, parts of both lists remain. If current entries are equal, they belong to the lcs.
    else if (equalEntries(listOne[i - 1], listTwo[j - 1])) {
      diffs.push(new Diff(DiffType.UNCHANGED, before=listOne[i - 1], after=listOne[i - 1]));
      i--;
      j--;
    }

    // In any other case, move in the direction of the lcs.
    else if (lcs[i - 1][j] <= lcs[i][j - 1]) {
      diffs.push(new Diff(DiffType.ADDITION, before = null, after = listTwo[j - 1]));
      j--;
    }
    else {
      diffs.push(new Diff(DiffType.REMOVAL, before = listOne[i - 1], after = null));
      i--;
    }
  }

  diffs.reverse();

  if (diffsPre.length) {
    diffs.unshift(...diffsPre);
  }
  if (diffsPost.length) {
    diffs = diffs.concat(diffsPost);
  }

  return diffs;
}

function clean_diff_list(diffs) {
  let diff_clean = [];
  let diff_deque = [];

  //console.log(diffs.toString())

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
      top_diff = diff_deque[0];

      if (d.type == DiffType.ADDITION && top_diff.type == DiffType.REMOVAL) {
        diff_mod = new Diff(DiffType.MODIFICATION, before = top_diff.before, after = d.after);
        diff_clean.push(diff_mod);
        diff_deque.shift();
      }
      else if (d.type == DiffType.REMOVAL && top_diff.type == DiffType.ADDITION) {
        diff_mod = new Diff(DiffType.MODIFICATION, before = d.before, after = top_diff.after);
        diff_clean.push(diff_mod);
        diff_deque.shift();
      }
      else {
        // Same type as in deque, push to it.
        diff_deque.push(d);
      }
    }
    else {
      if (d.type == DiffType.ADDITION || d.type == DiffType.REMOVAL) {
        diff_deque.push(d);
      }
      else {
        console.log('THIS SHOULD NEVER HAPPEN!!! Raise error??')
      }
    }

  }

  return diff_clean;
}

function diff2D(list_one, list_two) {
  console.time('diff1D');
  let diffs = diff1D(list_one, list_two);
  console.timeEnd('diff1D');

  console.time('cleanDiff');
  diffs = clean_diff_list(diffs);
  console.timeEnd('cleanDiff');

  console.time('subDiffs');
  for (let d of diffs) {
    d.calculateSubDiff();
  }
  console.timeEnd('subDiffs');

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

      //console.log(`LIST 1: ${list1}`)
      //console.log(`LIST 2: ${list2}`)
  
      // Perform the diff algorithm to get a list of Diffs.
      let diffHandler = new DiffHandler(list1, list2);
      //console.log(diffHandler.toString())

      // Create sheet to display diff.
      let resultSheetName = `Result_${Math.floor(Math.random() * 1000)}`;
      context.workbook.worksheets.add(resultSheetName);
      await context.sync();

      // Display diff in result sheet.
      console.time('toSheet');
      diffHandler.toSheet(resultSheetName);
      console.timeEnd('toSheet');
      
      await context.sync();
    } catch (error) {
      console.log(error);
    }
  });
}
