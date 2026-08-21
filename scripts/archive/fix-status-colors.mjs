import fs from "fs";
import path from "path";
function walk(d, acc = []) {
  for (const n of fs.readdirSync(d)) {
    const p = path.join(d, n);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}
let c = 0;
for (const f of walk("src/components")) {
  let s = fs.readFileSync(f, "utf8");
  const o = s;
  s = s.split("text-emerald-400").join("text-emerald-600");
  s = s.split("text-rose-400").join("text-rose-600");
  s = s.split("text-sky-400").join("text-sky-600");
  if (s !== o) {
    fs.writeFileSync(f, s);
    c++;
    console.log(f);
  }
}
console.log("files", c);
