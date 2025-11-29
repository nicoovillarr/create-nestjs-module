#!/usr/bin/env node

import { parseArgs } from "./libs/cli.js";
import { generateModule } from "./libs/generator.js";
import { updateTsconfigPaths } from "./libs/tsconfig.js";
import { addModuleToAppModule } from "./libs/nestjs.js";

async function main(argv) {
  try {
    const { moduleNameRaw, entityName, addTsconfigPath } = parseArgs(argv);

    const { baseDir, moduleDir, moduleKebab } = generateModule({
      moduleNameRaw,
      entityName,
      addTsconfigPath,
    });

    if (addTsconfigPath) {
      updateTsconfigPaths(baseDir, moduleKebab);
    }

    addModuleToAppModule({ moduleKebab, moduleDir, addTsconfigPath });

    console.log("\n✔ Module generated successfully!");
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

main(process.argv);
