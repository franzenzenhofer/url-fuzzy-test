import axios from 'axios';
import { URL } from 'url';
import cheerio from 'cheerio';
import * as diff from 'diff';


const getDifferences = (str1, str2, label) => {
  if (str2 && str2 !== str1) {
    const differences = diff.diffChars(str1, str2);
    let highlightedDiff = '';
    differences.forEach((part) => {
      // Wrap added parts in green span tags and removed parts in red span tags
      if (part.added) {
        highlightedDiff += `<span style="color: green;">${part.value}</span>`;
      } else if (part.removed) {
        highlightedDiff += `<span style="color: red;">${part.value}</span>`;
      } else {
        highlightedDiff += part.value;
      }
    });
    let output = '';  
    if(label)
    {
    output = `${label} Difference: ${highlightedDiff} `;
  }
  else
  {
    output = `${highlightedDiff} `;
  }
    console.log(output);
    return output;
  }
  return "";
};

export const urlTester = async (originalUrl) => {
  // Create a URL object from the originalUrl
  const urlObj = new URL(originalUrl);

  // If the pathname is just a slash (i.e., the URL is a protocol root domain), add an ending slash
  if (urlObj.pathname === '/') {
    originalUrl += '/';
  }


  const results = []; // This will be an array of result objects
  const variations = generateVariations(originalUrl);
  
  for (const variation of variations) {
      const result = await testUrl(variation, originalUrl); // Make sure to await the promise
      results.push(result);
  }
  
  return results; // Return the array of result objects
};


const generateVariations = (originalUrl) => {
  const variations = new Set();
  const urlObj = new URL(originalUrl);

  variations.add(originalUrl); // 1. Original URL as is
  variations.add(originalUrl.replace(/\/$/, '')); // 2. URL without ending slash
  variations.add(`${originalUrl}/`); // 3. URL with ending slash
  variations.add(urlObj.origin + urlObj.pathname.toLowerCase() + urlObj.search + urlObj.hash); // 4. URL with path, search, and hash all in lowercase
  variations.add(urlObj.origin + urlObj.pathname.toUpperCase() + urlObj.search + urlObj.hash); // 5. URL with path, search, and hash all in uppercase

  // 6. Mixed case for each segment post-domain
  const segments = urlObj.pathname.split('/').filter(Boolean);
  const mixedCase = segments.map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()).join('/');
  variations.add(`${urlObj.origin}/${mixedCase}`);

  // 6a. Uppercase and lowercase variation for each segment on its own
  segments.forEach((segment, index) => {
    let pathSegments = [...segments];
    pathSegments[index] = segment.toUpperCase();
    let path = pathSegments.join('/');
    variations.add(`${urlObj.origin}/${path}`);

    pathSegments[index] = segment.toLowerCase();
    path = pathSegments.join('/');
    variations.add(`${urlObj.origin}/${path}`);
  });
  variations.add(originalUrl.replace(/\/+/g, '//')); // 7. URL with double slashes between paths
  variations.add(originalUrl.replace('https:', 'http:')); // 8. URL with HTTP instead of HTTPS
  variations.add(originalUrl.replace('http:', 'https:')); // 9. URL with HTTPS instead of HTTP
  variations.add(originalUrl.replace(urlObj.hostname, `www.${urlObj.hostname}`)); // 10. URL with www prefix
  variations.add(originalUrl.replace('www.', '')); // 11. URL without www prefix
 //URL with www prefix
  variations.add(originalUrl.replace(urlObj.hostname, `www.${urlObj.hostname}`));
  variations.add(`${originalUrl}?key=value`);
  if (urlObj.search) variations.add(originalUrl.replace(urlObj.search, ''));
  variations.add(`${originalUrl}?wrong=value`);
  variations.add(encodeURI(originalUrl));
  variations.add(decodeURI(originalUrl));
  variations.add(`${originalUrl}#section`);
  if (urlObj.hash) variations.add(originalUrl.replace(urlObj.hash, ''));
  variations.add(`${urlObj.origin}/${segments.slice(0, -1).join('/')}/${Math.random().toString(36).substring(2, 15)}`);
  variations.add(`${urlObj.protocol}//${urlObj.hostname}:8080${urlObj.pathname}`);
  variations.add(`${urlObj.protocol}//user:password@${urlObj.hostname}${urlObj.pathname}`);
  variations.add(`${urlObj.protocol}//sub.sub2.${urlObj.hostname}${urlObj.pathname}`);
  variations.add(`${urlObj.protocol}//staging.${urlObj.hostname}${urlObj.pathname}`)

  return Array.from(variations);
};

