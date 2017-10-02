export const tokenizer = input => {
  let current = null;
  const reserved = {
    'and'       : 'AMD',
    'array'     : 'ARRAY',
    'begin'     : 'BEGIN',
    'char'      : 'CHAR',
    'chr'       : 'CHR',
    'div'       : 'DIV',
    'do'        : 'DO',
    'else'      : 'ELSE',
    'end'       : 'END',
    'if'        : 'IF',
    'integer'   : 'INTEGER',
    'mod'       : 'MOD',
    'not'       : 'NOT',
    'of'        : 'OF',
    'or'        : 'OR',
    'ord'       : 'ORD',
    'procedure' : 'PROCEDURE',
    'program'   : 'PROGRAM',
    'read'      : 'READ',
    'readIn'    : 'READIN',
    'then'      : 'THEN',
    'var'       : 'VAR',
    'while'     : 'WHILE',
    'write'     : 'WRITE',
    'writeIn'   : 'WRITEIN',
    'function'  : 'FUNCTION', //Add by me
  };

  const operators = {
    '+' : 'PLUS',
    '-' : 'MINUS',
    '*' : 'TIMES',
    '<' : 'LESS',
    '>' : 'GREATER',
    '=' : 'EQUAL',
    ':' : 'COLON',
    ';' : 'SEMICOLON',
    ',' : 'COMMA',
    '(' : 'LPAREN',
    ')' : 'RPAREN',
    '.' : 'PERIOD',
    ':=' : 'ASSIGN',
    '>=' : 'GREATEREQUAL',
    '<=' : 'LESSEQUAL',
    '<>' : 'NOTEQUAL',
    '(.' : 'LBRACK',
    '.)' : 'RBRACK',
  };

  const is_reserved = word => reserved[word]
  const is_operator = word => operators[word];
  const is_digit = ch => !isNaN(ch);
  const is_id_start = ch => /[a-z]/i.test(ch);
  const is_id = ch => /[a-z0-9]/i.test(ch)
  const is_whitespace = ch => " \t\n".indexOf(ch) >= 0;

  const read_while = predicate => {
    let str = '';

    while (!input.eof() && predicate(input.peek())) {
      str += input.next();
    }

    return str;
  }

  const read_number = () => {
      let has_dot   = false;
      const number  = read_while(ch => {
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
  }

  const read_ident = () => {
    const id = read_while(is_id);

    return {
      type  : is_reserved(id) ? reserved[id] : "ID", //indentifier to ID
      value : id
    };
}

  const read_escaped = end => {
      let escaped = false,
          str     = "";

      input.next();

      while (!input.eof()) {
          const ch = input.next();

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
  }

  const read_string = () => {
      const string = read_escaped('"');
      return {
        type: string.length > 1 ? 'QOUTESTRING' : 'LITCHAR',
        value: string
      };
  }

  /**
   *  If end is left empty it will default to singal line comment.
   *  When end is set it will go until a match for end is found, or
   *  the end of the file is hit.
   *  Singal line //
   *  Multi line (* *)
   *  Multi Line { }
   */
  const skip_comment = (end) => {
    if (end && end.length > 1) {
      read_while(ch => {
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
      read_while(ch => ch !== (end || '\n'));
    }

    input.next();
  }

  //Change this
  const read_next = () => {
      read_while(is_whitespace);

      if (input.eof()) {
        return {
          type: 'EOFSYM',
          value: null
        };
      }

      const ch = input.peek();

      // Singal Line Comment
      if (ch === '/') {
        input.next();
        let str = input.peek();

        if (str === '/') {
          skip_comment();
          return read_next();
        }

        input.croak(`Can't handle character: ${ch}`);

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
        let str = input.next();

        if (is_operator(`${str}${input.peek()}`)) {
          str += input.next();
        } else if (str === '(' && input.peek() === '*') { // Multi Line Comment
          input.next();
          skip_comment('*)');
          return read_next();
        }

        return {
          type  : operators[str],
          value : str
        };
      }

      input.croak(`Can't handle character: ${ch}`);

      return {
        type: 'ILLEGAL',
        value: input.next()
      };
  }

  const peek = () => current || (current = read_next());

  const next = () => {
      const tok = current;
      current = null;
      return tok || read_next();
  }

  const eof = () => peek() === null;

  return {
    next,
    peek,
    eof,
    croak: input.croak,
  };
}
