import { existsSync, readFileSync, writeFileSync } from "fs";
import { basename } from "path";

export function updateTsconfigPaths(baseDirPath, moduleKebab) {
  const tsconfigCandidates = ["tsconfig.json", "tsconfig.base.json"];
  let tsPath = null;

  for (const c of tsconfigCandidates) {
    if (existsSync(c)) {
      tsPath = c;
      break;
    }
  }

  if (!tsPath) {
    console.warn("No tsconfig file found (tsconfig.json or tsconfig.base.json). Skipping tsconfig update.");
    return;
  }

  try {
    const raw = readFileSync(tsPath, "utf8");
    const cfg = JSON.parse(raw);
    cfg.compilerOptions = cfg.compilerOptions || {};
    cfg.compilerOptions.paths = cfg.compilerOptions.paths || {};

    const aliasPrefix = basename(baseDirPath); // 'modules' or 'features'
    const key = `@/${moduleKebab}/*`;
    const value = [`./src/${aliasPrefix}/${moduleKebab}/*`];

    if (cfg.compilerOptions.paths[key]) {
      console.log(`tsconfig already contains path mapping for ${key}, skipping.`);
      return;
    }

    cfg.compilerOptions.paths[key] = value;

    writeFileSync(tsPath, JSON.stringify(cfg, null, 2));
    console.log(`Updated ${tsPath} with path mapping ${key} -> ${value[0]}`);
  } catch (err) {
    console.warn(`Failed to update tsconfig (${err.message}).`);
  }
}
