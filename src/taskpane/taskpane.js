import { DiffHandler } from '../modules/diff.js';

class ExcelHandler {
  static async getSheetValues(userConfig) {
    console.log('getSheetValues()');
    return await Excel.run(async (context) => {
      console.log('getSheetValues() async');
      // Get references to the compared sheets.
      let wbSheet1 = context.workbook.worksheets.getItem(userConfig.sheet1Name);
      let wbSheet2 = context.workbook.worksheets.getItem(userConfig.sheet2Name);

      // Get list of values from the used ranges in sheet.
      let range1 = wbSheet1.getUsedRange();
      let range2 = wbSheet2.getUsedRange();
      range1.load('values');
      range2.load('values');
      await context.sync();
      let list1 = range1.values;
      let list2 = range2.values;

      // Empty sheets hold a single empty string at index 0, if so clear list.
      if (list1.length == 1 && list1[0] == '') {
        list1 = [];
      }
      if (list2.length == 1 && list2[0] == '') {
        list2 = [];
      }
      return [list1, list2];
    });
  }

  static async createSheet(userConfig, existingSheetNames) {
    console.log('createSheet()');
    return await Excel.run(async (context) => {
      // NOTE: Max worksheet name length is 31 chars
      let sheetId = 0;
      let resultSheetNameBase =
        userConfig.sheet1Name.substring(0, 9) + '->' + userConfig.sheet2Name.substring(0, 9);
      let resultSheetName = resultSheetNameBase.concat(` (${sheetId})`);
      while (existingSheetNames.includes(resultSheetName)) {
        // Ensure unique sheet name.
        sheetId++;
        resultSheetName = resultSheetNameBase.concat(` (${sheetId})`);
      }

      context.workbook.worksheets.add(resultSheetName);
      await context.sync();
      return resultSheetName;
    });
  }

  static async diffValuesToSheet(diffHandler, sheetName) {
    console.log(`diffValuesToSheet() -> Writing ${diffHandler.nrCols * diffHandler.nrRows} cells`);
    console.time('ExcelHandler.diffValuesToSheet');
    await Excel.run(async (context) => {
      let resultSheet = context.workbook.worksheets.getItem(sheetName);
      let range = resultSheet.getRangeByIndexes(0, 0, diffHandler.nrRows, diffHandler.nrCols);

      range.load(['values']);
      await context.sync();

      // TODO: Copy column widths of second compared sheet.
      // Write diff values to sheet.
      range.values = diffHandler.diffValues;
      range.format.autofitColumns();
      await context.sync();
    });
    console.timeEnd('ExcelHandler.diffValuesToSheet');
  }

  static async diffFormatToSheet(diffHandler, sheetName) {
    console.log(`diffFormatToSheet() -> Applying ${diffHandler.rangeFormats.length} formats`);
    console.time('ExcelHandler.diffFormatToSheet');
    await Excel.run(async (context) => {
      let resultSheet = context.workbook.worksheets.getItem(sheetName);
      // Write range formats to cells.
      for (let i = 0; i < diffHandler.rangeFormats.length; i++) {
        let rangeFormat = diffHandler.rangeFormats[i];
        let rangeToFormat = resultSheet.getRangeByIndexes(
          rangeFormat.startRow,
          rangeFormat.startCol,
          rangeFormat.rowCount,
          rangeFormat.colCount
        );

        rangeToFormat.format.fill.color = rangeFormat.format.fill.color;
        rangeToFormat.format.font.color = rangeFormat.format.font.color;
        rangeToFormat.format.font.strikethrough = rangeFormat.format.font.strikethrough;
      }

      resultSheet.activate();
      await context.sync();
    });
    console.timeEnd('ExcelHandler.diffFormatToSheet');
  }
}

class UIHandler {
  constructor() {
    // Dropdown selectors.
    this.selector1 = document.getElementById('select-1');
    this.selector2 = document.getElementById('select-2');
    this.sheetNames = [];

    // Checkboxes.
    this.checkboxColorblind = document.getElementById('diff-colorblind');

    this.updateSheetLists = this.updateSheetLists.bind(this);
    this.updateSheetLists();
    setInterval(this.updateSheetLists, 1000);

    // Statistics fields
    this.linesStats = document.getElementById('lines-stats');
    this.linesAdded = document.getElementById('lines-added');
    this.linesModified = document.getElementById('lines-modified');
    this.linesRemoved = document.getElementById('lines-removed');
  }

