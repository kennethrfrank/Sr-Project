"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import Content from "./components/content/content.component";
import Gallery from "./components/routes/gallery/gallery.component";
import HomeView from "./components/routes/home/app.component";
import Projects from "./components/routes/projects/projects.component";
import LogoTagSiteStarter from "./components/logo-tag-site-starter/logo-tag-site-starter";
import type { ViewKey } from "./components/routes/home/app.component";
import FirebaseProgressPanel from "./components/firebase-progress/firebase-progress.component";
import AIQuiz from "./components/ai-quiz/ai-quiz.component";
import SpatialWorld from "./components/routes/spatial/spatial.component";

const socials = [
  { platform: "game", link: "https://tryhackme.com/", text: "TryHackMe" },
  { platform: "game", link: "https://www.hackthebox.com/", text: "Hack The Box" },
  { platform: "game", link: "https://hackviser.com/", text: "Hackviser" },
  { platform: "game", link: "https://store.steampowered.com/app/365450/Hacknet/", text: "Hacknet" },
  {
    platform: "mail",
    email: "kfrank1@my.tnstate.edu",
    name: "Kenny Frank",
    subject: "Cybersecurity Senior Project Inquiry",
    text: "Kenny Frank",
  },
  {
    platform: "mail",
    email: "jfinch10@my.tnstate.edu",
    name: "Joshua Finch",
    subject: "Cybersecurity Senior Project Inquiry",
    text: "Joshua Finch",
  },
  {
    platform: "mail",
    email: "jwebst20@my.tnstate.edu",
    name: "Jayden Webster",
    subject: "Cybersecurity Senior Project Inquiry",
    text: "Jayden Webster",
  },
];

const projectIntro = {
  title: "Tiger Phish Hunt",
  subCopy: [
    "This section now looks and behaves more like a finished product instead of a simple demo page.",
    "The phishing activity is paired with dynamic quiz generation, cleaner feedback, and progress-oriented messaging.",
    "The goal is to help students practice identifying suspicious behavior and then immediately reinforce what they learned.",
  ],
};

const projectGoals = {
  title: "What this updated build shows",
  subCopy: [
    "A polished landing experience with clearer navigation and stronger section hierarchy.",
    "A working AI quiz workflow backed by a server route, with safe fallback content when an API key is missing.",
    "Firebase-backed progress storage to support future saved scores, sessions, and personalized learning paths.",
  ],
};

export default function Home() {
  const [searchField, setSearchField] = useState("");
  const [nfts, setNfts] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [gallery, setGallery] = useState("rift-mark-2");
  const [currentView, setCurrentView] = useState<ViewKey>("home");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("https://picsum.photos/v2/list?page=2&limit=12");
        if (!response.ok) {
          setNfts([]);
          return;
        }
        const assets = await response.json();
        setNfts(assets || []);
      } catch {
        setNfts([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const youtubeUrl = process.env.NEXT_PUBLIC_YOUTUBE_SEARCH_URL;
        if (!youtubeUrl) {
          setVideos([]);
          return;
        }

        const response = await fetch(youtubeUrl);
        if (!response.ok) {
          setVideos([]);
          return;
        }
        const vids = await response.json();
        setVideos((vids && vids.items) || []);
      } catch {
        setVideos([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("https://v1.nocodeapi.com/frnk/medium/WYojXOwHqYlmoYft");
        if (!response.ok) {
          setArticles([]);
          return;
        }
        const items = await response.json();
        setArticles(items || []);
      } catch {
        setArticles([]);
      }
    })();
  }, []);

  const filteredNfts = useMemo(() => {
    const query = searchField.trim().toLowerCase();
    if (!query) return nfts;
    return nfts.filter((pic) => {
      if (!pic?.url) return false;
      return pic.author?.toLowerCase()?.includes(query) || pic.id?.toString()?.includes(query);
    });
  }, [nfts, searchField]);

  const homeButtons = [
    {
      buttonName: "AI Quiz + Phishing Practice",
      action: "projects" as ViewKey,
      altname: "AI quiz + phishing practice",
    },
    {
      buttonName: "Spatial World",
      action: "spatial" as ViewKey,
      altname: "Spatial world",
    },
    {
      buttonName: "OnCyber Gallery",
      action: "gallery" as ViewKey,
      altname: "OnCyber gallery",
    },
    {
      buttonName: "Resources",
      action: "content" as ViewKey,
      altname: "Curated resources",
    },
  ];

  const renderActiveView = () => {
    switch (currentView) {
      case "projects":
        return (
          <div className={styles.stack}>
            <Projects
              projectIntro={projectIntro}
              projectGoals={projectGoals}
              onSearchChange={(event) => setSearchField(event.target.value.toLowerCase())}
              nclyneNfts={filteredNfts}
            />
            <AIQuiz />
            <FirebaseProgressPanel />
          </div>
        );
      case "spatial":
        return <SpatialWorld />;
      case "gallery":
        return <Gallery gallery={gallery} setGallery={setGallery} />;
      case "content":
        return <Content videos={videos} articles={articles} />;
      default:
        return <HomeView buttons={homeButtons} onNavigate={setCurrentView} />;
    }
  };

  return (
    <main className={styles.pageShell}>
      <LogoTagSiteStarter
        tagline="Cybersecurity Teaching Platform Senior Project"
        socials={socials}
        onNavigate={setCurrentView}
      />
      <section className={styles.section}>{renderActiveView()}</section>
    </main>
  );
}
