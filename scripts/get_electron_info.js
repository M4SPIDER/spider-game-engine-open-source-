const { execSync } = require('child_process');
try {
  const out = execSync('wmic process where "name=\'electron.exe\'" get processid,commandline,parentprocessid', { encoding: 'utf8' });
  console.log(out);
} catch (e) {
  console.error(e.message);
}
