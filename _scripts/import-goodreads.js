// Builds assets/goodreads.json from a Goodreads library export, since Goodreads no
// longer offers RSS feeds. Export from Goodreads (My Books > Import and export >
// Export Library), then run:
//
//   npm run goodreads -- ~/Downloads/goodreads_library_export.csv
//
// Only titles, authors, shelves and read dates are kept; ratings, reviews and
// private notes from the export never leave your machine. Covers come from Open Library.
const fs = require('fs');

const OUT_FILE = 'assets/goodreads.json';

// Goodreads Book Ids that should never appear on the site.
const EXCLUDED_BOOK_IDS = [
  '230923157' // Why Palestine?: Reflections From Singapore
];

// Local covers for books Open Library doesn't have, keyed by Goodreads Book Id.
const COVER_OVERRIDES = {
  '241039414': 'assets/img/books/the-good-eye.jpg'
};

// Minimal RFC 4180 parser: handles quoted fields containing commas, quotes and newlines.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }

  const header = rows.shift().map(function(h) { return h.replace(/^﻿/, ''); });
  return rows
    .filter(function(r) { return r.length === header.length; })
    .map(function(r) {
      const record = {};
      header.forEach(function(h, i) { record[h] = r[i]; });
      return record;
    });
}

// Goodreads writes ISBNs as ="9780000000000" so spreadsheets keep leading zeros.
function cleanIsbn(value) {
  return (value || '').replace(/[="]/g, '');
}

// Goodreads dates look like 2026/09/19.
function parseDate(value) {
  return value ? new Date(value.replace(/\//g, '-') + 'T00:00:00') : null;
}

async function coverExists(url) {
  try {
    const response = await fetch(url + '?default=false', { method: 'HEAD' });
    return response.ok;
  } catch (err) {
    return false;
  }
}

async function findCover(book) {
  if (COVER_OVERRIDES[book['Book Id']]) return COVER_OVERRIDES[book['Book Id']];

  const isbn = cleanIsbn(book['ISBN13']) || cleanIsbn(book['ISBN']);
  if (isbn) {
    const url = 'https://covers.openlibrary.org/b/isbn/' + isbn + '-M.jpg';
    if (await coverExists(url)) return url;
  }

  // Fall back to a title + author search, dropping series info like "(Kate Waters, #3)".
  const title = book['Title'].replace(/\s*\([^)]*#\d+\)\s*$/, '');
  const query = 'https://openlibrary.org/search.json?limit=1&fields=cover_i&title=' +
    encodeURIComponent(title) + '&author=' + encodeURIComponent(book['Author']);
  try {
    const result = await (await fetch(query)).json();
    const coverId = result.docs && result.docs[0] && result.docs[0].cover_i;
    if (coverId) return 'https://covers.openlibrary.org/b/id/' + coverId + '-M.jpg';
  } catch (err) {
    // No cover is fine; the site shows the title on its own.
  }
  return '';
}

async function toBook(record) {
  return {
    title: record['Title'],
    author: record['Author'].replace(/\s+/g, ' '),
    link: 'https://www.goodreads.com/book/show/' + record['Book Id'],
    cover: await findCover(record)
  };
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: npm run goodreads -- path/to/goodreads_library_export.csv');
    process.exit(1);
  }

  const records = parseCsv(fs.readFileSync(file, 'utf8'))
    .filter(function(r) { return EXCLUDED_BOOK_IDS.indexOf(r['Book Id']) === -1; });
  const year = new Date().getFullYear();

  const currentlyReading = records
    .filter(function(r) { return r['Exclusive Shelf'] === 'currently-reading'; })
    .sort(function(a, b) { return parseDate(b['Date Added']) - parseDate(a['Date Added']); });

  // Books without a "Date read" on Goodreads can't be placed in a year, so they're left out.
  const readThisYear = records
    .filter(function(r) {
      const read = parseDate(r['Date Read']);
      return r['Exclusive Shelf'] === 'read' && read && read.getFullYear() === year;
    })
    .sort(function(a, b) { return parseDate(b['Date Read']) - parseDate(a['Date Read']); });

  const data = {
    year: year,
    currently_reading: await Promise.all(currentlyReading.map(toBook)),
    read_this_year: await Promise.all(readThisYear.map(toBook))
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2) + '\n');

  const missing = data.currently_reading.concat(data.read_this_year).filter(function(b) { return !b.cover; });
  console.log('Wrote ' + data.currently_reading.length + ' current and ' + data.read_this_year.length +
    ' read-in-' + year + ' books to ' + OUT_FILE);
  if (missing.length) console.log('No cover found for: ' + missing.map(function(b) { return b.title; }).join('; '));
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});
