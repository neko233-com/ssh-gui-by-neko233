import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const platform = process.platform;
const arch = process.arch;
const extension = platform === "win32" ? ".exe" : "";
const output = `dist/ssh-gui-by-neko233-${platform}-${arch}${extension}`;

mkdirSync("dist", { recursive: true });

const result = spawnSync(
    process.execPath,
    ["node_modules/@perryts/perry/bin/perry.js", "compile", "src/main.ts", "-o", output],
    { stdio: "inherit" },
);

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}

console.log(`Built ${output}`);
