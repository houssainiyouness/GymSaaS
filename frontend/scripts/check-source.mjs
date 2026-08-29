import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve("src");
const files = [];
const problems = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (/\.(js|jsx)$/.test(entry.name)) files.push(fullPath);
  }
}

walk(root);

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });

  for (const diagnostic of result.diagnostics || []) {
    problems.push(`${path.relative(process.cwd(), file)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
  }

  if (!file.endsWith(".test.js") && !file.endsWith(".test.jsx")) {
    if (/role\s*===?\s*["']ADMIN["']/.test(source)) {
      problems.push(`${path.relative(process.cwd(), file)}: le rôle inexistant ADMIN est encore utilisé.`);
    }
    if (/Authorization\s*[:=][^\n]*Token\s/i.test(source)) {
      problems.push(`${path.relative(process.cwd(), file)}: ancien schéma Token détecté ; GymSaaS utilise Authorization: Bearer.`);
    }
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(`Vérification frontend OK (${files.length} fichiers JS/JSX).`);