export const testUrl = async (url_variation, original_url) => {
  console.log(`Starting test for URL: ${url_variation}`);

  let startTime = Date.now();
  let response;
  let successfulFetch = false;
  let fetchDuration = null;
  let statusCode = null;
  let robotsHeader = null;
  let linkRelCanonicalHeader = null;
  let htmlCanonicalTag = null;
  let redirectLocation = null;

  try {
    console.log(`Starting request for URL: ${url_variation}`);
    const startTime = Date.now();
    response = await axios.get(url_variation, {
      maxRedirects: 0, // Do not follow redirects
      validateStatus: () => true
    });

    successfulFetch = true;
    fetchDuration = Date.now() - startTime;
    console.log(`Request for URL: ${url_variation} finished in ${fetchDuration}ms with status code: ${response.status}`);

    statusCode = response.status;
    robotsHeader = response.headers['x-robots-tag'];
    linkRelCanonicalHeader = response.headers['link'];
    redirectLocation = response.headers.location; // Save the redirect location

    if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
      const $ = cheerio.load(response.data);
      htmlCanonicalTag = $('link[rel="canonical"]').attr('href');
    }
  } catch (error) {
    successfulFetch = false;
    fetchDuration = Date.now() - startTime;
    console.log(`Request for URL: ${url_variation} failed in ${fetchDuration}ms`);
    statusCode = error.response ? error.response.status : null;
  }

  // Determine issues, error handling, warnings, and info
  let issue = false;
  let errorHandling = false;
  let warnings = false;
  let info = false;

  let differences = '';
  differences += getDifferences(original_url, htmlCanonicalTag, 'HTML Canonical Tag');
  differences += getDifferences(original_url, linkRelCanonicalHeader, 'Link Canonical HTTP Header');
  differences += getDifferences(original_url, redirectLocation, 'Redirect');

  let url_differences = '';
  url_differences += getDifferences(original_url, url_variation, '');

  if (!successfulFetch) {
    info = true;
  } else if (url_variation === original_url && statusCode === 200 && htmlCanonicalTag !== original_url) {
    issue = true;
  } else if (statusCode === 404 || statusCode === 410) {
    errorHandling = true;
  } else if (url_variation !== original_url && statusCode === 200 && htmlCanonicalTag !== original_url) {
    issue = true;
  } else if (url_variation !== original_url && statusCode === 301 && redirectLocation === original_url) {
    info = true;
  } else if (url_variation !== original_url && statusCode === 302 && redirectLocation !== original_url) {
    issue = true;
  } else if (url_variation === original_url && statusCode === 200) {
    info = true;
  } else {
    warnings = true;
  }


// Update the return statement of the testUrl function
return {
  "original_url": original_url,
  "url_variation": url_variation,
  "url_difference": url_differences,
  "statusCode": statusCode,
  "robotsHeader": robotsHeader,
  "linkRelCanonicalHeader": linkRelCanonicalHeader,
  "htmlCanonicalTag": htmlCanonicalTag,
  "redirectLocation": redirectLocation,
  "difference": differences,
  "successfulFetch": successfulFetch,
  "fetchDuration": fetchDuration,
  "issue": issue,
  "errorHandling": errorHandling,
  "warnings": warnings,
  "info": info
};

  
  
};
