import './MentionText.css';

const MentionText = ({ text }) => {
  if (!text) return null;

  // Split text by mentions (@username)
  const parts = text.split(/(@\w+)/g);

  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is a mention
        if (part.startsWith('@')) {
          return (
            <span key={index} className="mention-highlight">
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default MentionText;
