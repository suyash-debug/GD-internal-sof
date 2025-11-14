import { useState } from 'react';
import DailyLogForm from '../components/DailyLogForm';
import LogHistory from '../components/LogHistory';
import './DailyLogs.css';

const DailyLogs = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLogSuccess = () => {
    // Trigger refresh of log history
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="daily-logs-page">
      <h1>Daily Work Logs</h1>
      <p className="page-description">
        Track your daily work activities, accomplishments, and plans.
      </p>

      <DailyLogForm onSuccess={handleLogSuccess} />
      <LogHistory refreshTrigger={refreshTrigger} />
    </div>
  );
};

export default DailyLogs;
