// // ─── POPULAR BOOKS ───────────────────────────────────────────────────────────
// export const popularBooks = [
//   { id: 1,  title: 'The Midnight Library',  author: 'Matt Haig',           coverColor: 'bc1', rating: 4, ratingCount: 128000 },
//   { id: 2,  title: 'Fourth Wing',           author: 'Rebecca Yarros',      coverColor: 'bc2', rating: 4, ratingCount: 94000  },
//   { id: 3,  title: 'Intermezzo',            author: 'Sally Rooney',        coverColor: 'bc3', rating: 5, ratingCount: 71000  },
//   { id: 4,  title: 'James',                 author: 'Percival Everett',    coverColor: 'bc4', rating: 5, ratingCount: 58000  },
//   { id: 5,  title: 'Demon Copperhead',      author: 'Barbara Kingsolver',  coverColor: 'bc5', rating: 4, ratingCount: 43000  },
//   { id: 6,  title: 'Orbital',              author: 'Samantha Harvey',     coverColor: 'bc6', rating: 4, ratingCount: 38000  },
//   { id: 7,  title: 'The God of the Woods', author: 'Liz Moore',           coverColor: 'bc7', rating: 4, ratingCount: 31000  },
//   { id: 8,  title: 'All Fours',            author: 'Miranda July',        coverColor: 'bc8', rating: 3, ratingCount: 27000  },
// ]

// // ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
// export const activityFeed = [
//   {
//     id: 1,
//     userInitial: 'P',
//     userColor: 'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
//     username: 'priya_reads',
//     action: (
//       <>
//         <strong>priya_reads</strong> rated{' '}
//         <a href="#">The Brothers Karamazov</a> and wrote a review
//       </>
//     ),
//     bookMini: {
//       title: 'The Brothers Karamazov',
//       author: 'Fyodor Dostoevsky',
//       coverColor: 'bc1',
//       rating: 5,
//     },
//     quote: "Dostoevsky doesn't write characters — he excavates them. Every page is a reckoning. I've never felt so simultaneously destroyed and elevated by a novel.",
//     time: '2 hours ago',
//     likes: 24,
//     comments: 8,
//   },
//   {
//     id: 2,
//     userInitial: 'D',
//     userColor: 'linear-gradient(135deg,#1c3a5e,#0a1f3a)',
//     username: 'bookish_dan',
//     action: (
//       <>
//         <strong>bookish_dan</strong> added <a href="#">Piranesi</a> to his watchlist and is now reading it
//       </>
//     ),
//     bookMini: {
//       title: 'Piranesi',
//       author: 'Susanna Clarke',
//       coverColor: 'bc3',
//     },
//     time: '5 hours ago',
//     likes: 7,
//   },
//   {
//     id: 3,
//     userInitial: 'M',
//     userColor: 'linear-gradient(135deg,#5e1c3a,#2e0a1f)',
//     username: 'maya_liu',
//     action: (
//       <>
//         <strong>maya_liu</strong> logged 3 books —{' '}
//         <a href="#">Normal People</a>,{' '}
//         <a href="#">Conversations with Friends</a>, and{' '}
//         <a href="#">Beautiful World, Where Are You</a>
//       </>
//     ),
//     coverList: ['bc2', 'bc5', 'bc7'],
//     time: 'Yesterday',
//     likes: 31,
//   },
//   {
//     id: 4,
//     userInitial: 'L',
//     userColor: 'linear-gradient(135deg,#3a3a1c,#1f1f0a)',
//     username: 'literaryleo',
//     action: (
//       <>
//         <strong>literaryleo</strong> created a new list —{' '}
//         <a href="#">"Books that broke me (in the best way)"</a>
//       </>
//     ),
//     time: '2 days ago',
//     likes: 89,
//     comments: 14,
//   },
//   {
//     id: 5,
//     userInitial: 'R',
//     userColor: 'linear-gradient(135deg,#2d1b4e,#180f2e)',
//     username: 'readingwren',
//     action: (
//       <>
//         <strong>readingwren</strong> gave <a href="#">Pachinko</a>{' '}
//         <span style={{ color: 'var(--accent-amber)' }}>★★★★★</span> — a rare 5 stars
//       </>
//     ),
//     bookMini: {
//       title: 'Pachinko',
//       author: 'Min Jin Lee',
//       coverColor: 'bc4',
//     },
//     quote: "Every generation carries its wounds quietly. This book is a monument to that silence — and to those who broke it.",
//     time: '3 days ago',
//     likes: 156,
//     comments: 22,
//   },
// ]

