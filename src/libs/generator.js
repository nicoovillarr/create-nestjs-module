import { fileURLToPath } from "url";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, basename, relative } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templatesDir = join(__dirname, "../templates");

export function pascalCase(str) {
  return str
    .toLowerCase()
    .replace(/(^\w|-\w)/g, (c) => c.replace("-", "").toUpperCase());
}

export function camelCase(str) {
  return str.toLowerCase().replace(/-\w/g, (c) => c[1].toUpperCase());
}

export function kebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function snakeCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

export function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function applyReplacements(str, replacements) {
  let out = str;
  for (const [key, value] of Object.entries(replacements)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escapedKey, "g"), value);
  }
  return out;
}

export function processSection(
  sectionObj,
  targetDir,
  replacements = {},
  options = {}
) {
  const {
    addTsconfigPath = false,
    moduleDir = null,
    moduleKebab = null,
  } = options;

  const effectiveTargetDir =
    targetDir && basename(targetDir) === "root"
      ? dirname(targetDir)
      : targetDir;

  if (
    sectionObj === true &&
    effectiveTargetDir &&
    effectiveTargetDir.length > 0
  ) {
    ensureDir(effectiveTargetDir);
    return;
  }

  if (Array.isArray(sectionObj)) {
    ensureDir(effectiveTargetDir);

    for (const fileDef of sectionObj) {
      const filePath = join(effectiveTargetDir, fileDef.filename);
      let content = "";

      if (fileDef.template) {
        const templatePath = join(templatesDir, fileDef.template);

        if (existsSync(templatePath)) {
          const tpl = readFileSync(templatePath, "utf8");

          let baseDirReplacement =
            addTsconfigPath && moduleKebab
              ? `@/${moduleKebab}`
              : (function () {
                  if (!moduleDir) return ".";
                  const fileDir = dirname(filePath);
                  let rel = relative(fileDir, moduleDir);
                  if (!rel) return ".";

                  rel = rel.split("\\").join("/");
                  return rel;
                })();

          const localReplacements = {
            ...replacements,
            $BaseDir$: baseDirReplacement,
          };

          content = applyReplacements(tpl, localReplacements);
        } else {
          console.warn(
            `Template not found: ${fileDef.template} at ${templatePath}. Creating empty file.`
          );
        }
      }

      writeFileSync(filePath, content);
      console.log(`Created: ${filePath}`);
    }

    return;
  }

  if (typeof sectionObj === "object") {
    for (const [subDir, subObj] of Object.entries(sectionObj)) {
      const nextDir = subDir === "root" ? targetDir : join(targetDir, subDir);
      processSection(subObj, nextDir, replacements, options);
    }
  }
}

export function normalizeModuleName(name) {
  if (!name || typeof name !== "string") {
    throw new Error("Invalid module name");
  }

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Module name cannot be empty");

  const allowedCharacters = /^[A-Za-z][A-Za-z0-9-]*[A-Za-z0-9]$/;
  if (!allowedCharacters.test(trimmed)) {
    throw new Error(
      "Module name contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed."
    );
  }

  return trimmed.toLowerCase();
}

export function generateModule(opts) {
  const { moduleNameRaw: rawName, entityName, addTsconfigPath } = opts;

  const moduleNameRaw = normalizeModuleName(rawName);

  const moduleObj = {
    root: [
      {
        filename: `${kebabCase(moduleNameRaw)}.module.ts`,
        template: "module.template.ts",
      },
    ],
    application: [
      {
        filename: `${kebabCase(moduleNameRaw)}-api.service.ts`,
        template: "api-service.template.ts",
      },
    ],
    domain: {
      entities: [
        {
          filename: `${kebabCase(entityName)}.entity.ts`,
          template: "entity.template.ts",
        },
      ],
      repositories: [
        {
          filename: `${kebabCase(moduleNameRaw)}.repository.ts`,
          template: "repository.template.ts",
        },
      ],
      services: [
        {
          filename: `${kebabCase(moduleNameRaw)}.service.ts`,
          template: "service.template.ts",
        },
      ],
    },
    infrastructure: {
      cache: true,
      mappers: true,
      repositories: true,
      services: true,
    },
    presentation: {
      controllers: [
        {
          filename: `${kebabCase(moduleNameRaw)}.controller.ts`,
          template: "controller.template.ts",
        },
      ],
      dtos: true,
    },
    replacements: {
      $ModuleName$: pascalCase(moduleNameRaw),
      $ModuleNameKebab$: kebabCase(moduleNameRaw),
      $ModuleNameCamel$: camelCase(moduleNameRaw),
      $ModuleNameSnakeUpper$: snakeCase(moduleNameRaw).toUpperCase(),
      $EntityName$: pascalCase(entityName),
      $EntityNameKebab$: kebabCase(entityName),
    },
  };

  const isNest =
    existsSync("nest-cli.json") || existsSync(join("src", "main.ts"));

  if (!isNest) {
    throw new Error(
      "The current project does not appear to be a NestJS application."
    );
  }

  const srcDir = join("src");
  const possibleDirs = ["features", "modules"];

  let baseDir = null;

  for (const d of possibleDirs) {
    const full = join(srcDir, d);
    if (existsSync(full)) {
      baseDir = full;
      break;
    }
  }

  if (!baseDir) {
    throw new Error(
      "We could not find a 'features' or 'modules' directory in 'src'. Please create one of these directories to proceed."
    );
  }

  const moduleDir = join(baseDir, kebabCase(moduleNameRaw));
  ensureDir(moduleDir);

  console.log(`Creating module structure at: ${moduleDir}`);

  const moduleKebab = kebabCase(moduleNameRaw);
  const options = { addTsconfigPath, moduleDir, moduleKebab };

  processSection(
    moduleObj.application,
    join(moduleDir, "application"),
    moduleObj.replacements,
    options
  );
  processSection(
    moduleObj.domain,
    join(moduleDir, "domain"),
    moduleObj.replacements,
    options
  );
  processSection(
    moduleObj.infrastructure,
    join(moduleDir, "infrastructure"),
    moduleObj.replacements,
    options
  );
  processSection(
    moduleObj.presentation,
    join(moduleDir, "presentation"),
    moduleObj.replacements,
    options
  );
  processSection(moduleObj.root, moduleDir, moduleObj.replacements, options);

  return { baseDir, moduleDir, moduleKebab };
}
