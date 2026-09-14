const fs = require('fs');
let c = fs.readFileSync('js/main.js', 'utf8');
const oldText = "All 58 bank records are preserved from the supplied directory, which cites the National Bank of Cambodia's List of Commercial Banks, as at 31 May 2026. This source attribution and date have not been independently verified.";
const newText = "All 57 bank records are from the National Bank of Cambodia's List of Commercial Banks (https://www.nbc.gov.kh/english/supervision/commercial_banks.php) as at 31 May 2026. This data has not been independently verified.";
c = c.replace(oldText, newText);
fs.writeFileSync('js/main.js', c);
console.log('Done');