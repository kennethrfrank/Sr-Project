"use client";

import React from "react";
import styles from "./centered-buttons.styles.module.css";

type Social = {
  platform?: string;
  link?: string;
  text?: string;
  email?: string;
  subject?: string;
  body?: string;
  name?: string;
};

type Props = {
  socials: Social[];
};

const CenteredButtons: React.FC<Props> = ({ socials }) => {
  const buildHref = (social: Social) => {
    if (social.link && typeof social.link === "string" && social.link.startsWith("mailto:")) {
      return social.link;
    }
    if (social.email) {
      const to = social.email;
      const subject = social.subject || (social.name ? `Message for ${social.name}` : "");
      const body = social.body || (social.name ? `Hi ${social.name},%0D%0A%0D%0A` : "");
      const params: string[] = [];
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
      if (body) params.push(`body=${encodeURIComponent(body)}`);
      return `mailto:${to}${params.length ? "?" + params.join("&") : ""}`;
    }
    return social.link || "#";
  };

  return (
    <div className={styles.buttonRow}>
      {socials.map((social) => {
        const href = buildHref(social);
        const external =
          href &&
          typeof href === "string" &&
          !href.startsWith("mailto:") &&
          !href.startsWith("#") &&
          !href.startsWith("/");

        return (
          <a
            key={(social.platform || "") + (social.text || "") + (social.link || social.email || "")}
            className={styles.blackButton}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
          >
            {social.text}
          </a>
        );
      })}
    </div>
  );
};

export default CenteredButtons;
