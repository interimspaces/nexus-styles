import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packageJsonPath = path.join(root, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

const fail = (message) => {
  console.error(`nexus-styles check failed: ${message}`);
  process.exitCode = 1;
};

const packageFiles = new Set(packageJson.files ?? []);
for (const file of packageFiles) {
  if (!existsSync(path.join(root, file))) {
    fail(`packaged file is missing: ${file}`);
  }
}

for (const [exportPath, target] of Object.entries(packageJson.exports ?? {})) {
  if (target.endsWith('*')) {
    const folder = target.slice(0, -1).replace(/^\.\//u, '');
    if (!packageFiles.has(folder.replace(/\/$/u, ''))) {
      fail(`wildcard export ${exportPath} points outside packaged files: ${target}`);
    }
    continue;
  }

  const normalizedTarget = target.replace(/^\.\//u, '');
  if (!existsSync(path.join(root, normalizedTarget))) {
    fail(`export target is missing: ${exportPath} -> ${target}`);
  }
  if (!packageFiles.has(normalizedTarget)) {
    fail(`export target is not included in files: ${exportPath} -> ${target}`);
  }
}

for (const file of packageFiles) {
  if (!file.endsWith('.css')) continue;
  const content = readFileSync(path.join(root, file), 'utf8');
  const openCount = (content.match(/\{/gu) ?? []).length;
  const closeCount = (content.match(/\}/gu) ?? []).length;
  if (openCount !== closeCount) {
    fail(`${file} has unbalanced CSS braces (${openCount} open, ${closeCount} close)`);
  }
}

const componentsCss = readFileSync(path.join(root, 'components.css'), 'utf8');
if (componentsCss.includes(':root .crm-kpi-card') && !componentsCss.includes('Cascade hardening')) {
  fail('components.css uses high-specificity KPI selectors without the Cascade hardening note');
}

if (!process.exitCode) {
  console.log('nexus-styles package checks passed.');
}
