import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import './LogHistory.css';

const LogHistory = ({ refreshTrigger }) => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const q = query(
          collection(db, 'dailyLogs'),
          where('userId', '==', currentUser.uid),
          orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const logsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setLogs(logsData);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Failed to load logs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentUser, refreshTrigger]);

  if (loading) {
    return <div className="loading">Loading your logs...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="no-logs">
        <p>No logs yet. Create your first daily log above!</p>
      </div>
    );
  }

  return (
    <div className="log-history">
      <h2>Your Daily Logs</h2>
      <div className="logs-list">
        {logs.map(log => (
          <div key={log.id} className="log-card">
            <div className="log-header">
              <h3>{log.date}</h3>
              {log.timeSpent && (
                <span className="time-badge">{log.timeSpent}</span>
              )}
            </div>

            <div className="log-section">
              <h4>Tasks Completed</h4>
              <p>{log.tasksCompleted}</p>
            </div>

            {log.blockers && (
              <div className="log-section">
                <h4>Blockers</h4>
                <p>{log.blockers}</p>
              </div>
            )}

            {log.plansForTomorrow && (
              <div className="log-section">
                <h4>Plans for Tomorrow</h4>
                <p>{log.plansForTomorrow}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogHistory;
