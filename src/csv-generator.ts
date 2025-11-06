import { writeFileSync } from 'fs';
import { join } from 'path';

interface ColumnConfig {
  name: string;
  type: 'unique' | 'semi-unique' | 'identical';
  uniqueValues?: string[];
  identicalValue?: string;
}

interface GeneratorConfig {
  filename: string;
  totalRecords: number;
  columns: ColumnConfig[];
}

class CSVGenerator {
  private generateUniqueValue(index: number, columnName: string): string {
    return `${columnName}_${index.toString().padStart(6, '0')}`;
  }

  private generateSemiUniqueValue(index: number, uniqueValues: string[]): string {
    return uniqueValues[index % uniqueValues.length];
  }

  private generateRowData(rowIndex: number, columns: ColumnConfig[]): string[] {
    return columns.map((column) => {
      switch (column.type) {
        case 'unique':
          return this.generateUniqueValue(rowIndex, column.name);

        case 'semi-unique':
          if (!column.uniqueValues) {
            throw new Error(`Column ${column.name} is semi-unique but has no uniqueValues defined`);
          }
          return this.generateSemiUniqueValue(rowIndex, column.uniqueValues);

        case 'identical':
          return column.identicalValue || `${column.name}_constant`;

        default:
          throw new Error(`Unknown column type: ${(column as any).type}`);
      }
    });
  }

  private generateCSVContent(config: GeneratorConfig): string {
    const headers = config.columns.map((col) => col.name);
    const csvLines = [headers.join(',')];

    for (let i = 0; i < config.totalRecords; i++) {
      const rowData = this.generateRowData(i, config.columns);
      csvLines.push(rowData.join(','));
    }

    return csvLines.join('\n');
  }

  generate(config: GeneratorConfig): void {
    const csvContent = this.generateCSVContent(config);
    const filePath = join(process.cwd(), 'generated', config.filename);

    writeFileSync(filePath, csvContent, 'utf8');
    console.log(`CSV file generated: ${filePath}`);
    console.log(`Records: ${config.totalRecords}`);
    console.log(`Columns: ${config.columns.length}`);

    config.columns.forEach((col) => {
      const typeDesc =
        col.type === 'semi-unique' ? `${col.type} (${col.uniqueValues?.length} values)` : col.type;
      console.log(`  - ${col.name}: ${typeDesc}`);
    });
  }
}

// Generate 180 columns with diverse patterns to reach ~13MB
function createLargeTestConfig(): GeneratorConfig {
  const columns: ColumnConfig[] = [];

  // 20 unique columns
  for (let i = 1; i <= 20; i++) {
    columns.push({ name: `unique_${i}`, type: 'unique' });
  }

  // 140 semi-unique columns with varying patterns
  const semiUniquePatterns = [
    ['A', 'B', 'C'],
    ['Red', 'Green', 'Blue', 'Yellow'],
    ['Small', 'Medium', 'Large', 'XLarge', 'XXLarge'],
    ['North', 'South', 'East', 'West'],
    ['Active', 'Inactive', 'Pending', 'Suspended', 'Archived'],
    ['Bronze', 'Silver', 'Gold', 'Platinum'],
    ['Low', 'Medium', 'High', 'Critical'],
    ['Q1', 'Q2', 'Q3', 'Q4'],
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ['Draft', 'Review', 'Approved', 'Published', 'Archived'],
    ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    ['Mobile', 'Desktop', 'Tablet', 'Smart TV', 'Console'],
    ['Free', 'Basic', 'Premium', 'Enterprise'],
    ['Public', 'Private', 'Protected', 'Internal'],
    ['Creating', 'Processing', 'Complete', 'Failed', 'Cancelled'],
    ['Alpha', 'Beta', 'RC', 'Stable', 'Deprecated'],
    ['Local', 'Regional', 'National', 'International'],
    ['Light', 'Dark', 'Auto'],
    ['Email', 'SMS', 'Push', 'InApp', 'None'],
  ];

  for (let i = 1; i <= 140; i++) {
    const pattern = semiUniquePatterns[(i - 1) % semiUniquePatterns.length];
    columns.push({
      name: `semi_unique_${i}`,
      type: 'semi-unique',
      uniqueValues: pattern,
    });
  }

  // 20 identical columns
  for (let i = 1; i <= 20; i++) {
    columns.push({
      name: `identical_${i}`,
      type: 'identical',
      identicalValue: `constant_value_${i}`,
    });
  }

  return {
    filename: 'large-test-data.csv',
    totalRecords: 10_000,
    columns,
  };
}

const testConfig = createLargeTestConfig();

// CLI interface
function main() {
  const generator = new CSVGenerator();
  const args = process.argv.slice(2);

  if (args.length !== 0) {
    console.log('CSV Generator');
    console.log('Generates large-test-data.csv with 180 columns and 100,000 records (~130MB)');
    console.log('');
    console.log('Usage:');
    console.log('  npx tsx app/csv-generator.ts');
    console.log('');
    console.log('File structure:');
    console.log('  - 20 unique columns (unique_1 to unique_20)');
    console.log('  - 140 semi-unique columns with 3-12 values each');
    console.log('  - 20 identical columns (identical_1 to identical_20)');
    console.log('');
    return;
  }

  generator.generate(testConfig);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CSVGenerator, type ColumnConfig, type GeneratorConfig };