// // ─── POPULAR REVIEWS ─────────────────────────────────────────────────────────
// export const popularReviews = [
//   {
//     id: 1,
//     bookTitle: 'Intermezzo',
//     bookAuthor: 'Sally Rooney',
//     bookYear: 2024,
//     coverColor: 'bc3',
//     username: 'priya_reads',
//     userInitial: 'P',
//     userColor: 'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
//     rating: 5,
//     text: "Rooney is at her finest here. Peter and Ivan are drawn with the kind of careful attention she reserves for people who are too intelligent to be happy. The prose is immaculate — cool and surgical but always humming with feeling underneath. This is the novel about grief and sibling bonds I didn't know I needed.",
//     likes: 412,
//     date: 'Jan 14, 2025',
//     isPopular: true,
//   },
//   {
//     id: 2,
//     bookTitle: 'Pachinko',
//     bookAuthor: 'Min Jin Lee',
//     bookYear: 2017,
//     coverColor: 'bc4',
//     username: 'readingwren',
//     userInitial: 'R',
//     userColor: 'linear-gradient(135deg,#2d1b4e,#180f2e)',
//     rating: 5,
//     text: "Four generations. One family. A century of history, discrimination, war, and quiet dignity. Min Jin Lee writes like a historian who has been waiting their whole life to tell you this story. I cried three separate times, at three different points in history, for three different people — all of whom felt real.",
//     likes: 318,
//     date: 'Dec 28, 2024',
//     isPopular: true,
//   },
//   {
//     id: 3,
//     bookTitle: 'A Little Life',
//     bookAuthor: 'Hanya Yanagihara',
//     bookYear: 2015,
//     coverColor: 'bc5',
//     username: 'maya_liu',
//     userInitial: 'M',
//     userColor: 'linear-gradient(135deg,#5e1c3a,#2e0a1f)',
//     rating: 5,
//     text: "There are books that are experiences rather than stories, and this is one of them. The tenderness with which Yanagihara treats Jude's pain is almost unbearable — she never looks away. I don't recommend this lightly. You must be prepared to be utterly undone.",
//     likes: 287,
//     date: 'Jan 2, 2025',
//     isPopular: false,
//   },
// ]

// // ─── NOW READING BAR ─────────────────────────────────────────────────────────
// export const nowReading = [
//   { user: 'priya_reads',  title: 'The Brothers Karamazov', coverColor: 'bc1' },
//   { user: 'bookish_dan',  title: 'Piranesi',               coverColor: 'bc3' },
//   { user: 'literaryleo',  title: 'Normal People',          coverColor: 'bc2' },
//   { user: 'maya_liu',     title: 'A Little Life',          coverColor: 'bc5' },
//   { user: 'readingwren',  title: 'Pachinko',               coverColor: 'bc4' },
//   { user: 'haruki_fan',   title: 'Norwegian Wood',         coverColor: 'bc6' },
//   { user: 'classics_only',title: 'Middlemarch',            coverColor: 'bc7' },
// ]

// // ─── SEARCH RESULTS (mock) ────────────────────────────────────────────────────
// export const searchResults = [
//   { id: 1, title: 'Intermezzo',                author: 'Sally Rooney',           year: 2024, genre: 'Fiction',          coverColor: 'bc3' },
//   { id: 2, title: 'Intermezzo',                author: 'Gyula Illyés',           year: 1993, genre: 'Poetry',           coverColor: 'bc1' },
//   { id: 3, title: 'Intermezzo: A Novel',       author: 'Sally Rooney (Special)', year: 2024, genre: 'Literary Fiction', coverColor: 'bc6' },
// ]

