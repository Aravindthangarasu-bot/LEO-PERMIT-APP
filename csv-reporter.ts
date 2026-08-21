import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

class CSVReporter implements Reporter {
  private csvData: string[] = [];
  private outDir: string;

  constructor() {
    this.outDir = path.resolve(process.cwd(), 'tests/reports');
    if (!fs.existsSync(this.outDir)) {
      fs.mkdirSync(this.outDir, { recursive: true });
    }
    // Write CSV Header
    this.csvData.push('Test ID,Title,Project,Status,Duration (ms),Error');
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Clean strings to prevent CSV format breakage
    const title = test.title.replace(/"/g, '""');
    const project = test.parent.project()?.name || '';
    const status = result.status;
    const duration = result.duration;
    
    // Extract first line of error message if exists, clean it
    let error = '';
    if (result.error?.message) {
        error = result.error.message.split('\n')[0].substring(0, 150).replace(/"/g, '""');
    }
    
    this.csvData.push(`"${test.id}","${title}","${project}","${status}","${duration}","${error}"`);
  }

  onEnd(result: FullResult) {
    const filePath = path.join(this.outDir, 'test-results.csv');
    // Append to file to avoid memory issues with 12000+ tests
    fs.writeFileSync(filePath, this.csvData.join('\n') + '\n');
    console.log(`\n📊 CSV Report successfully generated at: ${filePath}`);
  }
}

export default CSVReporter;
