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

  updateSheetLists();
  setInterval(updateSheetLists, 1000);
});

function runDiff() {
  Excel.run(async (context) => {
    console.log("runDiff()");
  });
}

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