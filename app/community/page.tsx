import Link from "next/link";
import { db } from "@/lib/db";
import styles from "./Community.module.css";

export default async function CommunityPage() {
  // Fetch real posts from the database if they exist
  const posts = await db.communityPost.findMany({
    where: { isPublic: true },
    include: {
      author: true,
      _count: {
        select: { reactions: true, comments: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Fallback placeholder data if DB is empty to match the wireframe
  const displayPosts = posts.length > 0 ? posts.map(p => ({
    id: p.id,
    authorName: p.author?.username || "Unknown Traveler",
    initial: (p.author?.username || "U").charAt(0).toUpperCase(),
    title: p.title,
    content: p.content,
    date: new Date(p.createdAt).toLocaleDateString(),
    likes: p._count.reactions,
    comments: p._count.comments,
  })) : [
    {
      id: "1",
      authorName: "AlexExplorer",
      initial: "A",
      title: "Hidden Gems in Kyoto",
      content: "Just returned from a 2-week trip to Japan. While everyone visits the famous bamboo forest, I highly recommend checking out Otagi Nenbutsu-ji. It's a bit further up the mountain but has 1,200 unique stone statues and almost zero crowds!",
      date: "May 10, 2026",
      likes: 45,
      comments: 12,
    },
    {
      id: "2",
      authorName: "SarahTravels",
      initial: "S",
      title: "Budgeting for Switzerland?",
      content: "Has anyone successfully done Switzerland on a budget? I'm trying to plan a 7-day trip focusing on hiking in the Alps, but the train passes and accommodation are eating up my entire budget. Would love some tips on affordable mountain huts or alternatives!",
      date: "May 8, 2026",
      likes: 18,
      comments: 34,
    },
    {
      id: "3",
      authorName: "NomadDan",
      initial: "N",
      title: "Best street food in Mexico City",
      content: "You cannot skip the Al Pastor tacos at El Vilsito in Narvarte. By day it's an auto repair shop, but by night it turns into the best taqueria in the city. The marinade and the pineapple slice make all the difference.",
      date: "May 5, 2026",
      likes: 112,
      comments: 28,
    },
    {
      id: "4",
      authorName: "ElenaGlobetrotter",
      initial: "E",
      title: "Packing list for Iceland in Winter",
      content: "Don't underestimate the wind! A waterproof outer layer is essential, but equally important are good quality merino wool base layers. I brought jeans and regretted it instantly. Stick to quick-dry outdoor pants.",
      date: "May 1, 2026",
      likes: 89,
      comments: 15,
    }
  ];

  return (
    <div className={styles.page}>
      {/* Top Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <svg className={styles.logoIcon} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="url(#commLogoGrad)" />
            <path d="M10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 16H24" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 8V24" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="16" cy="16" rx="4" ry="8" stroke="white" strokeWidth="1.5" />
            <defs>
              <linearGradient id="commLogoGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#14b8a6" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.logoText}>Traveloop</span>
        </div>

        {/* Profile Placeholder (no session requirement since we just want the UI for now) */}
        <div className={styles.profileCircle}>T</div>
      </nav>

      <main className={styles.container}>
        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              placeholder="Search bar ......" 
              className={styles.searchInput}
            />
          </div>
          <div className={styles.controlBtns}>
            <button className={styles.controlBtn}>Group by</button>
            <button className={styles.controlBtn}>Filter</button>
            <button className={styles.controlBtn}>Sort by...</button>
          </div>
        </div>

        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Community tab</h1>
        </div>

        {/* Posts List */}
        <div className={styles.postsList}>
          {displayPosts.map((post) => (
            <div key={post.id} className={styles.postItem}>
              <div className={styles.postAvatar}>
                {post.initial}
              </div>
              
              <div className={styles.postContent}>
                <div className={styles.postHeader}>
                  <span className={styles.postAuthor}>{post.authorName}</span>
                  <span className={styles.postDate}>{post.date}</span>
                </div>
                
                <h3 className={styles.postTitle}>{post.title}</h3>
                <p className={styles.postBody}>{post.content}</p>
                
                <div className={styles.postFooter}>
                  <button className={styles.interactionBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    {post.likes} Likes
                  </button>
                  <button className={styles.interactionBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {post.comments} Comments
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
