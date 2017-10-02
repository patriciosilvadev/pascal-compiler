'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var tokenizer = exports.tokenizer = function tokenizer(input) {
  var current = null;
  var reserved = {
    'and': 'AMD',
    'array': 'ARRAY',
    'begin': 'BEGIN',
    'char': 'CHAR',
    'chr': 'CHR',
    'div': 'DIV',
    'do': 'DO',
    'else': 'ELSE',
    'end': 'END',
    'if': 'IF',
    'integer': 'INTEGER',
    'mod': 'MOD',
    'not': 'NOT',
    'of': 'OF',
    'or': 'OR',
    'ord': 'ORD',
    'procedure': 'PROCEDURE',
    'program': 'PROGRAM',
    'read': 'READ',
    'readIn': 'READIN',
    'then': 'THEN',
    'var': 'VAR',
    'while': 'WHILE',
    'write': 'WRITE',
    'writeIn': 'WRITEIN',
    'function': 'FUNCTION' //Add by me
  };

  var operators = {
    '+': 'PLUS',
    '-': 'MINUS',
    '*': 'TIMES',
    '<': 'LESS',
    '>': 'GREATER',
    '=': 'EQUAL',
    ':': 'COLON',
    ';': 'SEMICOLON',
    ',': 'COMMA',
    '(': 'LPAREN',
    ')': 'RPAREN',
    '.': 'PERIOD',
    ':=': 'ASSIGN',
    '>=': 'GREATEREQUAL',
    '<=': 'LESSEQUAL',
    '<>': 'NOTEQUAL',
    '(.': 'LBRACK',
    '.)': 'RBRACK'
  };

  var is_reserved = function is_reserved(word) {
    return reserved[word];
  };
  var is_operator = function is_operator(word) {
    return operators[word];
  };
  var is_digit = function is_digit(ch) {
    return !isNaN(ch);
  };
  var is_id_start = function is_id_start(ch) {
    return (/[a-z]/i.test(ch)
    );
  };
  var is_id = function is_id(ch) {
    return (/[a-z0-9]/i.test(ch)
    );
  };
  var is_whitespace = function is_whitespace(ch) {
    return " \t\n".indexOf(ch) >= 0;
  };

  var read_while = function read_while(predicate) {
    var str = '';

    while (!input.eof() && predicate(input.peek())) {
      str += input.next();
    }

    return str;
  };

  var read_number = function read_number() {
    var has_dot = false;
    var number = read_while(function (ch) {
      if (ch === ".") {
        if (has_dot) {
          return false;
        } else {
          has_dot = true;

          return true;
        }
      }

      return is_digit(ch);
    });

    return {
      type: "NUMBER",
      value: parseFloat(number)
    };
  };

  var read_ident = function read_ident() {
    var id = read_while(is_id);

    return {
      type: is_reserved(id) ? reserved[id] : "ID", //indentifier to ID
      value: id
    };
  };

  var read_escaped = function read_escaped(end) {
    var escaped = false,
        str = "";

    input.next();

    while (!input.eof()) {
      var ch = input.next();

      if (escaped) {
        str += ch;
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === end) {
        break;
      } else {
        str += ch;
      }
    }

    return str;
  };

  var read_string = function read_string() {
    var string = read_escaped('"');
    return {
      type: string.length > 1 ? 'QOUTESTRING' : 'LITCHAR',
      value: string
    };
  };

  /**
   *  If end is left empty it will default to singal line comment.
   *  When end is set it will go until a match for end is found, or
   *  the end of the file is hit.
   *  Singal line //
   *  Multi line (* *)
   *  Multi Line { }
   */
  var skip_comment = function skip_comment(end) {
    if (end && end.length > 1) {
      read_while(function (ch) {
        if (ch !== end[0]) {
          return true;
        } else {
          input.next();

          if (input.peek() === end[1]) {
            input.next();
            return false;
          } else {
            return true;
          }
        }
      });
    } else {
      read_while(function (ch) {
        return ch !== (end || '\n');
      });
    }

    input.next();
  };

  //Change this
  var read_next = function read_next() {
    read_while(is_whitespace);

    if (input.eof()) {
      return {
        type: 'EOFSYM',
        value: null
      };
    }

    var ch = input.peek();

    // Singal Line Comment
    if (ch === '/') {
      input.next();
      var str = input.peek();

      if (str === '/') {
        skip_comment();
        return read_next();
      }

      input.croak('Can\'t handle character: ' + ch);

      return {
        type: 'ILLEGAL',
        value: ch
      };
    }

    // Multi Line Comment
    if (ch === '{') {
      skip_comment('}');
      return read_next();
    }

    if (ch === '"') {
      return read_string();
    }

    if (is_digit(ch)) {
      return read_number();
    }

    if (is_id_start(ch)) {
      return read_ident();
    }

    if (is_operator(ch)) {
      var _str = input.next();

      if (is_operator('' + _str + input.peek())) {
        _str += input.next();
      } else if (_str === '(' && input.peek() === '*') {
        // Multi Line Comment
        input.next();
        skip_comment('*)');
        return read_next();
      }

      return {
        type: operators[_str],
        value: _str
      };
    }

    input.croak('Can\'t handle character: ' + ch);

    return {
      type: 'ILLEGAL',
      value: input.next()
    };
  };

  var peek = function peek() {
    return current || (current = read_next());
  };

  var next = function next() {
    var tok = current;
    current = null;
    return tok || read_next();
  };

  var eof = function eof() {
    return peek() === null;
  };

  return {
    next: next,
    peek: peek,
    eof: eof,
    croak: input.croak
  };
};