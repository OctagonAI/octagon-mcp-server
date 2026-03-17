import { readFile, writeFile } from "fs/promises";

const packageJsonRaw = await readFile(new URL("../package.json", import.meta.url));
const packageJson = JSON.parse(packageJsonRaw.toString("utf8"));

if (!packageJson.version || typeof packageJson.version !== "string") {
  throw new Error("package.json version is missing or invalid");
}

const versionFileContent = `export const VERSION = "${packageJson.version}";
`;

await writeFile(
  new URL("../src/version.ts", import.meta.url),
  versionFileContent,
  "utf8",
);
