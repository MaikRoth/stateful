import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import Register from './Register';
import MainContent from './MainContent';
function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [visited, setVisited] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
          setVisited(data.visited);
          setLoggedIn(true);
        } else {
          setLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (username, visited) => {
    setLoggedIn(true);
    setUsername(username);
    setVisited(visited);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setLoggedIn(false);
        setUsername('');
        setVisited(0);
      } else {
        console.error('Failed to logout');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleRegister = () => {
    setLoggedIn(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Stateful Application</h1>
        {loggedIn ? (
          <div>
            <p>Hello, {username}! You have visited {visited} times.</p>
            <button onClick={handleLogout}>Logout</button>
            <MainContent />
          </div>
        ) : (
          <>
            <Login onLogin={handleLogin} />
            <Register onRegister={handleRegister} />
          </>
        )}
      </header>
    </div>
  );
}

export default App;
