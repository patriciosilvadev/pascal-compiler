export const reader = input => {
  let pos   = 0,
      line  = 1,
      col   = 0;

  const next = () => {
    const ch = input.charAt(pos++);

    if (ch === '\n') {
      line++;
      col = 0;
    } else {
      col++;
    }

    return ch;
  }

  const peek = () => input.charAt(pos);

  const eof = () => peek() !== 0 && peek() === '';

  const croak = msg => {
    console.log(`${msg} (${line}:${col})`);
  }

  return {
    next,
    peek,
    eof,
    croak,
  }
}
