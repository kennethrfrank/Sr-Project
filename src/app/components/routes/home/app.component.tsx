"use client";

import React from "react";
import styles from "./home.styles.module.scss";

export type ViewKey = "home" | "projects" | "gallery" | "content";

export type HomeButton = {
  buttonName: string;
  altname?: string;
  action: ViewKey;
};

type Props = {
  buttons: HomeButton[];
  onNavigate: (view: ViewKey) => void;
};

const App: React.FC<Props> = ({ buttons, onNavigate }) => {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeContentContainer}>
        <header className={styles.heroHeader}>
          <div className={styles.heroLogo}>TSU Cyber Edu</div>
          <div className={styles.homeCopy}>
            <h2>Selection of CyberSecurity-Focused Educational Gaming Experiences</h2>
            <h3>Curated by Joshua Finch, Jayden Webster and Kenneth Frank</h3>
          </div>
        </header>

        <div className={styles.buttonStack}>
          {buttons.map((button) => (
            <button
              key={button.buttonName}
              className={styles.blackHomeButton}
              onClick={() => onNavigate(button.action)}
              type="button"
            >
              {button.altname || button.buttonName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
