import { DiffHandler } from "../modules/diff";

let sheet1Selector = document.getElementById("select-1");
let sheet2Selector = document.getElementById("select-2");
let sheetNamesOld = [];

Office.onReady(() => {
  document.getElementById("run-diff").onclick = runDiff;

  updateSheetLists();
  setInterval(updateSheetLists, 1000);
});

function updateSheetLists() {
  // Periodic function to update list of worksheets if worksheets have been added.

  Excel.run(async (context) => {
    // Load sheets from workbook.
    // TODO: Can we compare sheets from different workbooks?
    let sheets = context.workbook.worksheets;
    sheets.load("items/name");
    await context.sync();

    let sheetNames = [];
    sheets.items.forEach((sheet) => {
      sheetNames.push(sheet.name);
    });

    if (JSON.stringify(sheetNames) === JSON.stringify(sheetNamesOld)) {
      return;
    }
    
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

function runDiff() {
  Excel.run(async (context) => {
    console.log("-------- RUNNING MAIN DIFF FUNCTION -------");

    try {
      // Get data from selected excel sheets.
      let sheet1Name = sheet1Selector.options[sheet1Selector.selectedIndex].value;
      let sheet2Name = sheet2Selector.options[sheet2Selector.selectedIndex].value;
      console.log(`Comparing sheets: ${sheet1Name}  and  ${sheet2Name}`)

      let sheet1 = context.workbook.worksheets.getItem(sheet1Name);
      let sheet2 = context.workbook.worksheets.getItem(sheet2Name);

      let range1 = sheet1.getUsedRange();
      let range2 = sheet2.getUsedRange();
      range1.load("values");
      range2.load("values");
      await context.sync();

      let list1 = range1.values;
      let list2 = range2.values;

      if (list1.length == 1 && list1[0] == '') {
        list1 = [];
      }
      if (list2.length == 1 && list2[0] == '') {
        list2 = [];
      }

      // Perform the diff algorithm to get a list of Diffs.
      let diffHandler = new DiffHandler(list1, list2);
      diffHandler.compute();

      // Create sheet to display diff.
      // NOTE: Max worksheet name length is 31 chars
      let sheetId = 0;
      let resultSheetNameBase = `D_${sheet1Name.substring(0, 9)}__${sheet2Name.substring(0, 9)}`;
      let resultSheetName = resultSheetNameBase.concat(`_(${sheetId})`);
      while (sheetNamesOld.includes(resultSheetName)) {
        // Ensure unique sheet name.
        sheetId++;
        resultSheetName = resultSheetNameBase.concat(`_(${sheetId})`);
      }

      context.workbook.worksheets.add(resultSheetName);
      await context.sync();
      updateSheetLists();

      // Display diff in result sheet.
      diffHandler.toSheet(resultSheetName);
      
      await context.sync();
    } catch (error) {
      console.log(error);
    }
  });
}