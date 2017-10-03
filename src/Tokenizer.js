export const tokenizer = input => {
  let current = null;
  const reserved = {
    'and'             : 'andsym',
    'array'           : 'arraysym',
    'asm'             : 'asmsym',
    'begin'           : 'beginsym',
    'break'           : 'breaksym',
    'case'            : 'casesym',
    'const'           : 'constsym',
    'constructor'     : 'constructorsym',
    'continue'        : 'continuesym',
    'char'            : 'charsym',
    'chr'             : 'chrsym',
    'destructor'      : 'destructorsym',
    'div'             : 'divsym',
    'do'              : 'dosym',
    'downto'          : 'downtosym',
    'else'            : 'elsesym',
    'end'             : 'endsym',
    'false'           : 'falsesym',
    'file'            : 'filesym',
    'for'             : 'forsym',
    'function'        : 'functionsym',
    'goto'            : 'gotosym',
    'if'              : 'ifsym',
    'implementation'  : 'implementationsym',
    'in'              : 'insym',
    'inline'          : 'inlinesym',
    'interface'       : 'interfacesym',
    'integer'         : 'integersym',
    'label'           : 'labelsym',
    'mod'             : 'modsym',
    'nil'             : 'nilsym',
    'not'             : 'notsym',
    'object'          : 'objectsym',
    'of'              : 'ofsym',
    'on'              : 'onsym',
    'operator'        : 'operatorsym',
    'or'              : 'orsym',
    'ord'             : 'ordsym',
    'packed'          : 'packedsym',
    'procedure'       : 'proceduresym',
    'program'         : 'programsym',
    'record'          : 'recordsym',
    'repeat'          : 'repeatsym',
    'read'            : 'readsym',
    'readIn'          : 'readinsym',
    'set'             : 'setsym',
    'shl'             : 'shlsym',
    'shr'             : 'shrsym',
    'string'          : 'stryingsym',
    'then'            : 'thensym',
    'to'              : 'tosym',
    'true'            : 'truesym',
    'type'            : 'typesym',
    'unit'            : 'unitsym',
    'until'           : 'untilsym',
    'uses'            : 'usessym',
    'var'             : 'varsym',
    'while'           : 'whilesym',
    'write'           : 'writesym',
    'with'            : 'withsym',
    'writeIn'         : 'writeinsym',
    'xor'             : 'xorsym',
  };

  const operators = {
    '+'  : 'plus',
    '-'  : 'minus',
    '*'  : 'times',
    '<'  : 'less',
    '>'  : 'greater',
    '='  : 'equal',
    ':'  : 'colon',
    ';'  : 'semocolon',
    ','  : 'comma',
    '('  : 'lparen',
    ')'  : 'rparen',
    '.'  : 'period',
    ':=' : 'assign',
    '>=' : 'greaterequal',
    '<=' : 'lessequal',
    '<>' : 'notequal',
    '[' : 'lbrack',
    ']' : 'rbrack',
  };

  const is_reserved = word => reserved[word.toLowerCase()]
  const is_operator = word => operators[word];
  const is_digit = ch => !isNaN(ch);
  const is_id_start = ch => /[a-z]/i.test(ch);
  const is_id = ch => /[a-z0-9]/i.test(ch)
  const is_whitespace = ch => " \t\n".indexOf(ch) >= 0;
  const is_bad = ch => "!@#$%^&-|?".indexOf(ch) >= 0;

  const read_while = predicate => {
    let str = '';

    while (!input.eof() && predicate(input.peek())) {
      str += input.next();
    }

    return str;
  }

  const read_number = () => {
      let has_dot   = 0;
      const number  = read_while(ch => {
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
        return illegal(number + read_while(ch => !is_whitespace(ch) && ch === ';'));
      }

      return {
        type: "number",
        value: number
      };
  }

  const read_ident = () => {
    const id = read_while(is_id);

    if (input.peek() !== ' ' && is_bad(input.peek())) {
      return illegal(id + read_while(ch => !is_whitespace(ch)));
    }

    return {
      type  : is_reserved(id) ? reserved[id.toLowerCase()] : "indentifier",
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

  const read_string = (quoteType) => {
      const string = read_escaped(quoteType);
      return {
        type: string.length > 1 ? 'quotestring' : 'litchar',
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
  const skip_comment = end => {
    if (end && end.length > 1) {
      read_while(ch => {
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
      read_while(ch => ch !== (end || '\n'));
    }

    input.next();
  }

  const illegal = ch => {
    return {
      type: 'illegal',
      value: ch
    };
  }

  //Change this
  const read_next = () => {
      read_while(is_whitespace);

      if (input.eof()) {
        return {
          type: 'eofsym',
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

      return illegal(input.next());
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
