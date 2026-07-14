#!/usr/bin/env node
// Interactive scaffolder for Landing CMS blocks.
// Usage: npm run block:new [slug]
//
// Generates:
//   lib/blocks/{slug}/{Pascal}.tsx     — render component
//   updates lib/blocks/types.ts        — union / meta / defaultBlock
//   updates lib/blocks/registry.tsx    — switch case
//   updates app/admin/pages/[id]/BlockFields.tsx — form component
//
// Follows CANONICAL_FIELDS from lib/blocks/field-schema.ts.

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

const ROOT = process.cwd();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function loadSchema() {
  // We can't import the .ts file directly from node without compiling.
  // Instead, parse CANONICAL_FIELDS out of it via regex — good enough for a scaffolder.
  const src = await readFile(path.join(ROOT, "lib/blocks/field-schema.ts"), "utf8");
  const match = src.match(/CANONICAL_FIELDS[^{]*\{([\s\S]*?)\n\};/);
  if (!match) throw new Error("field-schema.ts parse failed");
  const body = match[1];
  const fields = {};
  const blocks = body.split(/,\n\s*(?=\w+:\s*\{)/);
  for (const b of blocks) {
    const km = b.match(/^\s*(\w+):\s*\{/);
    if (!km) continue;
    const key = km[1];
    const kindMatch = b.match(/kind:\s*"(\w+)"/);
    const labelMatch = b.match(/label:\s*"([^"]+)"/);
    const optionalMatch = b.match(/optional:\s*(true|false)/);
    const defaultMatch = b.match(/default:\s*("[^"]*"|\d+|true|false|\[\])/);
    fields[key] = {
      key,
      kind: kindMatch ? kindMatch[1] : "text",
      label: labelMatch ? labelMatch[1] : key,
      optional: optionalMatch ? optionalMatch[1] === "true" : false,
      default: defaultMatch ? defaultMatch[1] : null
    };
  }
  return fields;
}

function pascalCase(s) {
  return s
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function tsTypeForField(f) {
  switch (f.kind) {
    case "bullets":
      return "string[]";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "string";
  }
}

function fieldDefaultLiteral(f) {
  if (f.default === null || f.default === undefined) return null;
  if (f.default === "[]") return "[]";
  if (f.default === "true" || f.default === "false") return f.default;
  if (/^-?\d+$/.test(f.default)) return f.default;
  return f.default; // already a quoted string like "#2badd7"
}

async function updateTypes(slug, name, description, selected) {
  const p = path.join(ROOT, "lib/blocks/types.ts");
  let src = await readFile(p, "utf8");
  const Pascal = pascalCase(slug);

  // 1) Insert new block type interface before BlockType union
  const iface = `
export type ${Pascal}Block = BlockBase & {
  type: "${slug}";
${selected
  .map((f) => {
    const t = tsTypeForField(f);
    return `  ${f.key}${f.optional ? "?" : ""}: ${t};`;
  })
  .join("\n")}
};
`;
  src = src.replace(
    /(export type BlockType = )/,
    `${iface}\n$1`
  );

  // 2) Extend BlockType union
  src = src.replace(
    /(export type BlockType = [^;]+);/,
    (m, g1) => `${g1} | ${Pascal}Block;`
  );

  // 3) Add BLOCK_TYPE_META entry
  src = src.replace(
    /(export const BLOCK_TYPE_META[^{]*\{[\s\S]*?)(};)/,
    (m, head, tail) => {
      // Insert before the closing }
      const line = `  ${slug}: { name: "${name}", description: "${description}" },\n`;
      // remove trailing comma if any inconsistency
      const trimmed = head.replace(/,?\s*$/, ",\n");
      return `${trimmed}${line}${tail}`;
    }
  );

  // 4) Add defaultBlock case
  const defaults = selected
    .map((f) => {
      const v = fieldDefaultLiteral(f);
      if (v === null) return f.optional ? null : `        ${f.key}: ""`;
      if (f.kind === "bullets") return `        ${f.key}: []`;
      return `        ${f.key}: ${v}`;
    })
    .filter(Boolean)
    .join(",\n");
  const caseBlock = `    case "${slug}":
      return {
        ...base,
        type: "${slug}",
${defaults}
      };
`;
  src = src.replace(
    /(  switch \(type\) \{)/,
    `$1\n${caseBlock}`
  );

  await writeFile(p, src, "utf8");
}

async function writeRenderComponent(slug, selected) {
  const Pascal = pascalCase(slug);
  const dir = path.join(ROOT, `lib/blocks/${slug}`);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${Pascal}.tsx`);
  try {
    await access(file);
    console.log(`  skip render component (already exists): ${file}`);
    return;
  } catch {
    // continue
  }

  const propFields = selected
    .map(
      (f) =>
        `      {/* field: ${f.key} (${f.kind}) — implement rendering per Figma spec */}`
    )
    .join("\n");
  const content = `import type { ${Pascal}Block } from "../types";

// TODO: implement pixel spec from Figma.
// Follow /new-block procedure — do not estimate values.
export function ${Pascal}({ block }: { block: ${Pascal}Block }) {
  return (
    <section
      data-block-type="${slug}"
      className="w-full"
      style={{ backgroundColor: block.bg ?? "#ffffff" }}
    >
${propFields}
      <div className="p-[80px] text-center text-[36px] text-black/40">
        (${slug} 블록 — 렌더 미구현)
      </div>
    </section>
  );
}
`;
  await writeFile(file, content, "utf8");
}

async function updateRegistry(slug) {
  const Pascal = pascalCase(slug);
  const p = path.join(ROOT, "lib/blocks/registry.tsx");
  let src = await readFile(p, "utf8");
  // Add import
  if (!src.includes(`from "./${slug}/${Pascal}"`)) {
    src = src.replace(
      /(import \{ Cta \} from "\.\/cta\/Cta";)/,
      `$1\nimport { ${Pascal} } from "./${slug}/${Pascal}";`
    );
  }
  // Add switch case
  if (!src.includes(`case "${slug}":`)) {
    src = src.replace(
      /(    case "cta":\s*\n\s*return <Cta block=\{block\} \/>;)/,
      `$1\n    case "${slug}":\n      return <${Pascal} block={block} />;`
    );
  }
  await writeFile(p, src, "utf8");
}

async function updateBlockFields(slug, selected) {
  const Pascal = pascalCase(slug);
  const p = path.join(ROOT, "app/admin/pages/[id]/BlockFields.tsx");
  let src = await readFile(p, "utf8");

  // Add import for the block type
  if (!src.includes(`${Pascal}Block,`) && !src.includes(`${Pascal}Block\n`)) {
    src = src.replace(
      /(import type \{\s*\n\s*BlockType,\s*)/,
      `$1\n  ${Pascal}Block,`
    );
  }

  // Add switch case
  if (!src.includes(`case "${slug}":`)) {
    src = src.replace(
      /(    case "cta":\s*\n\s*return <CtaFields block=\{block\} onChange=\{onChange\} \/>;)/,
      `$1\n    case "${slug}":\n      return <${Pascal}Fields block={block} onChange={onChange} />;`
    );
  }

  // Append the field component at the end
  if (!src.includes(`function ${Pascal}Fields(`)) {
    const rows = selected
      .map((f) => {
        switch (f.kind) {
          case "color":
            return `      <Row label="${f.label}">
        <input
          type="color"
          className="h-9 w-full rounded border"
          value={block.${f.key} ?? ${f.default ?? '"#ffffff"'}}
          onChange={(e) => patch({ ${f.key}: e.target.value })}
        />
      </Row>`;
          case "asset":
            return `      <ImageField
        label="${f.label}"
        value={block.${f.key}}
        onChange={(url) => patch({ ${f.key}: url })}
      />`;
          case "textarea":
            return `      <Row label="${f.label}">
        <textarea
          className={inputCls}
          rows={3}
          value={block.${f.key} ?? ""}
          onChange={(e) => patch({ ${f.key}: e.target.value })}
        />
      </Row>`;
          case "select":
            return `      <Row label="${f.label}">
        <select
          className={inputCls}
          value={block.${f.key} ?? ${f.default ?? '""'}}
          onChange={(e) => patch({ ${f.key}: e.target.value as ${Pascal}Block["${f.key}"] })}
        >
          {/* TODO: options from field-schema */}
        </select>
      </Row>`;
          case "bullets":
            return `      <Row label="${f.label}">
        <textarea
          className={inputCls}
          rows={5}
          value={(block.${f.key} ?? []).join("\\n")}
          onChange={(e) =>
            patch({ ${f.key}: e.target.value.split("\\n").filter((v) => v.length > 0) })
          }
        />
      </Row>`;
          case "url":
          case "text":
          default:
            return `      <Row label="${f.label}">
        <input
          className={inputCls}
          value={block.${f.key} ?? ""}
          onChange={(e) => patch({ ${f.key}: e.target.value })}
        />
      </Row>`;
        }
      })
      .join("\n");

    src += `\nfunction ${Pascal}Fields({
  block,
  onChange
}: {
  block: ${Pascal}Block;
  onChange: (next: ${Pascal}Block) => void;
}) {
  const patch = (p: Partial<${Pascal}Block>) => onChange({ ...block, ...p });
  return (
    <div>
${rows}
    </div>
  );
}\n`;
  }

  await writeFile(p, src, "utf8");
}

async function main() {
  const argSlug = process.argv[2];
  const schema = await loadSchema();
  const keys = Object.keys(schema);

  const slug = (argSlug || (await ask("블록 슬러그 (snake_case): "))).trim();
  if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
    console.error("잘못된 슬러그 형식. snake_case 소문자 + 숫자 + 밑줄만 가능.");
    process.exit(1);
  }
  const name = (await ask("한글 이름: ")).trim();
  const description = (await ask("한 줄 설명: ")).trim();

  console.log("\n캐노니컬 필드 목록:");
  keys.forEach((k, i) => {
    const f = schema[k];
    console.log(`  ${String(i + 1).padStart(2, " ")}. ${k.padEnd(12)} · ${f.kind.padEnd(10)} · ${f.label}`);
  });
  const picks = (await ask("\n포함할 필드 번호를 쉼표로 (예: 1,3,5): "))
    .split(",")
    .map((s) => Number(s.trim()) - 1)
    .filter((n) => Number.isInteger(n) && n >= 0 && n < keys.length);
  const selected = picks.map((i) => schema[keys[i]]);
  if (selected.length === 0) {
    console.error("필드가 선택되지 않았습니다.");
    process.exit(1);
  }

  console.log(`\n→ 파일 4개 수정: lib/blocks/${slug}/${pascalCase(slug)}.tsx (신규), types.ts, registry.tsx, BlockFields.tsx`);
  const ok = (await ask("진행할까요? [y/N]: ")).trim().toLowerCase();
  if (ok !== "y" && ok !== "yes") {
    console.log("취소됨.");
    process.exit(0);
  }

  await writeRenderComponent(slug, selected);
  await updateTypes(slug, name, description, selected);
  await updateRegistry(slug);
  await updateBlockFields(slug, selected);

  console.log("\n✓ 뼈대 생성 완료.");
  console.log("다음 단계:");
  console.log(`  1. lib/blocks/${slug}/${pascalCase(slug)}.tsx 에 Figma 픽셀 스펙 반영`);
  console.log(`  2. npx tsc --noEmit — 에러 0 확인`);
  console.log(`  3. dev 서버에서 새 블록 추가·프리뷰 확인`);
  console.log(`  4. /new-block 슬래시 커맨드로 클로드에게 스펙 이식 요청 가능`);
  rl.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
