program example(input, output);
var x,y:integer;
function gcd(a,b:integer):integer;
begin{gcd}
(* comment 1 *)
if b=0then gcd:=a else gcd:=(b,a mod b)
end;{gcd}
begin{example}
read(x,y);
write(gcd(x,y))
end
