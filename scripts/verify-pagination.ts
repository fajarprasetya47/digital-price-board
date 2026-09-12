import { buildPages } from "../src/components/display/paged-grid.js";

type Cat = { id: number; name: string; products: { id: number; name: string; price: number }[] };
const mk = (id: number, name: string, n: number, base = 0): Cat => ({
  id,
  name,
  products: Array.from({ length: n }, (_, i) => ({
    id: base + i + 1,
    name: `${name} ${i + 1}`,
    price: 1000,
  })),
});

let failures = 0;
function check(label: string, cond: boolean, extra = "") {
  console.log(`${cond ? "PASS" : "FAIL"} ${label}${extra}`);
  if (!cond) failures++;
}

// Invarian umum: semua produk tepat sekali, kapasitas kolom, blok valid
function verify(label: string, cats: Cat[], rows: number, cols: number) {
  const pages = buildPages(cats, rows, cols);
  const cap = Math.max(2, Math.floor(rows));
  const allIds = cats.flatMap((c) => c.products.map((p) => p.id));
  const gotIds = pages.flatMap((p) =>
    p.columns.flatMap((b) => b.flatMap((x) => x.products.map((pr) => pr.id)))
  );
  check(`${label}: jml halaman>0`, pages.length > 0, ` (${pages.length} pages)`);
  check(
    `${label}: tidak hilang/duplikat`,
    gotIds.length === allIds.length && new Set(gotIds).size === allIds.length,
    ` (want ${allIds.length}, got ${gotIds.length})`
  );
  const fits = pages.every((p) =>
    p.columns.every(
      (blocks) => blocks.reduce((s, b) => s + 1 + b.products.length, 0) <= cap
    )
  );
  check(`${label}: kapasitas kolom <= ${cap}`, fits);
  const nonEmpty = pages.every((p) =>
    p.columns.flatMap((b) => b).every((b) => b.products.length > 0)
  );
  check(`${label}: tiap blok >=1 produk`, nonEmpty);
  return pages;
}

// 1. Kategori besar 50 produk, 12 baris, 2 kolom
const p1 = verify("50 produk/12 baris/2 kolom", [mk(1, "Pakan Ayam", 50)], 12, 2);
check("header kategori diulang di tiap lanjutan", p1.every((pg) =>
  pg.columns.flatMap((b) => b).every((b) => b.categoryName === "Pakan Ayam")
));

// 2. Banyak kategori campur (besar + kecil), 10 baris, 2 kolom
verify("campur 30+5+1 produk", [mk(1, "A", 30, 0), mk(2, "B", 5, 100), mk(3, "C", 1, 200)], 10, 2);

// 3. Layar kecil 1 kolom
verify("50 produk/8 baris/1 kolom", [mk(1, "Pakan Ayam", 50)], 8, 1);

// 4. Semua muat satu halaman → static mode
const p4 = buildPages([mk(1, "A", 3), mk(2, "B", 4)], 20, 2);
check("muat 1 halaman → static", p4.length === 1, ` (${p4.length})`);

// 5. Kategori kosong dilewati
const p5 = buildPages([mk(1, "A", 2), { id: 2, name: "Kosong", products: [] }], 10, 1);
check("kategori kosong dilewati", p5.length === 1 && p5[0].columns[0].length === 1);

// 6. Urutan produk tetap (displayOrder) di semua halaman
const cats6 = [mk(1, "A", 25, 0), mk(2, "B", 25, 1000)];
const seq = buildPages(cats6, 12, 2).flatMap((p) =>
  p.columns.flatMap((b) => b.flatMap((x) => x.products.map((pr) => pr.id)))
);
const want = [...Array.from({ length: 25 }, (_, i) => i + 1), ...Array.from({ length: 25 }, (_, i) => 1001 + i)];
check("urutan produk lestari", JSON.stringify(seq) === JSON.stringify(want));

process.exit(failures ? 1 : 0);
