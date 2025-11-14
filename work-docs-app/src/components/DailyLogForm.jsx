import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import './DailyLogForm.css';

const DailyLogForm = ({ onSuccess }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    tasksCompleted: '',
    timeSpent: '',
    blockers: '',
    plansForTomorrow: ''
  });
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, 'dailyLogs'), {
        ...formData,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        createdAt: serverTimestamp()
      });

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        tasksCompleted: '',
        timeSpent: '',
        blockers: '',
        plansForTomorrow: ''
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error adding daily log:', err);
      setError('Failed to save daily log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="daily-log-form">
      <h2>Add Daily Log</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="date">Date *</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="tasksCompleted">Tasks Completed *</label>
        <textarea
          id="tasksCompleted"
          name="tasksCompleted"
          value={formData.tasksCompleted}
          onChange={handleChange}
          placeholder="What did you accomplish today?"
          rows={4}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="timeSpent">Time Spent</label>
        <input
          type="text"
          id="timeSpent"
          name="timeSpent"
          value={formData.timeSpent}
          onChange={handleChange}
          placeholder="e.g., 8 hours, 6h 30m"
        />
      </div>

      <div className="form-group">
        <label htmlFor="blockers">Blockers / Issues</label>
        <textarea
          id="blockers"
          name="blockers"
          value={formData.blockers}
          onChange={handleChange}
          placeholder="Any obstacles or issues you encountered?"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="plansForTomorrow">Plans for Tomorrow</label>
        <textarea
          id="plansForTomorrow"
          name="plansForTomorrow"
          value={formData.plansForTomorrow}
          onChange={handleChange}
          placeholder="What are you planning to work on tomorrow?"
          rows={3}
        />
      </div>

      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? 'Saving...' : 'Save Daily Log'}
      </button>
    </form>
  );
};

export default DailyLogForm;
