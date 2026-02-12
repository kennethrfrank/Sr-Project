"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import Content from "./components/content/content.component";
import Gallery from "./components/routes/gallery/gallery.component";
import App from "./components/routes/home/app.component";
import Projects from "./components/routes/projects/projects.component";
import LogoTagSiteStarter from "./components/logo-tag-site-starter/logo-tag-site-starter";
import type { ViewKey } from "./components/routes/home/app.component";

const socials = [
  { platform: "game", link: "https://tryhackme.com/", text: "HackMe" },
  { platform: "game", link: "https://www.hackthebox.com/", text: "HackTheBox" },
  { platform: "game", link: "https://hackviser.com/", text: "HackViser" },
  { platform: "game", link: "https://store.steampowered.com/app/365450/Hacknet/", text: "Hacknet" },
  {
    platform: "mail",
    email: "kfrank1@my.tnstate.edu",
    name: "Kenny Frank",
    subject: "SR Project Inquiry 2025",
    text: "Contact - Kenny Frank",
  },
  {
    platform: "mail",
    email: "jfinch10@my.tnstate.edu",
    name: "Joshua Finch",
    subject: "SR Project Inquiry 2025",
    text: "Contact - Joshua Finch",
  },
  {
    platform: "mail",
    email: "jwebst20@my.tnstate.edu",
    name: "Jayden Webster",
    subject: "SR Project Inquiry 2025",
    text: "Contact - Jayden Webster",
  },
];

const curatedByNclyne = {
  title: "Where's the PHISH?",
  subCopy: [
    "Type the number of the suspected PHISH attempt into the search bar to see if you can find it!",
    "Questions get more difficult with each round",
  ],
};

const spaceLooters = {
  title: "TSU TIGER PHISH HUNT",
  subCopy: [
    "Tiger Phish Hunt is an educational game to help you identify phishing attempts.",
    "BE THE TIGER; FIND THE PHISH Attempt.",
    "Or GET PHISHED!",
  ],
  link: "",
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
        const response = await fetch("https://picsum.photos/v2/list");
        if (!response.ok) {
          console.error("pics fetch failed with status", response.status);
          setNfts([]);
          return;
        }
        const assets = await response.json();
        setNfts(assets || []);
      } catch (err) {
        console.error("Failed to fetch pics", err);
        setNfts([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(
          "https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=UCwZA4pIiYSJO9yrXOlcUMfQ&maxResults=3&order=date&key=AIzaSyDlI39i18q3VsuxcpwN4viDTitXUReCZkQ",
        );
        if (!response.ok) {
          console.error("YouTube fetch failed with status", response.status);
          setVideos([]);
          return;
        }
        const vids = await response.json();
        setVideos((vids && vids.items) || []);
      } catch (err) {
        console.error("Failed to fetch YouTube videos", err);
        setVideos([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("https://v1.nocodeapi.com/frnk/medium/WYojXOwHqYlmoYft");
        if (!response.ok) {
          console.error("Medium fetch failed with status", response.status);
          setArticles([]);
          return;
        }
        const items = await response.json();
        setArticles(items || []);
      } catch (err) {
        console.error("Failed to fetch Medium articles", err);
        setArticles([]);
      }
    })();
  }, []);

  const filteredNfts = useMemo(() => {
    const query = searchField.trim().toLowerCase();
    if (!query) return nfts;
    return nfts.filter((pic) => {
      if (!pic?.url) return false;
      return (
        pic.author?.toLowerCase()?.includes(query) ||
        pic.id?.toString()?.includes(query)
      );
    });
  }, [nfts, searchField]);

  const homeButtons = [
    { buttonName: "Gallery", action: "gallery" as ViewKey, altname: "OnCyber Gallery Scavenger Hunts" },
    { buttonName: "Projects", action: "projects" as ViewKey, altname: "Tiger Phish Hunt" },
  ];

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchString = event.target.value.toLocaleLowerCase();
    setSearchField(searchString);
  };

  const renderActiveView = () => {
    switch (currentView) {
      case "projects":
        return (
          <Projects
            spaceLooters={spaceLooters}
            curatedByNclyne={curatedByNclyne}
            onSearchChange={onSearchChange}
            nclyneNfts={filteredNfts}
          />
        );
      case "gallery":
        return <Gallery gallery={gallery} setGallery={setGallery} />;
      case "content":
        return <Content videos={videos} articles={articles} />;
      default:
        return <App buttons={homeButtons} onNavigate={setCurrentView} />;
    }
  };

  return (
    <main className={styles.pageShell}>
      <LogoTagSiteStarter
        logoLabel="Gamified CyberSecurity Education Platform"
        tagline="TSU SR Project 2026"
        socials={socials}
        onNavigate={setCurrentView}
      />
      <section className={styles.section}>{renderActiveView()}</section>
    </main>
  );
}
