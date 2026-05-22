import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const client = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    await client.connect();
    const db    = client.db('snap');
    const users = db.collection('users');

    // Busca o usuário pelo email
    const user = await users.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Mensagem genérica por segurança (não revela se email existe)
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compara a senha com o hash salvo
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Gera JWT válido por 7 dias
    const token = jwt.sign(
      {
        userId:   user._id,
        email:    user.email,
        fullname: user.fullname,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message:  'Signed in successfully!',
      token,
      user: {
        fullname: user.fullname,
        email:    user.email,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    await client.close();
  }
}