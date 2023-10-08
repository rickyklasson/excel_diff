/*global document, Office*/

let _count = 0;

Office.onReady(() => {
  document.getElementById("run-diff").onclick = runDiff;

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
    console.log("Ran from taskpane.js");
  })
}