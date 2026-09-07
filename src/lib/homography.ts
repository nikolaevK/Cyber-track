export type Pt = [number, number];
export type Quad = [Pt, Pt, Pt, Pt];

/**
 * Returns a CSS matrix3d() that maps a w×h box (origin top-left) onto the
 * destination quad (top-left, top-right, bottom-right, bottom-left).
 * Classic 4-point homography, solved with Gaussian elimination.
 */
export function matrix3dFor(w: number, h: number, dst: Quad): string {
  const src: Quad = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  const rows: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  const hm = solve(rows);
  const [a, b, c, d, e, f, g, hh] = hm;
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${hh},0,0,1,0,${c},${f},0,1)`;
}

function solve(m: number[][]): number[] {
  const n = 8;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    }
    [m[col], m[pivot]] = [m[pivot], m[col]];
    const p = m[col][col] || 1e-9;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const k = m[r][col] / p;
      for (let c = col; c <= n; c++) m[r][c] -= k * m[col][c];
    }
  }
  return m.map((row, i) => row[n] / (row[i] || 1e-9));
}
