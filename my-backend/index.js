const express = require('express');
const session = require('express-session');
const Redis = require('ioredis');
const RedisStore = require('connect-redis')(session);
const { Pool } = require('pg');
const argon2 = require('argon2');

const redisClient = new Redis({
  host: 'redis',
  port: 6379,
});

const pool = new Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'mydatabase',
  password: 'password',
  port: 5432,
});

const app = express();
app.use(express.json());

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: 'mysecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 3600000, 
    },
  })
);

const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT id, password, visited FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const hashedPassword = result.rows[0].password;
    const userId = result.rows[0].id;
    const visited = result.rows[0].visited;

    const passwordMatch = await argon2.verify(hashedPassword, password);

    if (passwordMatch) {
      const newVisitedCount = visited + 1;
      await pool.query('UPDATE users SET visited = $1 WHERE id = $2', [newVisitedCount, userId]);

      req.session.userId = userId;
      req.session.visited = newVisitedCount;

      console.log('Session ID:', req.sessionID);

      await pool.query('UPDATE users SET session_id = $1 WHERE id = $2', [req.sessionID, userId]);

      res.json({ message: 'Login successful', username, visited: newVisitedCount });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Error authenticating user:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await argon2.hash(password);
    await pool.query('INSERT INTO users (username, password, visited) VALUES ($1, $2, $3)', [username, hashedPassword, 0]);
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/user', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await pool.query('SELECT username, visited FROM users WHERE id = $1', [userId]);
    let { username, visited } = result.rows[0];

    visited += 1;
    await pool.query('UPDATE users SET visited = $1 WHERE id = $2', [visited, userId]);

    req.session.visited = visited;

    res.json({ username, visited });
  } catch (err) {
    console.error('Error fetching user info:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/logout', isAuthenticated, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).json({ error: 'Failed to logout' });
    } else {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    }
  });
});

app.patch('/api/shopping-list/:id/increase', isAuthenticated, async (req, res) => {
  const itemId = req.params.id;
  const userId = req.session.userId;

  try {
    await pool.query('UPDATE shopping_list SET quantity = quantity + 1 WHERE id = $1 AND user_id = $2', [itemId, userId]);
    res.status(200).json({ message: 'Quantity increased successfully' });
  } catch (err) {
    console.error('Error increasing quantity:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/api/shopping-list/:id/decrease', isAuthenticated, async (req, res) => {
  const itemId = req.params.id;
  const userId = req.session.userId;

  try {
    const result = await pool.query('SELECT quantity FROM shopping_list WHERE id = $1 AND user_id = $2', [itemId, userId]);
    const currentQuantity = result.rows[0]?.quantity;

    if (currentQuantity > 1) {
      await pool.query('UPDATE shopping_list SET quantity = quantity - 1 WHERE id = $1 AND user_id = $2', [itemId, userId]);
      res.status(200).json({ message: 'Quantity decreased successfully' });
    } else {
      await pool.query('DELETE FROM shopping_list WHERE id = $1 AND user_id = $2', [itemId, userId]);
      res.status(200).json({ message: 'Item deleted from shopping list successfully' });
    }
  } catch (err) {
    console.error('Error decreasing quantity or deleting item:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/shopping-list', isAuthenticated, async (req, res) => {
  const { item, quantity } = req.body;
  const userId = req.session.userId;

  try {
    const result = await pool.query(
      'INSERT INTO shopping_list (user_id, item, quantity) VALUES ($1, $2, $3) RETURNING *',
      [userId, item, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding item to shopping list:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/shopping-list', isAuthenticated, async (req, res) => {
  const userId = req.session.userId;

  try {
    const result = await pool.query('SELECT id, item, quantity FROM shopping_list WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching shopping list items:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/shopping-list/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    await pool.query('UPDATE shopping_list SET quantity = $1 WHERE id = $2', [quantity, id]);
    res.json({ message: 'Quantity updated successfully' });
  } catch (err) {
    console.error('Error updating quantity:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/shopping-list/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM shopping_list WHERE id = $1', [id]);
    res.json({ message: 'Item deleted from shopping list successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
