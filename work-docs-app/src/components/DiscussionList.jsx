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
  increment
} from 'firebase/firestore';
import './DiscussionList.css';

const DiscussionList = () => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDiscussion, setExpandedDiscussion] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

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
        createdAt: serverTimestamp()
      });

      // Update comments count
      const discussionRef = doc(db, 'discussions', discussionId);
      await updateDoc(discussionRef, {
        commentsCount: increment(1)
      });

      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert(err.message);
    } finally {
      setSubmittingComment(false);
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

  if (loading) {
    return <div className="loading">Loading discussions...</div>;
  }

  if (discussions.length === 0) {
    return (
      <div className="no-discussions">
        <p>No discussions yet. Create the first one above!</p>
      </div>
    );
  }

  return (
    <div className="discussion-list">
      <h2>Recent Discussions</h2>
      <div className="discussions-container">
        {discussions.map((discussion) => (
          <div key={discussion.id} className="discussion-card">
            <div className="discussion-header">
              <div className="discussion-meta">
                <h3>{discussion.topic}</h3>
                <div className="author-info">
                  <span className="author-name">{discussion.authorName}</span>
                  <span className="separator">•</span>
                  <span className="timestamp">{formatDate(discussion.createdAt)}</span>
                </div>
              </div>
              <button
                className="expand-btn"
                onClick={() => handleToggleExpand(discussion.id)}
              >
                {expandedDiscussion === discussion.id ? 'Hide Details' : 'View Details'}
              </button>
            </div>

            {expandedDiscussion === discussion.id && (
              <div className="discussion-details">
                <div className="discussion-section">
                  <h4>Brain Storm</h4>
                  <p>{discussion.discussion}</p>
                </div>

                <div className="discussion-section">
                  <h4>In Short</h4>
                  <p className="summary">{discussion.summary}</p>
                </div>

                <div className="comments-section">
                  <h4>Comments ({discussion.commentsCount || 0})</h4>

                  <div className="comments-list">
                    {comments[discussion.id]?.map((comment) => (
                      <div key={comment.id} className="comment">
                        <div className="comment-header">
                          <span className="comment-author">{comment.authorName}</span>
                          <span className="comment-time">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="comment-text">{comment.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="add-comment">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows="3"
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
        ))}
      </div>
    </div>
  );
};

export default DiscussionList;
