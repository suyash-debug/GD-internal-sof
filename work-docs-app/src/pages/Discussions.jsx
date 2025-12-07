import { useState } from 'react';
import DiscussionForm from '../components/DiscussionForm';
import DiscussionList from '../components/DiscussionList';
import './Discussions.css';

const Discussions = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="discussions-page">
      <DiscussionForm onSuccess={handleSuccess} />
      <DiscussionList key={refreshKey} />
    </div>
  );
};

export default Discussions;
