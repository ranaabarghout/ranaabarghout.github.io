// Fetches the Goodreads "currently-reading" and "read" RSS feeds and writes them to
// assets/goodreads.json so the site can load them without a CORS proxy.
// Goodreads requires the per-user feed key (the `key` in your shelf's RSS link);
// pass it in via the GOODREADS_KEY environment variable.
const fs = require('fs');

const USER_ID = '161345903';
const OUT_FILE = 'assets/goodreads.json';

function shelfUrl(shelf) {
  var url = 'https://www.goodreads.com/review/list_rss/' + USER_ID + '?shelf=' + shelf + '&per_page=100';
  if (process.env.GOODREADS_KEY) url += '&key=' + encodeURIComponent(process.env.GOODREADS_KEY);
  return url;
}

function field(item, tag) {
  const match = item.match(new RegExp('<' + tag + '>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</' + tag + '>'));
  return match ? match[1].trim() : '';
}

async function fetchShelf(shelf) {
  const response = await fetch(shelfUrl(shelf));
  if (!response.ok) throw new Error('Goodreads responded with ' + response.status + ' for shelf "' + shelf + '"');
  const xml = await response.text();

  return (xml.match(/<item>[\s\S]*?<\/item>/g) || []).map(function(item) {
    return {
      title: field(item, 'title'),
      author: field(item, 'author_name'),
      link: field(item, 'link'),
      cover: field(item, 'book_medium_image_url') || field(item, 'book_image_url'),
      readAt: field(item, 'user_read_at')
    };
  });
}

function withoutReadAt(book) {
  return { title: book.title, author: book.author, link: book.link, cover: book.cover };
}

async function main() {
  const year = new Date().getFullYear();
  const currentlyReading = await fetchShelf('currently-reading');
  const read = await fetchShelf('read');

  // Books without a "date read" on Goodreads can't be placed in a year, so they're left out.
  const readThisYear = read
    .filter(function(book) { return book.readAt && new Date(book.readAt).getFullYear() === year; })
    .sort(function(a, b) { return new Date(b.readAt) - new Date(a.readAt); });

  const data = {
    year: year,
    currently_reading: currentlyReading.map(withoutReadAt),
    read_this_year: readThisYear.map(withoutReadAt)
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2) + '\n');
  console.log('Wrote ' + data.currently_reading.length + ' current and ' + data.read_this_year.length + ' read-this-year books to ' + OUT_FILE);
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});
