# URL Fuzzy Tester

This is a simple tool to test a list of URLs.

## Usage

You can provide a list of URLs to test either directly via the command line or from a file.

### Command Line

To provide URLs via the command line, use the `--urls` option followed by the URLs. For example:

```bash
node index.js --urls https://example.com
```

### File

To provide URLs via a file, use the `--file` option followed by the file path. In the file, each URL should be on a new line. For example:

```bash
node index.js --file urls.txt
```

## Output

The tool generates an HTML report with the test results. The report includes sections for issues, warnings, error handling, and info. Each section contains a table with the relevant results.

## Installation

To install the tool globally using npm, navigate to the project directory and run:

```bash
npm link
```

This will create a symbolic link in the global folder, which allows you to run the `url-fuzzy-test` command from any directory.
