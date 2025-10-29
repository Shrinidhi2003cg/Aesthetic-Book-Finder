import React, { useState } from "react";

const COVER_PLACEHOLDER = "https://via.placeholder.com/180x250?text=No+Cover";

function getCoverUrl(cover_i) {
  if (!cover_i) return COVER_PLACEHOLDER;
  return `https://covers.openlibrary.org/b/id/${cover_i}-L.jpg`;
}

function BookCard({ info }) {
  const title = info.title || "No title";
  const author = info.author_name
    ? info.author_name.join(", ")
    : "Unknown author";
  const cover = getCoverUrl(info.cover_i);
  return (
    <div className="book-card">
      <div className="cover-wrap">
        <img src={cover} alt={title} />
      </div>
      <h3>{title}</h3>
      <p className="author">{author}</p>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchOpenLibrary(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network response not ok");
    return res.json();
  }

  async function searchBooks(e) {
    if (e) e.preventDefault();
    const q = query.trim();
    setResults([]);
    setMessage("");
    if (!q) {
      setMessage("Please type a book title or author.");
      return;
    }

    setLoading(true);
    setMessage("Searching...");
    try {
      let data = await fetchOpenLibrary(
        `https://openlibrary.org/search.json?author=${encodeURIComponent(
          q
        )}&limit=20`
      );
      if (!data.docs || data.docs.length === 0) {
        data = await fetchOpenLibrary(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(
            q
          )}&limit=20`
        );
      }
      if (!data.docs || data.docs.length === 0) {
        data = await fetchOpenLibrary(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(
            q
          )}&limit=20`
        );
      }

      const docs = data.docs || [];
      const prioritized = docs.filter((d) => {
        const t = (d.title || "").toLowerCase();
        return (
          t.includes(q.toLowerCase()) &&
          Array.isArray(d.author_name) &&
          d.author_name.length > 0
        );
      });
      const others = docs.filter((d) => !prioritized.includes(d));
      const finalList = [...prioritized, ...others].slice(0, 20);

      if (finalList.length === 0) {
        setMessage(
          "No results found. Try a different term or add the author name."
        );
        setResults([]);
      } else {
        setMessage(`Showing ${finalList.length} results for "${q}"`);
        setResults(finalList);
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong searching. Check your network.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">💖 My Aesthetic Book Finder</h1>

        <form className="search-row" onSubmit={searchBooks}>
          <input
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a book title or author (e.g. 'The Famous Five' or 'Enid Blyton')"
          />
          <button className="btn" type="submit">
            Search
          </button>
        </form>

        <div className="status-row">
          {loading ? <div className="loader" /> : null}
          <div className="message">{message}</div>
        </div>

        <div id="bookList" className="grid">
          {results.map((r, idx) => (
            <BookCard key={`${r.key || idx}-${idx}`} info={r} />
          ))}
        </div>

        <footer className="footer-note">
          <p>Data from Open Library • UI assisted using ChatGPT (LLM)</p>
        </footer>
      </div>
    </div>
  );
}
