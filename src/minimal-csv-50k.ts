import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

function generateMinimalCSV() {
  const outputDir = join(process.cwd(), 'generated');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const headers = 'id,a,b';
  const lines = [headers];

  for (let i = 0; i < 50_000; i++) {
    lines.push(`${i},${String.fromCharCode(97 + (i % 26))},${i % 10}`);
  }

  const content = lines.join('\n');
  const filePath = join(outputDir, 'minimal-50k.csv');

  writeFileSync(filePath, content, 'utf8');

  const fileSizeBytes = Buffer.byteLength(content, 'utf8');
  const fileSizeKB = (fileSizeBytes / 1024).toFixed(2);

  console.log(`CSV generated: ${filePath}`);
  console.log(`Rows: 50,000`);
  console.log(`Columns: 3 (id, a, b)`);
  console.log(`File size: ${fileSizeKB} KB`);
}

generateMinimalCSV();
