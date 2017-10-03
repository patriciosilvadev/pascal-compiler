'use strict';

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _Reader = require('./Reader');

var _Tokenizer = require('./Tokenizer');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var outPath = 'out.txt';

var args = process.argv.slice(2);
var filePath = args[0];

if (args.length > 1) {
  console.log('To maney arguements.');
  process.exit(0);
}

if (args.length < 1) {
  console.log('Missing file path.');
  process.exit(0);
}

// Function to add make each column 20 spaces width with string inside it;
var fixString = function fixString(str) {
  return '' + str + ' '.repeat(50 - str.length);
};

// Read File
var file = _fs2.default.readFileSync(filePath, 'utf8');

// Tokens Iterator
var tokens = (0, _Tokenizer.tokenizer)((0, _Reader.reader)(file));

// Overwrite old out file with new header
_fs2.default.writeFileSync(outPath, '' + fixString('LEXEME') + fixString('SPELLING') + '\n');
var token = tokens.next();
while (token.type != 'eofsym') {
  // Apped new line to out file
  // console.log(token);
  _fs2.default.appendFileSync(outPath, '' + fixString(token.type) + fixString(token.value) + '\n');
  token = tokens.next();
}
_fs2.default.appendFileSync(outPath, '' + fixString(token.type) + fixString('null') + '\n');