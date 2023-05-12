export function randomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const color = `0x${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
  return parseInt(color, 16);
}
