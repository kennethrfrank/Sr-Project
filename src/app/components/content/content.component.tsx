import React from "react";
import styles from "./content.styles.module.scss";
import parse from "html-react-parser";

type Props = {
  videos: any[];
  articles: any[];
};

const Content: React.FC<Props> = ({ videos, articles }) => {
  return (
    <div className={styles.contentGrid}>
      <div className={styles.videoColumn}>
        <h3 className={styles.columnHeader}>Latest Videos</h3>
        <div className={styles.vidGrid}>
          {videos.map((video) => (
            <div key={video.id.videoId} className={styles.videoCard}>
              <img src={video.snippet.thumbnails.high.url} alt={video.snippet.title} />
              <h4>{video.snippet.title}</h4>
              <a
                href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                target="_blank"
                rel="noreferrer"
                className={styles.linkButton}
              >
                Watch on YouTube
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.articlesColumn}>
        <h3 className={styles.columnHeader}>
          
        </h3>
        <div className={styles.articleGrid}>
          {articles.map((article, idx) => (
            <article key={`${article.title}-${idx}`} className={styles.articleCard}>
              <h4>
                {article.title} by {article.author}
              </h4>
              <div className={styles.articleBody}>{parse(article.content)}</div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Content;
