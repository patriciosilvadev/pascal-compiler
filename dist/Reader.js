'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var reader = exports.reader = function reader(input) {
  var pos = 0,
      line = 1,
      col = 0;

  var next = function next() {
    var ch = input.charAt(pos++);

    if (ch === '\n') {
      line++;
      col = 0;
    } else {
      col++;
    }

    return ch;
  };

  var peek = function peek() {
    var spaces = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    return input.charAt(pos + spaces);
  };

  var eof = function eof() {
    return peek() !== 0 && peek() === '';
  };

  var croak = function croak(msg) {
    console.log(msg + ' (' + line + ':' + col + ')');
  };

  return {
    next: next,
    peek: peek,
    eof: eof,
    croak: croak
  };
};