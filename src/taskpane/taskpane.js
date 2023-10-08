/*global document, Office*/

let _count = 0;

Office.onReady(() => {
  document.getElementById("run-diff").onclick = runDiff;
  document.getElementById("select-1").onclick = listSheets;

  updateCount(); // Update count on first open.
  Office.addin.onVisibilityModeChanged(function (args) {
    if (args.visibilityMode === "Taskpane") {
      updateCount(); // Update count on subsequent opens.
    }
  });
});

function updateCount() {
  _count++;
  console.log(`Count: ${_count}`);
}

function runDiff() {
  Excel.run(async (context) => {
    console.log("Running diff");
  });
}

function listSheets() {
  Excel.run(async (context) => {
    console.log("Ran from select-1");

    let optSheets = ["Sheet1", "Sheet762"];
    let sheetSelector = document.getElementById("select-1");

    console.log(sheetSelector.options);

    // Remove all options currently in selector list.
    while (sheetSelector.length > 0) {
      sheetSelector.remove(0);
    }

    /*
    optSheets.forEach((element, key) => {
      console.log(`Added element ${element} with key ${key}`);
      sheetSelector[key] = new Option(element, key);
    });
    */

    let sheets = context.workbook.worksheets;
    sheets.load("items/name");
    await context.sync();

    sheets.items.forEach((sheet, key) => {
      console.log(sheet.name);
      sheetSelector[key] = new Option(sheet.name, sheet);
    });

    await context.sync();
  });
}