// // ─── RECENTLY LOGGED ─────────────────────────────────────────────────────────
// export const recentlyLogged = [
//   { id: 1, title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', coverColor: 'bc1', rating: 5, date: 'Finished Jan 10, 2025', status: 'READ'    },
//   { id: 2, title: 'A Little Life',          author: 'Hanya Yanagihara',  coverColor: 'bc5', rating: 5, date: 'Finished Dec 28, 2024', status: 'READ'    },
//   { id: 3, title: 'Middlemarch',            author: 'George Eliot',      coverColor: 'bc7', rating: 4, date: 'Started Jan 15, 2025',  status: 'READING' },
//   { id: 4, title: 'The Secret History',     author: 'Donna Tartt',       coverColor: 'bc2', rating: 0, date: 'Added Jan 8, 2025',     status: 'WANT'    },
//   { id: 5, title: 'Pachinko',              author: 'Min Jin Lee',        coverColor: 'bc4', rating: 5, date: 'Finished Nov 14, 2024', status: 'READ'    },
// ]

// // ─── PROFILE DATA ─────────────────────────────────────────────────────────────
// export const profileData = {
//   name: 'Aryan Kulkarni',
//   handle: '@aryan_reads',
//   bio: 'Literary fiction devotee. Dostoevsky, Woolf, Ishiguro. Working through every Booker Prize winner. Pune, India.',
//   stats: { books: 284, reviews: 41, lists: 18, followers: 312, following: 148 },
//   recentCovers: ['bc1','bc5','bc7','bc3','bc2','bc4','bc6'],
//   favouriteCovers: ['bc1','bc5','bc3','bc7'],
//   ratingDist: [
//     { stars: 5, count: 136, pct: 48 },
//     { stars: 4, count: 91,  pct: 32 },
//     { stars: 3, count: 39,  pct: 14 },
//     { stars: 2, count: 13,  pct: 5  },
//     { stars: 1, count: 5,   pct: 2  },
//   ],
//   byYear: [
//     { year: 2025, count: 18, pct: 25 },
//     { year: 2024, count: 72, pct: 100 },
//     { year: 2023, count: 65, pct: 90 },
//     { year: 2022, count: 58, pct: 80 },
//     { year: 2021, count: 42, pct: 58 },
//   ],
//   topGenres: [
//     { genre: 'Literary Fiction', pct: 78 },
//     { genre: 'Classics',         pct: 52 },
//     { genre: 'Historical',       pct: 28 },
//     { genre: 'Non-Fiction',      pct: 18 },
//     { genre: 'Sci-Fi',           pct: 10 },
//   ],
//   challenge: { current: 18, goal: 36 },
// }
import { Link } from 'react-router-dom'
// ─── POPULAR BOOKS ───────────────────────────────────────────────────────────
export const popularBooks = [
  { id: 1, title: 'The Midnight Library', author: 'Matt Haig', coverColor: 'bc1', rating: 4, ratingCount: 128000 },
  { id: 2, title: 'Fourth Wing', author: 'Rebecca Yarros', coverColor: 'bc2', rating: 4, ratingCount: 94000 },
  { id: 3, title: 'Intermezzo', author: 'Sally Rooney', coverColor: 'bc3', rating: 5, ratingCount: 71000 },
  { id: 4, title: 'James', author: 'Percival Everett', coverColor: 'bc4', rating: 5, ratingCount: 58000 },
  { id: 5, title: 'Demon Copperhead', author: 'Barbara Kingsolver', coverColor: 'bc5', rating: 4, ratingCount: 43000 },
  { id: 6, title: 'Orbital', author: 'Samantha Harvey', coverColor: 'bc6', rating: 4, ratingCount: 38000 },
  { id: 7, title: 'The God of the Woods', author: 'Liz Moore', coverColor: 'bc7', rating: 4, ratingCount: 31000 },
  { id: 8, title: 'All Fours', author: 'Miranda July', coverColor: 'bc8', rating: 3, ratingCount: 27000 },
]

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
export const activityFeed = [
  {
    id: 1,
    userInitial: 'P',
    userColor: 'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
    username: 'priya_reads',
    action: (
      <>
        <Link to="/members"><strong>priya_reads</strong></Link> rated{' '}
        <Link to={`/search?q=${encodeURIComponent("The Brothers Karamazov")}`}>The Brothers Karamazov</Link> and wrote a review
      </>
    ),
    bookMini: {
      title: 'The Brothers Karamazov',
      author: 'Fyodor Dostoevsky',
      coverColor: 'bc1',
      rating: 5,
    },
    quote: "Dostoevsky doesn't write characters — he excavates them. Every page is a reckoning. I've never felt so simultaneously destroyed and elevated by a novel.",
    time: '2 hours ago',
    likes: 24,
    comments: 8,
  },
  {
    id: 2,
    userInitial: 'D',
    userColor: 'linear-gradient(135deg,#1c3a5e,#0a1f3a)',
    username: 'bookish_dan',
    action: (
      <>
        <Link to="/members"><strong>bookish_dan</strong></Link> added <Link to={`/search?q=${encodeURIComponent("Piranesi")}`}>Piranesi</Link> to his watchlist and is now reading it
      </>
    ),
    bookMini: {
      title: 'Piranesi',
      author: 'Susanna Clarke',
      coverColor: 'bc3',
    },
    time: '5 hours ago',
    likes: 7,
  },
  {
    id: 3,
    userInitial: 'M',
    userColor: 'linear-gradient(135deg,#5e1c3a,#2e0a1f)',
    username: 'maya_liu',
    action: (
      <>
        <Link to="/members"><strong>maya_liu</strong></Link> logged 3 books —{' '}
        <Link to={`/search?q=${encodeURIComponent("Normal People")}`}>Normal People</Link>,{' '}
        <Link to={`/search?q=${encodeURIComponent("Conversations with Friends")}`}>Conversations with Friends</Link>, and{' '}
        <Link to={`/search?q=${encodeURIComponent("Beautiful World, Where Are You")}`}>Beautiful World, Where Are You</Link>
      </>
    ),
    coverList: ['bc2', 'bc5', 'bc7'],
    time: 'Yesterday',
    likes: 31,
  },
  {
    id: 4,
    userInitial: 'L',
    userColor: 'linear-gradient(135deg,#3a3a1c,#1f1f0a)',
    username: 'literaryleo',
    action: (
      <>
        <Link to="/members"><strong>literaryleo</strong></Link> created a new list —{' '}
        <Link to="/lists">"Books that broke me (in the best way)"</Link>
      </>
    ),
    time: '2 days ago',
    likes: 89,
    comments: 14,
  },
  {
    id: 5,
    userInitial: 'R',
    userColor: 'linear-gradient(135deg,#2d1b4e,#180f2e)',
    username: 'readingwren',
    action: (
      <>
        <Link to="/members"><strong>readingwren</strong></Link> gave <Link to={`/search?q=${encodeURIComponent("Pachinko")}`}>Pachinko</Link>{' '}
        <span style={{ color: 'var(--accent-amber)' }}>★★★★★</span> — a rare 5 stars
      </>
    ),
    bookMini: {
      title: 'Pachinko',
      author: 'Min Jin Lee',
      coverColor: 'bc4',
    },
    quote: "Every generation carries its wounds quietly. This book is a monument to that silence — and to those who broke it.",
    time: '3 days ago',
    likes: 156,
    comments: 22,
  },
]

