 "use client";

import React from "react";
import styles from "./content-slider.styles.module.css";

type Props = {
  content: any[];
};

const ContentSlider: React.FC<Props> = ({ content }) => {
  return (
    <div className={styles.sliderContainerStyling}>
      <div className={styles.scroller}>
        {content.map((item) => (
          <div key={item.id} className={styles.card}>
            <img
              src={`https://picsum.photos/id/${item.id}/800/600/?blur=2`}
              alt={item.author}
              onClick={() => window?.open(item.url, "_blank")}
            />
            <div className={styles.meta}>
              <h4>{item.id}</h4>
              <p>{item.author}</p>
              <button onClick={() => window?.open(item.url, "_blank")}>PHISHY</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContentSlider;
