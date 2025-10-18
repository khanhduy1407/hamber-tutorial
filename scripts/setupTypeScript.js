// @ts-check

/** This script modifies the project to support TS code in .hamber files like:

  <script lang="ts">
  	export let name: string;
  </script>
 
  As well as validating the code for CI.
  */

/**  To work on this script:
  rm -rf test-template template && git clone hamberjs/template test-template && node scripts/setupTypeScript.js test-template
*/

import fs from "fs"
import path from "path"
import { argv } from "process"
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const projectRoot = argv[2] || path.join(__dirname, "..")

// Add deps to pkg.json
const packageJSON = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"))
packageJSON.devDependencies = Object.assign(packageJSON.devDependencies, {
  "@rollup/plugin-typescript": "^11.0.0",
  "hamber-check": "^2.9.2",
  "hamber-preprocess": "^4.10.1",
  "tsconfig-hamber": "^3.0.0",
  "tslib": "^2.5.0",
  "typescript": "^4.9.0"
})

// Add script for checking
packageJSON.scripts = Object.assign(packageJSON.scripts, {
  "check": "hamber-check"
})

// Write the package JSON
fs.writeFileSync(path.join(projectRoot, "package.json"), JSON.stringify(packageJSON, null, "  "))

// mv src/main.js to main.ts - note, we need to edit rollup.config.js for this too
const beforeMainJSPath = path.join(projectRoot, "src", "main.js")
const afterMainTSPath = path.join(projectRoot, "src", "main.ts")
fs.renameSync(beforeMainJSPath, afterMainTSPath)

// Switch the app.hamber file to use TS
const appHamberPath = path.join(projectRoot, "src", "App.hamber")
let appFile = fs.readFileSync(appHamberPath, "utf8")
appFile = appFile.replace("<script>", '<script lang="ts">')
appFile = appFile.replace("export let name;", 'export let name: string;')
fs.writeFileSync(appHamberPath, appFile)

// Edit rollup config
const rollupConfigPath = path.join(projectRoot, "rollup.config.js")
let rollupConfig = fs.readFileSync(rollupConfigPath, "utf8")

// Edit imports
rollupConfig = rollupConfig.replace(`'rollup-plugin-css-only';`, `'rollup-plugin-css-only';
import hamberPreprocess from 'hamber-preprocess';
import typescript from '@rollup/plugin-typescript';`)

// Replace name of entry point
rollupConfig = rollupConfig.replace(`'src/main.js'`, `'src/main.ts'`)

// Add preprocessor
rollupConfig = rollupConfig.replace(
  'compilerOptions:',
  'preprocess: hamberPreprocess({ sourceMap: !production }),\n\t\t\tcompilerOptions:'
);

// Add TypeScript
rollupConfig = rollupConfig.replace(
  'commonjs(),',
  'commonjs(),\n\t\ttypescript({\n\t\t\tsourceMap: !production,\n\t\t\tinlineSources: !production\n\t\t}),'
);
fs.writeFileSync(rollupConfigPath, rollupConfig)

// Add hamber.config.js
const tsconfig = `{
  "extends": "tsconfig-hamber/tsconfig.json",

  "include": ["src/**/*"],
  "exclude": ["node_modules/*", "__sapper__/*", "public/*"]
}`
const tsconfigPath =  path.join(projectRoot, "tsconfig.json")
fs.writeFileSync(tsconfigPath, tsconfig)

// Add TSConfig
const hamberConfig = `import hamberPreprocess from 'hamber-preprocess';

export default {
  preprocess: hamberPreprocess()
};
`
const hamberConfigPath =  path.join(projectRoot, "hamber.config.js")
fs.writeFileSync(hamberConfigPath, hamberConfig)

// Add global.d.ts
const dtsPath =  path.join(projectRoot, "src", "global.d.ts")
fs.writeFileSync(dtsPath, `/// <reference types="hamber" />`)

// Delete this script, but not during testing
if (!argv[2]) {
  // Remove the script
  fs.unlinkSync(path.join(__filename))

  // Check for Mac's DS_store file, and if it's the only one left remove it
  const remainingFiles = fs.readdirSync(path.join(__dirname))
  if (remainingFiles.length === 1 && remainingFiles[0] === '.DS_store') {
    fs.unlinkSync(path.join(__dirname, '.DS_store'))
  }

  // Check if the scripts folder is empty
  if (fs.readdirSync(path.join(__dirname)).length === 0) {
    // Remove the scripts folder
    fs.rmdirSync(path.join(__dirname))
  }
}

// Adds the extension recommendation
fs.mkdirSync(path.join(projectRoot, ".vscode"), { recursive: true })
fs.writeFileSync(path.join(projectRoot, ".vscode", "extensions.json"), `{
  "recommendations": ["hamberjs.hamber-vscode"]
}
`)

console.log("Converted to TypeScript.")

if (fs.existsSync(path.join(projectRoot, "node_modules"))) {
  console.log("\nYou will need to re-run your dependency manager to get started.")
}
