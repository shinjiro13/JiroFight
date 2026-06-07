const fs = require('fs');
const zlib = require('zlib');
const path = 'pebbles character/pebbles_right.png';
const buf = fs.readFileSync(path);
if (buf.toString('ascii', 0, 8) !== '\x89PNG\r\n\x1a\n') {
  console.error('NOT PNG');
  process.exit(1);
}
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
let pos = 8;
const idat = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  const data = buf.slice(pos + 8, pos + 8 + len);
  if (type === 'IDAT') idat.push(data);
  if (type === 'IEND') break;
  pos += 12 + len;
}
const infl = zlib.inflateSync(Buffer.concat(idat));
const bpp = 4;
const rowSize = width * bpp;
const rgba = Buffer.alloc(width * height * 4);
let outIdx = 0;
let p = 0;
for (let y = 0; y < height; y++) {
  const filter = infl[p++];
  const row = infl.slice(p, p + rowSize);
  p += rowSize;
  const unfiltered = Buffer.alloc(rowSize);
  for (let x = 0; x < rowSize; x++) {
    const left = x >= bpp ? unfiltered[x - bpp] : 0;
    const up = y > 0 ? rgba[(y - 1) * rowSize + x] : 0;
    const upleft = x >= bpp && y > 0 ? rgba[(y - 1) * rowSize + x - bpp] : 0;
    const val = row[x];
    if (filter === 0) unfiltered[x] = val;
    else if (filter === 1) unfiltered[x] = (val + left) & 0xff;
    else if (filter === 2) unfiltered[x] = (val + up) & 0xff;
    else if (filter === 3) unfiltered[x] = (val + Math.floor((left + up) / 2)) & 0xff;
    else {
      const pa = x >= bpp ? unfiltered[x - bpp] : 0;
      const pb = y > 0 ? up : 0;
      const pc = x >= bpp && y > 0 ? upleft : 0;
      const pval = (pa + pb - pc + 256) & 0xff;
      const pa1 = Math.abs(pa - pc);
      const pb1 = Math.abs(pb - pc);
      const pc1 = Math.abs(pc - pval);
      const pr = pa1 <= pb1 && pa1 <= pc1 ? pa : pb1 <= pc1 ? pb : pc;
      unfiltered[x] = (val + pr) & 0xff;
    }
  }
  for (let x = 0; x < rowSize; x++) {
    rgba[outIdx++] = unfiltered[x];
  }
}
const frame = 9;
const frameX = frame * 64;
let alphaSum = 0;
let visible = false;
for (let y = 0; y < height; y++) {
  for (let x = frameX; x < frameX + 64; x++) {
    const idx = y * rowSize + x * 4;
    const a = rgba[idx + 3];
    alphaSum += a;
    if (a > 16) visible = true;
  }
}
console.log('WIDTH', width, 'HEIGHT', height, 'FRAME', frame, 'ALPHASUM', alphaSum, 'VISIBLE', visible);
