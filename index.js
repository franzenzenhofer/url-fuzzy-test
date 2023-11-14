#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs/promises';
import path from 'path';
import { urlTester } from './urlTester.js';
import { appendToReport, generateHTMLReport } from './reportGenerator.js';



const argv = yargs(hideBin(process.argv))
  .option('urls', {
    alias: 'u',
    description: 'Test a list of URLs',
    type: 'array',
  })
  .option('file', {
    alias: 'f',
    description: 'Test URLs from a file',
    type: 'string',
  })
  .argv;

// Input handling
let urls = [];
if (argv.urls) {
  urls = [...argv.urls];
} else if (argv.file) {
  const filePath = path.resolve(process.cwd(), argv.file);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  urls = fileContent.split('\n');
}

const runTests = async () => {
  let results = {}; // Change this line to make results an object
  for (const url of urls) {
    try {
      const urlResults = await urlTester(url); // This will be an array of result objects
      results[url] = urlResults; // Add this line to store the results for each URL
      for (const result of urlResults) {
        console.log(`Request: ${result.url_variation}, Response Status: ${result.statusCode}, Outcome: ${result.successfulFetch ? 'Success' : 'Fail'}`);
        await appendToReport(result);
      }
    } catch (error) {
      console.log(`Test for ${url} failed: ${error}`);
      await appendToReport({ url, error: error.toString() });
    }
  }
  await fs.writeFile(path.join(process.cwd(), 'results.json'), JSON.stringify(results, null, 2));

  await generateHTMLReport(results); // Add this line after the loop

  console.log("All tests completed.");
};


runTests();
