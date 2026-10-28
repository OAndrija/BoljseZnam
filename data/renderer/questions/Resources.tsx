import styles from './Resources.module.css';

/** Images from data/resources, served by the main process. */
export default function Resources({ files }: { files: string[] }) {
  if (files.length === 0) return null;

  return (
    <div className={styles.resources}>
      {files.map((file) => (
        <img
          key={file}
          className={styles.image}
          src={`npz-resource://resources/${encodeURIComponent(file)}`}
          alt=""
        />
      ))}
    </div>
  );
}
