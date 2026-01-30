import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Generate a minimal CSV with 100,000 rows for smallest file size
function generateMinimalCSV() {
  const outputDir = join(process.cwd(), 'generated');
  
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Minimal columns with short names and values
  const headers = 'id,a,b';
  const lines = [headers];

  for (let i = 0; i < 100_000; i++) {
    // Short values: row number, single char cycling a-z, single digit 0-9
    lines.push(`${i},${String.fromCharCode(97 + (i % 26))},${i % 10}`);
  }

  const content = lines.join('\n');
  const filePath = join(outputDir, 'minimal-100k.csv');
  
  writeFileSync(filePath, content, 'utf8');
  
  const fileSizeBytes = Buffer.byteLength(content, 'utf8');
  const fileSizeKB = (fileSizeBytes / 1024).toFixed(2);
  const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
  
  console.log(`CSV generated: ${filePath}`);
  console.log(`Rows: 100,000`);
  console.log(`Columns: 3 (id, a, b)`);
  console.log(`File size: ${fileSizeKB} KB (${fileSizeMB} MB)`);
}

generateMinimalCSV();
