import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const client = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fullname, email, password } = req.body;

  // Validação básica
  if (!fullname || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    await client.connect();
    const db    = client.db('snap');        // nome do banco (cria automaticamente)
    const users = db.collection('users');   // nome da coleção

    // Checa se email já existe
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Cria o usuário
    const newUser = {
      fullname,
      email:     email.toLowerCase(),
      password:  hashedPassword,
      createdAt: new Date(),
    };

    await users.insertOne(newUser);

    return res.status(201).json({ message: 'Account created successfully!' });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    await client.close();
  }
}