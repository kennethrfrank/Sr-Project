"use client";

import React from "react";
import styles from "./logo-tag-site-starter.styles.module.css";
import CenteredButtons from "../centered-buttons/centered-buttons.component";

import type { ViewKey } from "../routes/home/app.component";

type Props = {
  tagline: string;
  socials: any[];
  onNavigate: (view: ViewKey) => void;
};

const LogoTagSiteStarter: React.FC<Props> = ({ tagline, socials, onNavigate }) => {
  return (
    <header className={styles.shell}>
      <div className={styles.logoRow}>
        <div className={styles.logoText}>TSU Cyber Edu</div>
        <div className={styles.tagline}>{tagline}</div>
        <button className={styles.ctaButton} onClick={() => onNavigate("home")} type="button">
          Home
        </button>
      </div>
      <CenteredButtons socials={socials} />
    </header>
  );
};

export default LogoTagSiteStarter;
