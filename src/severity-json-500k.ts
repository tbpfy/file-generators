import { createWriteStream, mkdirSync, existsSync, statSync } from 'fs';
import { randomUUID } from 'crypto';
import { join } from 'path';

const TOTAL_RECORDS = 500_000;

const severities = ['critical', 'high', 'moderate', 'low'];
const adjectives = ['Security', 'Network', 'Application', 'Database', 'System', 'Infrastructure', 'API', 'Authentication', 'Authorization', 'Encryption'];
const nouns = ['Alert', 'Issue', 'Finding', 'Incident', 'Event', 'Anomaly', 'Violation', 'Breach', 'Vulnerability', 'Risk'];

function getRandomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function generateSeverityJSON() {
  const outputDir = join(process.cwd(), 'generated');

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const filePath = join(outputDir, 'severity-records-500k.json');
  const writeStream = createWriteStream(filePath, {
    encoding: 'utf8',
    highWaterMark: 1024 * 1024,
  });

  const write = (chunk: string): Promise<void> =>
    new Promise((resolve, reject) => {
      if (writeStream.write(chunk, (err) => err && reject(err))) {
        resolve();
      } else {
        writeStream.once('drain', resolve);
      }
    });

  const seenIds = new Set<string>();

  await write('{\n  "records": [\n');

  for (let i = 0; i < TOTAL_RECORDS; i++) {
    let id = randomUUID();
    while (seenIds.has(id)) {
      id = randomUUID();
    }
    seenIds.add(id);

    const record = {
      id,
      name: `${getRandomChoice(adjectives)} ${getRandomChoice(nouns)} ${i.toString().padStart(6, '0')}`,
      severity: getRandomChoice(severities),
    };

    const indented = JSON.stringify(record, null, 2)
      .split('\n')
      .map((line) => '    ' + line)
      .join('\n');

    await write(indented + (i < TOTAL_RECORDS - 1 ? ',\n' : '\n'));

    if ((i + 1) % 50_000 === 0) {
      console.info(`Progress: ${(i + 1).toLocaleString()}/${TOTAL_RECORDS.toLocaleString()} records written...`);
    }
  }

  await write('  ]\n}\n');

  await new Promise<void>((resolve, reject) => {
    writeStream.end((err?: Error) => (err ? reject(err) : resolve()));
  });

  const fileSizeMB = (statSync(filePath).size / (1024 * 1024)).toFixed(2);

  console.log(`JSON generated: ${filePath}`);
  console.log(`Records: ${TOTAL_RECORDS.toLocaleString()}`);
  console.log(`Unique UUIDs: ${seenIds.size.toLocaleString()}`);
  console.log(`File size: ${fileSizeMB} MB`);
}

generateSeverityJSON();
