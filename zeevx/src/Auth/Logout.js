import { useEffect, useState } from 'react';
import { auth } from './Firebase.js'; 
import { useNavigate } from 'react-router-dom';

const YourComponent = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut(); // Assuming auth is your authentication instance
      console.log('User has been logged out.');

      navigate('/login'); 
    } catch (error) {
      console.error('Error during logout:', error.message);
    }
  };

  return (
    <div>
      {user ? (
        // User is logged in, show the logout button
        <button onClick={handleLogout}>Logout</button>
      ) : (
        // User is not logged in, you can show a login button or other components
        <p>Please log in</p>
      )}
    </div>
  );
};

export default YourComponent;
