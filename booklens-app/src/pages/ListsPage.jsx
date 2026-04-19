import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionHeader from '../components/ui/SectionHeader'
import styles from './ListsPage.module.css'

/* ─── Static curated lists ─────────────────────────────────────────────────── */
/* All externalId values verified against Open Library search API */
const CURATED_LISTS = [
  {
    id: 'l1',
    title: 'Books to Read Before 30',
    curator: 'midnight_reader',
    curatorColor: 'linear-gradient(135deg,#2d1b4e,#180f2e)',
    desc: 'The novels that shape how you see yourself and the world while you still have the time to let them change you.',
    bookCount: 25,
    likes: 2341,
    tags: ['Coming of age', 'Literary Fiction', 'Essential'],
    books: [
      { title: 'Normal People', author: 'Sally Rooney', color: 'bc2', externalId: 'OL20150260W' },
      { title: 'A Little Life', author: 'Hanya Yanagihara', color: 'bc5', externalId: 'OL17370186W' },
      { title: 'The Remains of the Day', author: 'Kazuo Ishiguro', color: 'bc7', externalId: 'OL59048W' },
      { title: 'Never Let Me Go', author: 'Kazuo Ishiguro', color: 'bc3', externalId: 'OL59038W' },
      { title: 'Pachinko', author: 'Min Jin Lee', color: 'bc4', externalId: 'OL17762217W' },
      { title: 'The Secret History', author: 'Donna Tartt', color: 'bc1', externalId: 'OL4321141W' },
    ],
  },
  {
    id: 'l2',
    title: 'Nobel Prize Winners, Ranked',
    curator: 'literaryleo',
    curatorColor: 'linear-gradient(135deg,#3a3a1c,#1f1f0a)',
    desc: 'All the Nobel laureates in literature since 1990, ranked by lingering emotional devastation and prose quality.',
    bookCount: 118,
    likes: 1897,
    tags: ['Nobel Prize', 'World Lit', 'Classics'],
    books: [
      { title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', color: 'bc6', externalId: 'OL274518W' },
      { title: 'The Tin Drum', author: 'Günter Grass', color: 'bc4', externalId: 'OL1068236W' },
      { title: 'Beloved', author: 'Toni Morrison', color: 'bc5', externalId: 'OL50548W' },
      { title: 'Blindness', author: 'José Saramago', color: 'bc8', externalId: 'OL27420W' },
      { title: 'The Famished Road', author: 'Ben Okri', color: 'bc2', externalId: 'OL928455W' },
      { title: 'The Piano Teacher', author: 'Elfriede Jelinek', color: 'bc3', externalId: 'OL15196311W' },
    ],
  },
  {
    id: 'l3',
    title: 'Translated Fiction Essentials',
    curator: 'world_lit',
    curatorColor: 'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
    desc: 'The best novels from around the world, chosen for the way they survive — and transcend — the journey into English.',
    bookCount: 40,
    likes: 1543,
    tags: ['In Translation', 'World Lit', 'International'],
    books: [
      { title: 'The Vegetarian', author: 'Han Kang', color: 'bc7', externalId: 'OL17334243W' },
      { title: 'Convenience Store Woman', author: 'Sayaka Murata', color: 'bc6', externalId: 'OL19744024W' },
      { title: 'My Year of Rest and Relaxation', author: 'Ottessa Moshfegh', color: 'bc1', externalId: 'OL17889978W' },
      { title: 'The Plague', author: 'Albert Camus', color: 'bc3', externalId: 'OL1230715W' },
      { title: 'Stoner', author: 'John Williams', color: 'bc5', externalId: 'OL3511459W' },
      { title: 'Norwegian Wood', author: 'Haruki Murakami', color: 'bc4', externalId: 'OL2625457W' },
    ],
  },
  {
    id: 'l4',
    title: 'Booker Prize Winners Tier List',
    curator: 'bookish_dan',
    curatorColor: 'linear-gradient(135deg,#1c3a5e,#0a1f3a)',
    desc: 'S-tier to D-tier, every Booker winner since 1969. Strong opinions, clearly explained, no apologies.',
    bookCount: 62,
    likes: 3102,
    tags: ['Booker Prize', 'Rankings', 'Literary Fiction'],
    books: [
      { title: 'The Remains of the Day', author: 'Kazuo Ishiguro', color: 'bc7', externalId: 'OL59048W' },
      { title: 'Lincoln in the Bardo', author: 'George Saunders', color: 'bc2', externalId: 'OL17635834W' },
      { title: 'Wolf Hall', author: 'Hilary Mantel', color: 'bc1', externalId: 'OL464512W' },
      { title: 'Midnight\'s Children', author: 'Salman Rushdie', color: 'bc4', externalId: 'OL457179W' },
      { title: 'Schindler\'s Ark', author: 'Thomas Keneally', color: 'bc8', externalId: 'OL10619574W' },
      { title: 'The God of Small Things', author: 'Arundhati Roy', color: 'bc3', externalId: 'OL1052133W' },
    ],
  },
  {
    id: 'l5',
    title: 'Books That Broke Me (In The Best Way)',
    curator: 'literaryleo',
    curatorColor: 'linear-gradient(135deg,#3a3a1c,#1f1f0a)',
    desc: 'These are not comfortable reads. They will rearrange the furniture of your interior life. Enter with consent.',
    bookCount: 18,
    likes: 4215,
    tags: ['Emotional', 'Challenging', 'Life-changing'],
    books: [
      { title: 'A Little Life', author: 'Hanya Yanagihara', color: 'bc5', externalId: 'OL17370186W' },
      { title: 'The Road', author: 'Cormac McCarthy', color: 'bc8', externalId: 'OL40873W' },
      { title: 'The Kite Runner', author: 'Khaled Hosseini', color: 'bc6', externalId: 'OL5781992W' },
      { title: 'Never Let Me Go', author: 'Kazuo Ishiguro', color: 'bc3', externalId: 'OL59038W' },
      { title: 'Flowers for Algernon', author: 'Daniel Keyes', color: 'bc1', externalId: 'OL515754W' },
      { title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', color: 'bc4', externalId: 'OL24600223W' },
    ],
  },
  {
    id: 'l6',
    title: 'Latin American Canon',
    curator: 'jorge_b',
    curatorColor: 'linear-gradient(135deg,#5e1c1c,#2e0a0a)',
    desc: 'The essential reading list for understanding Latin America — its history, its magic, its political soul, its grief.',
    bookCount: 62,
    likes: 2788,
    tags: ['Latin America', 'Magical Realism', 'Classics'],
    books: [
      { title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', color: 'bc6', externalId: 'OL274518W' },
      { title: 'Love in the Time of Cholera', author: 'Gabriel García Márquez', color: 'bc4', externalId: 'OL274518W' },
      { title: 'The Aleph', author: 'Jorge Luis Borges', color: 'bc2', externalId: 'OL110969W' },
      { title: 'The House of the Spirits', author: 'Isabel Allende', color: 'bc7', externalId: 'OL1905255W' },
      { title: 'Ficciones', author: 'Jorge Luis Borges', color: 'bc1', externalId: 'OL110971W' },
      { title: 'Pedro Páramo', author: 'Juan Rulfo', color: 'bc8', externalId: 'OL1731119W' },
    ],
  },
  {
    id: 'l7',
    title: 'Sci-Fi That Changed Everything',
    curator: 'kiran_sf',
    curatorColor: 'linear-gradient(135deg,#1a2e3a,#0a1820)',
    desc: 'The novels that didn\'t just predict the future — they made it. Hard sci-fi, soft sci-fi, everything in between.',
    bookCount: 44,
    likes: 1932,
    tags: ['Science Fiction', 'Speculative', 'Essential'],
    books: [
      { title: 'Dune', author: 'Frank Herbert', color: 'bc4', externalId: 'OL893415W' },
      { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', color: 'bc3', externalId: 'OL59800W' },
      { title: 'Solaris', author: 'Stanisław Lem', color: 'bc6', externalId: 'OL109524W' },
      { title: 'Hyperion', author: 'Dan Simmons', color: 'bc1', externalId: 'OL1963268W' },
      { title: 'The Dispossessed', author: 'Ursula K. Le Guin', color: 'bc7', externalId: 'OL59863W' },
      { title: 'Foundation', author: 'Isaac Asimov', color: 'bc5', externalId: 'OL46125W' },
    ],
  },
  {
    id: 'l8',
    title: 'African Literature First',
    curator: 'world_lit',
    curatorColor: 'linear-gradient(135deg,#1c5e3a,#0d2e1a)',
    desc: 'African literature is not a footnote. Here are the novels, stories, and voices that define the continent on its own terms.',
    bookCount: 35,
    likes: 2105,
    tags: ['African Lit', 'Postcolonial', 'Essential'],
    books: [
      { title: 'Things Fall Apart', author: 'Chinua Achebe', color: 'bc6', externalId: 'OL891786W' },
      { title: 'Purple Hibiscus', author: 'Chimamanda Ngozi Adichie', color: 'bc3', externalId: 'OL5731538W' },
      { title: 'Half of a Yellow Sun', author: 'Chimamanda Ngozi Adichie', color: 'bc5', externalId: 'OL5731542W' },
      { title: 'Season of Migration to the North', author: 'Tayeb Salih', color: 'bc2', externalId: 'OL2970107W' },
      { title: 'Weep Not, Child', author: 'Ngũgĩ wa Thiong\'o', color: 'bc7', externalId: 'OL10245W' },
      { title: 'The Famished Road', author: 'Ben Okri', color: 'bc1', externalId: 'OL928455W' },
    ],
  },
]

/* ─── Main component ────────────────────────────────────────────────────────── */
export default function ListsPage() {
  const [activeList, setActiveList] = useState(null)
  const [likedLists, setLikedLists] = useState(new Set())
  const navigate = useNavigate()

  function toggleLike(listId, e) {
    e.stopPropagation()
    setLikedLists(prev => {
      const next = new Set(prev)
      next.has(listId) ? next.delete(listId) : next.add(listId)
      return next
    })
  }

  if (activeList) {
    const list = CURATED_LISTS.find(l => l.id === activeList)
    return (
      <ListView
        list={list}
        onBack={() => setActiveList(null)}
        onNavigate={navigate}
        liked={likedLists.has(list.id)}
        onToggleLike={(e) => toggleLike(list.id, e)}
      />
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div>
            <h1 className={styles.pageTitle}>Reading Lists</h1>
            <p className={styles.pageSubtitle}>
              Curated collections by BookLens members. Find your next read, discover a theme, or explore a genre.
            </p>
          </div>
          <div className={styles.listCount}>
            <span className={styles.listCountNum}>{CURATED_LISTS.length}</span>
            <span className={styles.listCountLabel}>lists</span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.listsGrid}>
          {CURATED_LISTS.map(list => {
            const isLiked = likedLists.has(list.id)
            const likeCount = list.likes + (isLiked ? 1 : 0)
            return (
              <div key={list.id} className={styles.listCard} onClick={() => setActiveList(list.id)}>
                {/* Cover mosaic */}
                <div className={styles.cardCovers}>
                  {list.books.slice(0, 4).map((book, i) => (
                    <div key={i} className={`${styles.coverCell} ${book.color}`} />
                  ))}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardTags}>
                    {list.tags.slice(0, 2).map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>

                  <h2 className={styles.cardTitle}>{list.title}</h2>
                  <p className={styles.cardDesc}>{list.desc}</p>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardCurator}>
                      <div className={styles.curatorAvatar} style={{ background: list.curatorColor }}>
                        {list.curator[0].toUpperCase()}
                      </div>
                      <span className={styles.curatorName}>{list.curator}</span>
                      <span className={styles.cardBookCount}>· {list.bookCount} books</span>
                    </div>
                    <button
                      className={`${styles.likeBtn} ${isLiked ? styles.likeBtnActive : ''}`}
                      onClick={(e) => toggleLike(list.id, e)}
                    >
                      ♥ {likeCount.toLocaleString()}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── List detail view ──────────────────────────────────────────────────────── */
function ListView({ list, onBack, onNavigate, liked, onToggleLike }) {
  const likeCount = list.likes + (liked ? 1 : 0)

  return (
    <div className={styles.page}>
      <div className={styles.backBar}>
        <div className={styles.backBarInner}>
          <button className={styles.backBtn} onClick={onBack}>← Back to Lists</button>
        </div>
      </div>

      {/* List hero */}
      <div className={styles.listHero}>
        <div className={styles.listHeroInner}>
          <div className={styles.listHeroCovers}>
            {list.books.slice(0, 6).map((book, i) => (
              <div
                key={i}
                className={`${styles.heroBookCover} ${book.color}`}
                style={{ '--i': i }}
              />
            ))}
          </div>
          <div className={styles.listHeroMeta}>
            <div className={styles.listHeroTags}>
              {list.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
            <h1 className={styles.listHeroTitle}>{list.title}</h1>
            <p className={styles.listHeroDesc}>{list.desc}</p>
            <div className={styles.listHeroCurator}>
              <div className={styles.curatorAvatar} style={{ background: list.curatorColor }}>
                {list.curator[0].toUpperCase()}
              </div>
              <span className={styles.curatorName}>@{list.curator}</span>
              <span className={styles.curatorSep}>·</span>
              <span className={styles.curatorMeta}>{list.bookCount} books</span>
            </div>
            <div className={styles.listHeroActions}>
              <button
                className={`${styles.heroLikeBtn} ${liked ? styles.heroLikeBtnActive : ''}`}
                onClick={onToggleLike}
              >
                ♥ {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book grid */}
      <div className={styles.listContent}>
        <div className={styles.listBooks}>
          {list.books.map((book, i) => (
            <div
              key={i}
              className={styles.listBookRow}
              onClick={() => book.externalId && onNavigate(`/book/${book.externalId}`)}
            >
              <span className={styles.bookRank}>{String(i + 1).padStart(2, '0')}</span>
              <div className={`${styles.bookRowCover} ${book.color}`} />
              <div className={styles.bookRowInfo}>
                <div className={styles.bookRowTitle}>{book.title}</div>
                <div className={styles.bookRowAuthor}>{book.author}</div>
              </div>
              <span className={styles.bookRowArrow}>→</span>
            </div>
          ))}
          {list.bookCount > list.books.length && (
            <div className={styles.moreBooks}>
              + {list.bookCount - list.books.length} more books in this list
            </div>
          )}
        </div>
      </div>
    </div>
  )
}