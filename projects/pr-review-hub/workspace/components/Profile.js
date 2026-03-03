import React, { useState } from 'react';
import useFetchUser from '../hooks/useFetchUser';

const Profile = () => {
  const [user, setUser] = useState(null);

  useFetchUser(user).then(response => setUser(response));

  return (
    <div>
      {user ? (
        <h1>{user.name}</h1>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Profile;