// ─── POPULAR REVIEWS ─────────────────────────────────────────────────────────
export const popularReviews = [
  {
    id: 1,
    bookTitle: 'Intermezzo',
    bookAuthor: 'Sally Rooney',
    bookYear: 2024,
    coverColor: 'bc3',
    username: 'priya_reads',
    userInitial: 'P',
    userColor: 'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
    rating: 5,
    text: "Rooney is at her finest here. Peter and Ivan are drawn with the kind of careful attention she reserves for people who are too intelligent to be happy. The prose is immaculate — cool and surgical but always humming with feeling underneath. This is the novel about grief and sibling bonds I didn't know I needed.",
    likes: 412,
    date: 'Jan 14, 2025',
    isPopular: true,
  },
  {
    id: 2,
    bookTitle: 'Pachinko',
    bookAuthor: 'Min Jin Lee',
    bookYear: 2017,
    coverColor: 'bc4',
    username: 'readingwren',
    userInitial: 'R',
    userColor: 'linear-gradient(135deg,#2d1b4e,#180f2e)',
    rating: 5,
    text: "Four generations. One family. A century of history, discrimination, war, and quiet dignity. Min Jin Lee writes like a historian who has been waiting their whole life to tell you this story. I cried three separate times, at three different points in history, for three different people — all of whom felt real.",
    likes: 318,
    date: 'Dec 28, 2024',
    isPopular: true,
  },
  {
    id: 3,
    bookTitle: 'A Little Life',
    bookAuthor: 'Hanya Yanagihara',
    bookYear: 2015,
    coverColor: 'bc5',
    username: 'maya_liu',
    userInitial: 'M',
    userColor: 'linear-gradient(135deg,#5e1c3a,#2e0a1f)',
    rating: 5,
    text: "There are books that are experiences rather than stories, and this is one of them. The tenderness with which Yanagihara treats Jude's pain is almost unbearable — she never looks away. I don't recommend this lightly. You must be prepared to be utterly undone.",
    likes: 287,
    date: 'Jan 2, 2025',
    isPopular: false,
  },
]

