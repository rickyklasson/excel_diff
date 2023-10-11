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
      [8, 'eight'],
      [9, 'nine'],
      [10, 'ten'],
    ];

    sheet1.getRange("A1:B9").values = sheet1Values;
    sheet2.getRange("A1:B10").values = sheet2Values;
    await context.sync();
  });
}

/* ---- DIFF FUNCTIONS ---- */

class Diff {
  constructor(type, before = null, after = null) {
    this.type = type;
    this.before = before;
    this.after = after;
    this.intraDiff = null;
  }


}

const compareArrays = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b);
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
  try {
    /* Computes an LCS table for lists l1 and l2. */
    n = list_one.length;
    m = list_two.length;

    // Store results in an (n+1) * (m+1) matrix. +1 for empty strings.
    let lcs = Array(n + 1).fill().map(() => Array(m + 1).fill(0))

    console.log(lcs);

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
  
      // Compute the LCS for the read data.
      let lcs = computeLCSLength(list1, list2);

      // Perform the diff algorithm to get a list of Diffs.
      

      // Clean the diff list.

      // Create corresponding formatting lists for the output.

      // Display the output in excel sheet 2.

      // TODO: Write methods to view and hide the computed diff.
    } catch (error) {
      console.log(error);
    }

    await context.sync();
  });
}
