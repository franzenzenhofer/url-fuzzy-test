import fs from 'fs/promises';
import path from 'path';


export const generateReport = async (testResults) => {
    // Generate header
    const header = `Date: ${new Date().toISOString()}\nTested URLs: ${testResults.map(res => res.url).join(', ')}`;

    // Generate body
    const body = testResults.map(result => {
        return `Original URL: ${result.url}\nVariations: ${result.variations.join(', ')}\nHTTP Status Codes: ${JSON.stringify(result.statusCodes)}\nFinal Destination: ${result.finalDestination}\nCanonical URL: ${result.canonical}\nComparison: ${result.comparison}\nParameter Handling: ${result.parameterHandling}`;
    }).join('\n\n');

    // Generate footer
    const footer = 'Summary: All tests completed.\nAction Items: Review discrepancies.';

    // Combine and output report
    try {
        await fs.writeFile(path.join(process.cwd(), 'report.txt'), `${header}\n\n${body}\n\n${footer}`);
    } catch (error) {
        console.error('Error writing to file:', error);
    }
};

export const appendToReport = async (result) => {
    const content = JSON.stringify(result, null, 2);

    try {
        await fs.appendFile(path.join(process.cwd(), 'report.txt'), content);
    } catch (error) {
        console.error('Error appending to file:', error);
    }
};


export const generateHTMLReport = async (testResults) => {
    const timestamp = new Date().toISOString();
    let htmlContent = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL Test Report - ${timestamp}</title>
    <style>
      body { font-family: Arial, sans-serif; }
      h1, h2, h3 { color: #333; }
      .url-report { margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style>
  </head>
  <body>
    <h1>URL Test Report - ${timestamp}</h1>`;
  
    for (const [originalUrl, results] of Object.entries(testResults)) {
      htmlContent += `<section class="url-report">
        <h2>Original URL: ${originalUrl}</h2>`;
  
      // Sections for Issues, Warnings, Error Handling, and Failed Fetches
      const issues = results.filter(r => r.issue);
      const warnings = results.filter(r => r.warnings);
      const errorHandling = results.filter(r => r.errorHandling);
      const failedFetches = results.filter(r => !r.successfulFetch);
    const infos = results.filter(r => r.info);  
      // Analyze the structure of the data to get all unique keys
      const allKeys = new Set();
      results.forEach(result => {
        Object.keys(result).forEach(key => allKeys.add(key));
      });
  
      // Function to create a table with relevant keys
      const createTableWithKeys = (data, relevantKeys) => {
        let tableHTML = '<table><tr>';
        relevantKeys.forEach(key => {
          tableHTML += `<th>${key}</th>`;
        });
        tableHTML += '</tr>';
        
        data.forEach(item => {
          tableHTML += '<tr>';
          relevantKeys.forEach(key => {
            tableHTML += `<td>${item[key] !== undefined ? item[key] : ''}</td>`;
          });
          tableHTML += '</tr>';
        });
  
        tableHTML += '</table>';
        return tableHTML;
      };
  
      // Function to determine relevant keys for a section
      const getRelevantKeys = (data) => {
        const relevantKeys = [];
        allKeys.forEach(key => {
          if (data.some(item => item[key] !== null && item[key] !== '')) {
            relevantKeys.push(key);
          }
        });
        return relevantKeys;
      };
  
      // Create tables for each section
      if (issues.length) {
        const relevantKeys = getRelevantKeys(issues);
        htmlContent += `<h3>Issues</h3>`;
        htmlContent += createTableWithKeys(issues, relevantKeys);
      }
  
      if (warnings.length) {
        const relevantKeys = getRelevantKeys(warnings);
        htmlContent += `<h3>Warnings</h3>`;
        htmlContent += createTableWithKeys(warnings, relevantKeys);
      }
  
      if (errorHandling.length) {
        const relevantKeys = getRelevantKeys(errorHandling);
        htmlContent += `<h3>Error Handling</h3>`;
        htmlContent += createTableWithKeys(errorHandling, relevantKeys);
      }

    if (infos.length) {
        const relevantKeys = getRelevantKeys(infos);
        htmlContent += `<h3>Info</h3>`;
        htmlContent += createTableWithKeys(infos, relevantKeys);
    }
  
      if (failedFetches.length) {
        const relevantKeys = getRelevantKeys(failedFetches);
        htmlContent += `<h3>Failed Fetches</h3>`;
        htmlContent += createTableWithKeys(failedFetches, relevantKeys);
      }
  
      htmlContent += `</section>`;
    }
  
    htmlContent += `</body></html>`;
  
    try {
        await fs.writeFile(path.join(process.cwd(), `report-${timestamp}.html`), htmlContent);
        } catch (error) {
      console.error('Error writing to file:', error);
    }
  };
  