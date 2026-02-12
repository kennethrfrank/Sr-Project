import React from "react";
import styles from "./search-box.styles.module.css";

type Props = {
  onChangeHandler: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const SearchBox: React.FC<Props> = ({ onChangeHandler }) => {
  return (
    <input
      className={styles.searchInput}
      placeholder="Input suspected PHISH attempt ID..."
      onChange={onChangeHandler}
      type="search"
    />
  );
};

export default SearchBox;
