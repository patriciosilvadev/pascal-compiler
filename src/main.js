import fs from 'fs';
import util from 'util';

import { reader } from './Reader';
import { tokenizer } from './Tokenizer';

const outPath = 'out.txt';

const args = process.argv.slice(2);
const filePath = args[0];

if (args.length > 1) {
  console.log('To maney arguements.');
  process.exit(0);
}

if (args.length < 1) {
  console.log('Missing file path.');
  process.exit(0);
}

// Function to add make each column 20 spaces width with string inside it;
const fixString = str => `${str}${' '.repeat(20 - str.length)}`;

// Read File
const file = fs.readFileSync(filePath, 'utf8');

// Tokens Iterator
const tokens = tokenizer(reader(file));

// Overwrite old out file with new header
fs.writeFileSync(outPath, `${fixString('LEXEME')}${fixString('SPELLING')}\n`);
let token = tokens.next();
while(token.type != 'EOFSYM') {
  // Apped new line to out file
  fs.appendFileSync(outPath, `${fixString(token.type)}${fixString(token.value)}\n`);
  token = tokens.next()
}
