import { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { getCategoryById, getAllCategories } from '../constants/categories';
import { useNotifications } from '../contexts/NotificationContext';
import MentionInput from './MentionInput';
import MentionText from './MentionText';
import './DiscussionList.css';

const DiscussionList = () => {
  const [discussions, setDiscussions] = useState([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDiscussion, setExpandedDiscussion] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const categories = getAllCategories();
  const { createNotification } = useNotifications();

  // Update CSS custom properties when category changes
  useEffect(() => {
    const root = document.documentElement;
    if (selectedCategory === 'all') {
      // Reset to default teal
      root.style.setProperty('--accent-color', '#1A7F7F');
      root.style.setProperty('--accent-hover', '#156666');
      root.style.setProperty('--accent-light', '#E6F4F4');
    } else {
      const category = getCategoryById(selectedCategory);
      if (category) {
        root.style.setProperty('--accent-color', category.color);
        // Generate hover color (slightly darker)
        const hoverColor = adjustColorBrightness(category.color, -10);
        root.style.setProperty('--accent-hover', hoverColor);
        // Generate light color (very light tint)
        const lightColor = adjustColorBrightness(category.color, 90);
        root.style.setProperty('--accent-light', lightColor);
      }
    }
  }, [selectedCategory]);

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

  useEffect(() => {
    const q = query(
      collection(db, 'discussions'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const discussionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiscussions(discussionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = discussions;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.topic?.toLowerCase().includes(query) ||
        d.discussion?.toLowerCase().includes(query) ||
        d.summary?.toLowerCase().includes(query) ||
        d.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredDiscussions(filtered);
  }, [discussions, selectedCategory, searchQuery]);

  useEffect(() => {
    if (expandedDiscussion) {
      const q = query(
        collection(db, 'discussions', expandedDiscussion, 'comments'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(prev => ({
          ...prev,
          [expandedDiscussion]: commentsData
        }));
      });

      return () => unsubscribe();
    }
  }, [expandedDiscussion]);

  const handleToggleExpand = (discussionId) => {
    if (expandedDiscussion === discussionId) {
      setExpandedDiscussion(null);
    } else {
      setExpandedDiscussion(discussionId);
      setNewComment('');
    }
  };

  const handleAddComment = async (discussionId) => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be signed in to comment');
      }

      await addDoc(collection(db, 'discussions', discussionId, 'comments'), {
        text: newComment,
        authorId: user.uid,
        authorName: user.displayName,
        authorEmail: user.email,
        authorPhotoURL: user.photoURL || '',
        createdAt: serverTimestamp()
      });

      const discussionRef = doc(db, 'discussions', discussionId);
      await updateDoc(discussionRef, {
        commentsCount: increment(1)
      });

      // Send notification to discussion author
      const discussion = discussions.find(d => d.id === discussionId);
      if (discussion && discussion.authorId !== user.uid) {
        await createNotification(discussion.authorId, 'comment', {
          userName: user.displayName,
          discussionId
        });
      }

      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReaction = async (discussionId, emoji) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be signed in to react');
      }

      const discussionRef = doc(db, 'discussions', discussionId);
      const discussion = discussions.find(d => d.id === discussionId);
      const reactions = discussion?.reactions || {};
      const userReactions = reactions[emoji] || [];

      // Toggle reaction
      if (userReactions.includes(user.uid)) {
        // Remove reaction
        await updateDoc(discussionRef, {
          [`reactions.${emoji}`]: userReactions.filter(uid => uid !== user.uid)
        });
      } else {
        // Add reaction
        await updateDoc(discussionRef, {
          [`reactions.${emoji}`]: arrayUnion(user.uid)
        });

        // Send notification to discussion author
        if (discussion && discussion.authorId !== user.uid) {
          await createNotification(discussion.authorId, 'reaction', {
            userName: user.displayName,
            discussionId,
            emoji
          });
        }
      }
    } catch (err) {
      console.error('Error adding reaction:', err);
      alert(err.message);
    }
  };

  const handleWaterIdea = async (discussionId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be signed in to water ideas');
      }

      const discussionRef = doc(db, 'discussions', discussionId);
      await updateDoc(discussionRef, {
        wateredBy: arrayUnion(user.uid)
      });

      // Send notification to discussion author
      const discussion = discussions.find(d => d.id === discussionId);
      if (discussion && discussion.authorId !== user.uid) {
        await createNotification(discussion.authorId, 'water', {
          userName: user.displayName,
          discussionId
        });
      }
    } catch (err) {
      console.error('Error watering idea:', err);
      alert(err.message);
    }
  };

  const handleChangeIdeaStage = async (discussionId, newStage) => {
    try {
      const discussionRef = doc(db, 'discussions', discussionId);
      await updateDoc(discussionRef, {
        ideaStage: newStage
      });
    } catch (err) {
      console.error('Error changing idea stage:', err);
      alert(err.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const getReactionCount = (reactions, emoji) => {
    return reactions?.[emoji]?.length || 0;
  };

  const hasUserReacted = (reactions, emoji, userId) => {
    return reactions?.[emoji]?.includes(userId) || false;
  };

  const REACTION_EMOJIS = ['👍', '❤️', '🎉', '💡', '🚀', '🔥'];

  if (loading) {
    return <div className="loading">Loading discussions...</div>;
  }

  return (
    <div className="discussion-list">
      <div className="discussion-header-section">
        <div className="category-filters">
          <button
            className={`category-filter ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-filter ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                backgroundColor: selectedCategory === cat.id ? cat.color : 'transparent',
                color: selectedCategory === cat.id ? '#fff' : cat.color,
                borderColor: cat.color
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="search-input"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredDiscussions.length === 0 ? (
        <div className="no-discussions">
          <p>{searchQuery || selectedCategory !== 'all'
            ? 'No discussions found matching your filters.'
            : 'No discussions yet. Create the first one above!'}
          </p>
        </div>
      ) : (
        <div className="discussions-container">
          {filteredDiscussions.map((discussion) => {
            const category = getCategoryById(discussion.category);
            const user = auth.currentUser;

            return (
              <div
                key={discussion.id}
                className="discussion-card"
              >
                <div className="discussion-header">
                  <div className="discussion-meta">
                    <div className="category-badge" style={{ backgroundColor: category.color }}>
                      {category.icon} {category.name}
                    </div>
                    <h3>{discussion.topic}</h3>

                    {discussion.tags && discussion.tags.length > 0 && (
                      <div className="tags-container">
                        {discussion.tags.map((tag, idx) => (
                          <span key={idx} className="tag">#{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="author-info">
                      <span className="author-name">{discussion.authorName}</span>
                      <span className="separator">•</span>
                      <span className="timestamp">{formatDate(discussion.createdAt)}</span>
                      {discussion.category === 'wild_ideas' && discussion.ideaStage && (
                        <>
                          <span className="separator">•</span>
                          <span className={`idea-stage stage-${discussion.ideaStage}`}>
                            {discussion.ideaStage === 'seed' && 'Seed'}
                            {discussion.ideaStage === 'worth-exploring' && 'Worth Exploring'}
                            {discussion.ideaStage === 'prototype' && 'Prototype'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    className="expand-btn"
                    onClick={() => handleToggleExpand(discussion.id)}
                  >
                    {expandedDiscussion === discussion.id ? '▲ Hide' : '▼ View'}
                  </button>
                </div>

                {/* Reactions */}
                <div className="reactions-bar">
                  {REACTION_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      className={`reaction-btn ${hasUserReacted(discussion.reactions, emoji, user?.uid) ? 'active' : ''}`}
                      onClick={() => handleReaction(discussion.id, emoji)}
                      title={`React with ${emoji}`}
                    >
                      {emoji} {getReactionCount(discussion.reactions, emoji) || ''}
                    </button>
                  ))}
                  <span className="comments-count">{discussion.commentsCount || 0} comments</span>
                </div>

                {expandedDiscussion === discussion.id && (
                  <div className="discussion-details">
                    <div className="discussion-section">
                      <h4>{discussion.category === 'wild_ideas' ? 'The Wild Idea' : 'Details'}</h4>
                      <p className="discussion-content">
                        <MentionText text={discussion.discussion} />
                      </p>
                    </div>

                    {/* Wild Ideas Lab Special Features */}
                    {discussion.category === 'wild_ideas' && (
                      <div className="wild-ideas-section">
                        <div className="water-idea">
                          <button
                            className="water-btn"
                            onClick={() => handleWaterIdea(discussion.id)}
                            disabled={discussion.wateredBy?.includes(user?.uid)}
                          >
                            {discussion.wateredBy?.includes(user?.uid) ? 'Watered' : 'Water this idea'}
                          </button>
                          <span className="water-count">
                            {discussion.wateredBy?.length || 0} {(discussion.wateredBy?.length || 0) === 1 ? 'person' : 'people'} watered this
                          </span>
                        </div>

                        <div className="idea-stage-selector">
                          <label>Idea Stage:</label>
                          <select
                            value={discussion.ideaStage || 'seed'}
                            onChange={(e) => handleChangeIdeaStage(discussion.id, e.target.value)}
                            className="stage-select"
                          >
                            <option value="seed">Seed</option>
                            <option value="worth-exploring">Worth Exploring</option>
                            <option value="prototype">Let's Prototype</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="comments-section">
                      <h4>Discussion Thread ({discussion.commentsCount || 0})</h4>

                      <div className="comments-list">
                        {comments[discussion.id]?.map((comment) => (
                          <div key={comment.id} className="comment">
                            <div className="comment-header">
                              <span className="comment-author">{comment.authorName}</span>
                              <span className="comment-time">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="comment-text">
                              <MentionText text={comment.text} />
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="add-comment">
                        <MentionInput
                          value={newComment}
                          onChange={setNewComment}
                          placeholder="Add to the discussion... (Use @ to mention users)"
                          rows={3}
                        />
                        <button
                          onClick={() => handleAddComment(discussion.id)}
                          disabled={!newComment.trim() || submittingComment}
                          className="comment-btn"
                        >
                          {submittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiscussionList;
