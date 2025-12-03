import { useState } from 'react';
import { db, auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './DiscussionForm.css';

const DiscussionForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    topic: '',
    discussion: '',
    summary: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

      await addDoc(collection(db, 'discussions'), {
        topic: formData.topic,
        discussion: formData.discussion,
        summary: formData.summary,
        authorId: user.uid,
        authorName: user.displayName,
        authorEmail: user.email,
        createdAt: serverTimestamp(),
        commentsCount: 0
      });

      setFormData({ topic: '', discussion: '', summary: '' });
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
      <h2>New Discussion</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="topic">Motive (one liner)</label>
        <input
          type="text"
          id="topic"
          name="topic"
          value={formData.topic}
          onChange={handleChange}
          required
          placeholder="What was discussed?"
        />
      </div>

      <div className="form-group">
        <label htmlFor="discussion">Brain storm</label>
        <textarea
          id="discussion"
          name="discussion"
          value={formData.discussion}
          onChange={handleChange}
          required
          rows="6"
          placeholder="Describe the discussion, meeting, or conversation..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="summary">In short</label>
        <textarea
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          required
          rows="5"
          placeholder="• Key point 1&#10;• Key point 2&#10;• Key point 3"
        />
      </div>

      <button type="submit" className="submit-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Posting...' : 'Post Discussion'}
      </button>
    </form>
  );
};

export default DiscussionForm;
