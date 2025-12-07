import { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAllCategories, getCategoryById } from '../constants/categories';
import MentionInput from './MentionInput';
import './DiscussionForm.css';

const DiscussionForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    discussion: '',
    category: 'technical',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const categories = getAllCategories();

  // Update CSS custom properties when category changes in form
  useEffect(() => {
    const root = document.documentElement;
    const category = getCategoryById(formData.category);
    if (category) {
      root.style.setProperty('--accent-color', category.color);
      // Generate hover color (slightly darker)
      const hoverColor = adjustColorBrightness(category.color, -10);
      root.style.setProperty('--accent-hover', hoverColor);
      // Generate light color (very light tint)
      const lightColor = adjustColorBrightness(category.color, 90);
      root.style.setProperty('--accent-light', lightColor);
    }
  }, [formData.category]);

  // Helper function to adjust color brightness
  const adjustColorBrightness = (hex, percent) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1).toUpperCase();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be signed in to create a discussion');
      }

      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Generate topic from first line of discussion
      const topic = formData.discussion.split('\n')[0].substring(0, 100) || 'Untitled Discussion';

      await addDoc(collection(db, 'discussions'), {
        topic: topic,
        discussion: formData.discussion,
        summary: '', // Empty summary
        category: formData.category,
        tags: tags,
        authorId: user.uid,
        authorName: user.displayName,
        authorEmail: user.email,
        authorPhotoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        commentsCount: 0,
        reactionsCount: 0,
        reactions: {},
        // Wild Ideas specific fields
        ...(formData.category === 'wild_ideas' && {
          ideaStage: 'seed', // seed, worth-exploring, prototype
          wateredBy: [], // user IDs who added to this idea
        })
      });

      setFormData({ discussion: '', category: 'technical', tags: '' });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error adding discussion:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="discussion-form" onSubmit={handleSubmit}>
      <h2>Just Discuss</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="category-buttons">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`category-btn ${formData.category === cat.id ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
            style={{
              backgroundColor: formData.category === cat.id ? cat.color : 'transparent',
              color: formData.category === cat.id ? '#fff' : cat.color,
              borderColor: cat.color
            }}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      <div className="form-group">
        <MentionInput
          value={formData.discussion}
          onChange={(value) => setFormData(prev => ({ ...prev, discussion: value }))}
          placeholder={
            formData.category === 'wild_ideas'
              ? 'Dream big! What if we... (Use @ to mention users)'
              : 'What\'s on your mind? Start typing... (Use @ to mention users)'
          }
          rows={8}
          className="main-textarea"
        />
      </div>

      <div className="form-group">
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="Tags (comma-separated, optional)"
        />
      </div>

      <button type="submit" className="submit-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
};

export default DiscussionForm;
