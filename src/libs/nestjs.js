import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { dirname, join, relative } from "path";

function findAppModule(startDir = "src") {
  const stack = [startDir];

  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      continue;
    }

    for (const ent of entries) {
      const full = join(dir, ent.name);
      if (ent.isFile() && ent.name.toLowerCase() === "app.module.ts")
        return full;
      if (ent.isDirectory()) stack.push(full);
    }
  }

  return null;
}

function kebabToPascal(kebab) {
  return kebab
    .split("-")
    .map((s) => (s.length ? s[0].toUpperCase() + s.slice(1) : ""))
    .join("");
}

export function addModuleToAppModule({
  moduleKebab,
  moduleDir,
  addTsconfigPath = false,
}) {
  const appModulePath = findAppModule("src");
  if (!appModulePath) {
    console.warn(
      "Could not find app.module.ts to update. Skipping AppModule modification."
    );
    return;
  }

  let content = readFileSync(appModulePath, "utf8");

  const pascal = kebabToPascal(moduleKebab);
  const moduleClass = `${pascal}Module`;

  let importPath;
  if (addTsconfigPath) {
    importPath = `@/${moduleKebab}/${moduleKebab}.module`;
  } else {
    const rel = relative(
      dirname(appModulePath),
      join(moduleDir, `${moduleKebab}.module`)
    );
    importPath = rel.split("\\").join("/");
    if (!importPath.startsWith(".") && !importPath.startsWith("/"))
      importPath = `./${importPath}`;
  }

  const importLine = `import { ${moduleClass} } from '${importPath}';`;
  if (!content.includes(importLine)) {
    const lines = content.split(/\r?\n/);
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*import\s/.test(lines[i])) lastImport = i;
    }
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0, importLine);
    } else {
      lines.unshift(importLine);
    }
    content = lines.join("\n");
  }

  const moduleDecoratorIndex = content.indexOf("@Module(");
  if (moduleDecoratorIndex === -1) {
    console.warn(
      "No @Module decorator found in app.module.ts. Skipping adding module to imports."
    );
    writeFileSync(appModulePath, content);
    return;
  }

  const importsRegex = /imports\s*:\s*\[/g;
  importsRegex.lastIndex = moduleDecoratorIndex;
  const m = importsRegex.exec(content);
  if (m) {
    const arrStart = m.index + m[0].indexOf("[");

    let idx = arrStart + 1;
    let depth = 1;
    while (idx < content.length && depth > 0) {
      const ch = content[idx];
      if (ch === "[") depth++;
      else if (ch === "]") depth--;
      idx++;
    }
    const arrEnd = idx - 1;

    const before = content.slice(0, arrEnd).trimEnd();
    const after = content.slice(arrEnd);

    const insertWithComma = /\S$/.test(before) && !/\[\s*$/.test(before);
    const insertion = (insertWithComma ? ", " : "") + moduleClass;

    content = before + insertion + after;
  } else {
    const objStart = content.indexOf("@Module(");
    const parenStart = content.indexOf("(", objStart);
    const braceStart = content.indexOf("{", parenStart);
    if (braceStart === -1) {
      console.warn(
        "Could not locate @Module decorator object to inject imports."
      );
      writeFileSync(appModulePath, content);
      return;
    }

    const insertPos = braceStart + 1;
    const insertion = `\n  imports: [${moduleClass}],`;
    content =
      content.slice(0, insertPos) + insertion + content.slice(insertPos);
  }

  writeFileSync(appModulePath, content);
  console.log(`Updated ${appModulePath} to import and include ${moduleClass}`);
}
