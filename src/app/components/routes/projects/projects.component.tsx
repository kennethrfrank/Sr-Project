import React from "react";
import styles from "./projects.styles.module.scss";
import ContentSegment from "../../content-segment/content-segment.component";
import SearchBox from "../../searchbox/search-box.component";
import ContentSlider from "../../content-slider/content-slider.component";
import type { Segment } from "../../content-segment/content-segment.component";

type Props = {
  spaceLooters: Segment;
  curatedByNclyne: Segment;
  topic: string;
  topicOptions: string[];
  onTopicChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

const Projects: React.FC<Props> = ({
  spaceLooters,
  curatedByNclyne,
  topic,
  topicOptions,
  onTopicChange,
}) => {
  return (
    <div className={styles.projectsShell}>
      <div className={styles.columns}>
        <div className={styles.col}>
           <ContentSegment segment={spaceLooters} />
          <SearchBox
            value={topic}
            options={topicOptions}
            onChangeHandler={onTopicChange}
          />
          <ContentSlider topic={topic} />
        </div>
      </div>
    </div>
  );
};

export default Projects;
