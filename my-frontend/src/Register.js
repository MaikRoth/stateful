import React, { useState } from 'react';

const Register = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        alert('Registration successful. Please login.');
        setUsername('');
        setPassword('');
        onRegister(); // Notify parent component of successful registration
      } else {
        alert('Registration failed. Please try again.'); // Check server-side logs for more info
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert('Error registering. Please try again.');
    }
  };
  
  return (
    <form className='sheesh' onSubmit={handleRegister}>
      <h2>Register</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Register</button>
    </form>
  );
};

export default Register;
