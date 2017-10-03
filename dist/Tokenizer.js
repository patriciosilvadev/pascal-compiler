'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var tokenizer = exports.tokenizer = function tokenizer(input) {
  var current = null;
  var reserved = {
    'and': 'andsym',
    'array': 'arraysym',
    'asm': 'asmsym',
    'begin': 'beginsym',
    'break': 'breaksym',
    'case': 'casesym',
    'const': 'constsym',
    'constructor': 'constructorsym',
    'continue': 'continuesym',
    'char': 'charsym',
    'chr': 'chrsym',
    'destructor': 'destructorsym',
    'div': 'divsym',
    'do': 'dosym',
    'downto': 'downtosym',
    'else': 'elsesym',
    'end': 'endsym',
    'false': 'falsesym',
    'file': 'filesym',
    'for': 'forsym',
    'function': 'functionsym',
    'goto': 'gotosym',
    'if': 'ifsym',
    'implementation': 'implementationsym',
    'in': 'insym',
    'inline': 'inlinesym',
    'interface': 'interfacesym',
    'integer': 'integersym',
    'label': 'labelsym',
    'mod': 'modsym',
    'nil': 'nilsym',
    'not': 'notsym',
    'object': 'objectsym',
    'of': 'ofsym',
    'on': 'onsym',
    'operator': 'operatorsym',
    'or': 'orsym',
    'ord': 'ordsym',
    'packed': 'packedsym',
    'procedure': 'proceduresym',
    'program': 'programsym',
    'record': 'recordsym',
    'repeat': 'repeatsym',
    'read': 'readsym',
    'readIn': 'readinsym',
    'set': 'setsym',
    'shl': 'shlsym',
    'shr': 'shrsym',
    'string': 'stryingsym',
    'then': 'thensym',
    'to': 'tosym',
    'true': 'truesym',
    'type': 'typesym',
    'unit': 'unitsym',
    'until': 'untilsym',
    'uses': 'usessym',
    'var': 'varsym',
    'while': 'whilesym',
    'write': 'writesym',
    'with': 'withsym',
    'writeIn': 'writeinsym',
    'xor': 'xorsym'
  };

  var operators = {
    '+': 'plus',
    '-': 'minus',
    '*': 'times',
    '<': 'less',
    '>': 'greater',
    '=': 'equal',
    ':': 'colon',
    ';': 'semocolon',
    ',': 'comma',
    '(': 'lparen',
    ')': 'rparen',
    '.': 'period',
    ':=': 'assign',
    '>=': 'greaterequal',
    '<=': 'lessequal',
    '<>': 'notequal',
    '[': 'lbrack',
    ']': 'rbrack'
  };

  var is_reserved = function is_reserved(word) {
    return reserved[word.toLowerCase()];
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
  var is_bad = function is_bad(ch) {
    return "!@#$%^&-|?".indexOf(ch) >= 0;
  };

  var read_while = function read_while(predicate) {
    var str = '';

    while (!input.eof() && predicate(input.peek())) {
      str += input.next();
    }

    return str;
  };

  var read_number = function read_number() {
    var has_dot = 0;
    var number = read_while(function (ch) {
      if (ch === ".") {
        if (has_dot > 1) {
          return false;
        } else {
          has_dot++;

          return true;
        }
      }

      return is_digit(ch);
    });

    if (number.indexOf('..') !== -1) {
      return {
        type: "range",
        value: number
      };
    }

    if (!is_whitespace(number[number.length - 1]) && !is_operator(input.peek()) && input.peek() !== ' ' && input.peek() !== ';') {
      return illegal(number + read_while(function (ch) {
        return !is_whitespace(ch) && ch === ';';
      }));
    }

    return {
      type: "number",
      value: number
    };
  };

  var read_ident = function read_ident() {
    var id = read_while(is_id);

    if (input.peek() !== ' ' && is_bad(input.peek())) {
      return illegal(id + read_while(function (ch) {
        return !is_whitespace(ch);
      }));
    }

    return {
      type: is_reserved(id) ? reserved[id.toLowerCase()] : "indentifier",
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

  var read_string = function read_string(quoteType) {
    var string = read_escaped(quoteType);
    return {
      type: string.length > 1 ? 'quotestring' : 'litchar',
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
            return false;
          }

          input.next();
          if (input.peek() === end[1]) {
            return false;
          }

          return true;
        }
      });
    } else {
      read_while(function (ch) {
        return ch !== (end || '\n');
      });
    }

    input.next();
  };

  var illegal = function illegal(ch) {
    return {
      type: 'illegal',
      value: ch
    };
  };

  //Change this
  var read_next = function read_next() {
    read_while(is_whitespace);

    if (input.eof()) {
      return {
        type: 'eofsym',
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

      return illegal(ch);
    }

    // Multi Line Comment
    if (ch === '{') {
      skip_comment('}');
      return read_next();
    }

    // String
    if (ch === '\'') {
      return read_string('\'');
    }

    // Other String
    if (ch === '"') {
      return read_string('"');
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

    return illegal(input.next());
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