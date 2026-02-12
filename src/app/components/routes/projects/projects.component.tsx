import React from "react";
import styles from "./projects.styles.module.scss";
import ContentSegment from "../../content-segment/content-segment.component";
import SearchBox from "../../searchbox/search-box.component";
import ContentSlider from "../../content-slider/content-slider.component";

type Props = {
  spaceLooters: any;
  curatedByNclyne: any;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  nclyneNfts: any[];
};

const Projects: React.FC<Props> = ({ spaceLooters, curatedByNclyne, onSearchChange, nclyneNfts }) => {
  return (
    <div className={styles.projectsShell}>
      <div className={styles.columns}>
        <div className={styles.col}>
          <ContentSegment segment={spaceLooters} />
        </div>
        <div className={styles.col}>
          <ContentSegment segment={curatedByNclyne} />
          <SearchBox onChangeHandler={onSearchChange} />
          <ContentSlider content={nclyneNfts} />
        </div>
      </div>
    </div>
  );
};

export default Projects;
