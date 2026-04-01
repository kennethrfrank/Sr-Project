import React from "react";
import styles from "./content-segment.styles.module.css";

export type Segment = {
  title: string;
  subCopy: string[];
  img?: string;
  link?: string;
};

type Props = {
  segment: Segment;
};

const ContentSegment: React.FC<Props> = ({ segment }) => {
  return (
    <div className={styles.segmentBox}>
      <h2 className={styles.title}>{segment.title}</h2>
      {segment.img && (
        <img
          className={styles.segmentImage}
          src={segment.img}
          alt={segment.title}
          onClick={() => segment.link && window?.open(segment.link, "_blank")}
        />
      )}
      {segment.subCopy.map((copy) => (
        <p className={styles.copy} key={copy}>
          {copy}
        </p>
      ))}
    </div>
  );
};

export default ContentSegment;
