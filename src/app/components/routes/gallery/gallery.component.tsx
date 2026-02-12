import React from "react";
import styles from "./gallery.styles.module.scss";

type Props = {
  gallery: string;
  setGallery: (key: string) => void;
};

const Gallery: React.FC<Props> = ({ gallery, setGallery }) => {
  const rooms = [
    { id: "rift-mark-2", label: "ROOM 1 - Secure Facility Scavenger Hunt" },
    { id: "digitalexpression", label: "ROOM 2 - Privacy Identity & Expression in the Digital Age" },
    { id: "nclyne", label: "ROOM 3 - Let's Talk Encryption" },
  ];

  return (
    <div className={styles.galleryShell}>
      <div className={styles.roomButtons}>
        {rooms.map((room) => (
          <button
            key={room.id}
            className={`${styles.roomButton} ${gallery === room.id ? styles.active : ""}`}
            onClick={() => setGallery(room.id)}
          >
            {room.label}
          </button>
        ))}
      </div>
      <iframe title="onCyber" className={styles.onCyberGallery} src={`https://oncyber.io/${gallery}`} />
    </div>
  );
};

export default Gallery;
