import { Command } from "commander";

export function parseArgs(argv) {
  const program = new Command();

  program
    .name("create-module")
    .description("Generate a NestJS module scaffold")
    .argument("<module-name>")
    .option("-e, --entity <name>", "Entity name (defaults to module name)")
    .option(
      "--add-tsconfig-path",
      "Add a path mapping for the created module into tsconfig (optional)"
    )
    .allowUnknownOption(false)
    .exitOverride();

  try {
    program.parse(argv);
  } catch (err) {
    throw err;
  }

  const opts = program.opts();
  const moduleNameRaw = program.args[0];

  if (!moduleNameRaw) {
    throw new Error("Module name is required");
  }

  return {
    moduleNameRaw,
    entityName: opts.entity || moduleNameRaw,
    addTsconfigPath: !!opts.addTsconfigPath,
  };
}
