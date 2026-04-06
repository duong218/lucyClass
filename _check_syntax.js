const fs = require('fs');
const vm = require('vm');

const files = [
  'backend\\models\\TimetableRow.js',
  'backend\\models\\TimetableCell.js',
  'backend\\controllers\\timetableController.js',
  'backend\\routes\\timetableRoutes.js'
];

let allOk = true;
files.forEach(f => {
  try {
    new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f });
    console.log('OK: ' + f);
  } catch (e) {
    console.error('FAIL: ' + f + ' -> ' + e.message);
    allOk = false;
  }
});

if (allOk) console.log('\nAll files passed syntax check.');
else process.exit(1);
