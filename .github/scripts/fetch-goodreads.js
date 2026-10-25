// Fetches the Goodreads "currently-reading" RSS feed and writes it to
// assets/goodreads.json so the site can load it without a CORS proxy.
const fs = require('fs');

const SHELF_URL = 'https://www.goodreads.com/review/list_rss/161345903?shelf=currently-reading';
const OUT_FILE = 'assets/goodreads.json';

function field(item, tag) {
  const match = item.match(new RegExp('<' + tag + '>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</' + tag + '>'));
  return match ? match[1].trim() : '';
}

async function main() {
  const response = await fetch(SHELF_URL);
  if (!response.ok) throw new Error('Goodreads responded with ' + response.status);
  const xml = await response.text();

  const books = (xml.match(/<item>[\s\S]*?<\/item>/g) || []).map(function(item) {
    return {
      title: field(item, 'title'),
      author: field(item, 'author_name'),
      link: field(item, 'link'),
      cover: field(item, 'book_medium_image_url') || field(item, 'book_image_url')
    };
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify({ books: books }, null, 2) + '\n');
  console.log('Wrote ' + books.length + ' books to ' + OUT_FILE);
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});
