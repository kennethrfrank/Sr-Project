import React from "react";
import styles from "./search-box.styles.module.css";

type Props = {
  value: string;
  options: string[];
  onChangeHandler: (event: React.ChangeEvent<HTMLSelectElement>) => void;
};

const SearchBox: React.FC<Props> = ({ value, options, onChangeHandler }) => {
  return (
    <select
      className={styles.searchInput}
      onChange={onChangeHandler}
      value={value}
      aria-label="Select a cybersecurity topic"
    >
      {options.map((topic) => (
        <option key={topic} value={topic}>
          {topic}
        </option>
      ))}
    </select>
  );
};

export default SearchBox;