  getUserConfig() {
    let config = {};
    // Can also be selected by: this.selector1.options[this.selector1.selectedIndex].value
    config['sheet1Name'] = this.selector1.value;
    config['sheet2Name'] = this.selector2.value;
    config['colorblind'] = this.checkboxColorblind.checked;

    return config;
  }

  setUIRunning() {
    document.getElementById('run-diff').disabled = true;
    this.linesAdded.innerText = '---';
    this.linesModified.innerText = '---';
    this.linesRemoved.innerText = '---';
  }

  setUIIdle() {
    document.getElementById('run-diff').disabled = false;
  }

  setUIStats(stats) {
    console.log('stats:');
    console.log(stats);

    this.linesStats.style.display = 'flex';
    this.linesStats.style.hidden = false;
    this.linesAdded.innerText = stats.added;
    this.linesModified.innerText = stats.modified;
    this.linesRemoved.innerText = stats.removed;
  }

  updateSheetLists() {
    // Periodically checks if sheets have been added to or removed from workbook. Updates this.sheets list.
    Excel.run(async (context) => {
      // Load sheets from workbook.
      let wbSheets = context.workbook.worksheets;
      wbSheets.load('items/name');
      await context.sync();

      // Read names of all sheets in workbook.
      let sheetNames = [];
      wbSheets.items.forEach((wbSheet) => {
        sheetNames.push(wbSheet.name);
      });

      if (JSON.stringify(sheetNames) === JSON.stringify(this.sheetNames)) {
        // Completely identical sheet lists, early return.
        return;
      }

      // Get the names of the currently selected sheets.
      let selectedSheet1Name = this.sheetNames[this.selector1.selectedIndex];
      let selectedSheet2Name = this.sheetNames[this.selector2.selectedIndex];

      // Remove all options currently in selector list.
      while (this.selector1.length > 0) {
        this.selector1.remove(0);
      }
      while (this.selector2.length > 0) {
        this.selector2.remove(0);
      }

      // Update selectors with new sheet names.
      wbSheets.items.forEach((sheet, key) => {
        this.selector1[key] = new Option(sheet.name, sheet.name);
        this.selector2[key] = new Option(sheet.name, sheet.name);
      });

      // Re-assign selection after clearing both lists if the name exists (will otherwise get index 0 which is OK).
      if (sheetNames.includes(selectedSheet1Name)) {
        this.selector1.selectedIndex = sheetNames.indexOf(selectedSheet1Name);
      }
      if (sheetNames.includes(selectedSheet2Name)) {
        this.selector2.selectedIndex = sheetNames.indexOf(selectedSheet2Name);
      }

      this.sheetNames = [...sheetNames];
      await context.sync();
    });
  }
}

class App {
  constructor() {
    console.log('App constructor()');
    this.UIHandler = new UIHandler();

    this.init();
    this.runDiff = this.runDiff.bind(this);
  }

  init() {
    console.log('App init()');
    // Use arrow function to ensure 'this' in runDiff() points to the instance of 'App'.
    document.getElementById('run-diff').addEventListener('click', () => this.runDiff());
  }

  async runDiff() {
    console.time('runDiff');
    await Excel.run(async (context) => {
      console.log('runDiff()');

      try {
        this.UIHandler.setUIRunning();

        // Get user config from UI.
        let userConfig = this.UIHandler.getUserConfig();
        console.log(`Comparing sheets: "${userConfig.sheet1Name}" and "${userConfig.sheet2Name}"`);
        console.log('userConfig:');
        console.log(userConfig);

        let [sheet1Values, sheet2Values] = await ExcelHandler.getSheetValues(userConfig);

        // Perform the diff algorithm to get a list of Diffs.
        let diffHandler = new DiffHandler(sheet1Values, sheet2Values, userConfig);

        diffHandler.compute();

        this.UIHandler.setUIStats(diffHandler.stats);

        // Create sheet for diffs and write diff values and format to sheet.
        let diffSheetName = await ExcelHandler.createSheet(userConfig, this.UIHandler.sheetNames);

        await ExcelHandler.diffValuesToSheet(diffHandler, diffSheetName);
        await ExcelHandler.diffFormatToSheet(diffHandler, diffSheetName);

        await context.sync();
      } catch (err) {
        console.log(`Error in runDiff(): ${err}\n`);
      } finally {
        this.UIHandler.setUIIdle();
      }
    });
    console.timeEnd('runDiff');
  }
}

Office.onReady(() => {
  let app = new App();
});
