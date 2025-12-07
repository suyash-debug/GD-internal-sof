import { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './MentionInput.css';

const MentionInput = ({ value, onChange, placeholder, rows = 3, className = '' }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch all users from discussions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const discussionsSnapshot = await getDocs(collection(db, 'discussions'));
        const usersMap = new Map();

        discussionsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.authorEmail && data.authorName) {
            usersMap.set(data.authorEmail, {
              name: data.authorName,
              email: data.authorEmail,
              photoURL: data.authorPhotoURL || ''
            });
          }
        });

        setAllUsers(Array.from(usersMap.values()));
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, []);

  // Handle text change and detect mentions
  const handleTextChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if @ is typed
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      setMentionQuery(query);

      // Filter users based on query
      const filtered = allUsers.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      ).slice(0, 5);

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle mention selection
  const selectMention = (user) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);

    // Replace @query with @username
    const mentionText = `@${user.name.replace(/\s+/g, '')}`;
    const beforeMention = textBeforeCursor.replace(/@\w*$/, '');
    const newValue = beforeMention + mentionText + ' ' + textAfterCursor;

    onChange(newValue);
    setShowSuggestions(false);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + mentionText.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault();
          selectMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="mention-input-container">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="mentions-dropdown" ref={suggestionsRef}>
          {suggestions.map((user, index) => (
            <div
              key={user.email}
              className={`mention-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => selectMention(user)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="mention-user-info">
                <span className="mention-user-name">{user.name}</span>
                <span className="mention-user-email">{user.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
