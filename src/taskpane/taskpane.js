/*global document, Office*/

let _count = 0;
let sheet1Selector = document.getElementById("select-1");
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
    console.log("updateSheetLists()");

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
    console.log("Updating lists!");
    
    let sheet1Selector = document.getElementById("select-1");
    let sheet2Selector = document.getElementById("select-2");

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

/**
 * Computes the LCS (Longest Common Subsequence) lengths for the given lists. The lists are expected to be 2D, i.e.
 * lists of lists. Wikipedia explanation: https://en.wikipedia.org/wiki/Longest_common_subsequence
 * 
 * @param {list} l1 First list for LCS algorithm. 
 * @param {list} l2 Second list for LCS algorithm.
 * @returns {list}  2D matrix of LCS lengths. 
 */
function computeLCSLength(l1, l2) {
  
}

function runDiff() {
  Excel.run(async (context) => {
    console.log("runDiff()");

    // Get data from selected excel sheets.

    // Compute the LCS for the read data.

    // Perform the diff algorithm to get a list of Diffs.
    
    // Clean the diff list.

    // Create corresponding formatting lists for the output.

    // Display the output in excel sheet 2.

    // TODO: Write methods to view and hide the computed diff.
  });
}