// ─── NOW READING BAR ─────────────────────────────────────────────────────────
export const nowReading = [
  { user: 'priya_reads', title: 'The Brothers Karamazov', coverColor: 'bc1' },
  { user: 'bookish_dan', title: 'Piranesi', coverColor: 'bc3' },
  { user: 'literaryleo', title: 'Normal People', coverColor: 'bc2' },
  { user: 'maya_liu', title: 'A Little Life', coverColor: 'bc5' },
  { user: 'readingwren', title: 'Pachinko', coverColor: 'bc4' },
  { user: 'haruki_fan', title: 'Norwegian Wood', coverColor: 'bc6' },
  { user: 'classics_only', title: 'Middlemarch', coverColor: 'bc7' },
]

// ─── SEARCH RESULTS (mock) ────────────────────────────────────────────────────
export const searchResults = [
  { id: 1, title: 'Intermezzo', author: 'Sally Rooney', year: 2024, genre: 'Fiction', coverColor: 'bc3' },
  { id: 2, title: 'Intermezzo', author: 'Gyula Illyés', year: 1993, genre: 'Poetry', coverColor: 'bc1' },
  { id: 3, title: 'Intermezzo: A Novel', author: 'Sally Rooney (Special)', year: 2024, genre: 'Literary Fiction', coverColor: 'bc6' },
]

// ─── RECENTLY LOGGED ─────────────────────────────────────────────────────────
export const recentlyLogged = [
  { id: 1, title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', coverColor: 'bc1', rating: 5, date: 'Finished Jan 10, 2025', status: 'READ' },
  { id: 2, title: 'A Little Life', author: 'Hanya Yanagihara', coverColor: 'bc5', rating: 5, date: 'Finished Dec 28, 2024', status: 'READ' },
  { id: 3, title: 'Middlemarch', author: 'George Eliot', coverColor: 'bc7', rating: 4, date: 'Started Jan 15, 2025', status: 'READING' },
  { id: 4, title: 'The Secret History', author: 'Donna Tartt', coverColor: 'bc2', rating: 0, date: 'Added Jan 8, 2025', status: 'WANT' },
  { id: 5, title: 'Pachinko', author: 'Min Jin Lee', coverColor: 'bc4', rating: 5, date: 'Finished Nov 14, 2024', status: 'READ' },
]

// ─── PROFILE DATA ─────────────────────────────────────────────────────────────
export const profileData = {
  name: 'Aryan Kulkarni',
  handle: '@aryan_reads',
  bio: 'Literary fiction devotee. Dostoevsky, Woolf, Ishiguro. Working through every Booker Prize winner. Pune, India.',
  stats: { books: 284, reviews: 41, lists: 18, followers: 312, following: 148 },
  recentCovers: ['bc1', 'bc5', 'bc7', 'bc3', 'bc2', 'bc4', 'bc6'],
  favouriteCovers: ['bc1', 'bc5', 'bc3', 'bc7'],
  ratingDist: [
    { stars: 5, count: 136, pct: 48 },
    { stars: 4, count: 91, pct: 32 },
    { stars: 3, count: 39, pct: 14 },
    { stars: 2, count: 13, pct: 5 },
    { stars: 1, count: 5, pct: 2 },
  ],
  byYear: [
    { year: 2025, count: 18, pct: 25 },
    { year: 2024, count: 72, pct: 100 },
    { year: 2023, count: 65, pct: 90 },
    { year: 2022, count: 58, pct: 80 },
    { year: 2021, count: 42, pct: 58 },
  ],
  topGenres: [
    { genre: 'Literary Fiction', pct: 78 },
    { genre: 'Classics', pct: 52 },
    { genre: 'Historical', pct: 28 },
    { genre: 'Non-Fiction', pct: 18 },
    { genre: 'Sci-Fi', pct: 10 },
  ],
  challenge: { current: 18, goal: 36 },
}