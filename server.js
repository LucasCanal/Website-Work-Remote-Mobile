const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// ── CONFIGURAÇÕES INICIAIS OBRIGATÓRIAS ──
app.use(cors());
app.use(express.json()); // Processa JSON antes de qualquer outra coisa

const uri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
let db;

// Conecta ao MongoDB Atlas
MongoClient.connect(uri)
  .then(client => {
    db = client.db('snap'); 
    console.log('✅ Conectado ao MongoDB com sucesso!');
  })
  .catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// =============================================
// ROTA DE CADASTRO (Mapeada para /api/register)
// =============================================
app.post('/api/register', async (req, res) => {
  try {
    // 🔍 LOG 1: Verificar exatamente o que chegou do front-end
    console.log('📥 [BACKEND] Dados recebidos no corpo da requisição:', req.body);

    const { fullname, email, password } = req.body;

    // Verificar se algum campo veio indefinido ou vazio
    if (!fullname || !email || !password) {
      console.log('❌ [BACKEND] Erro 400: Algum campo obrigatório veio vazio ou undefined.');
      console.log(`   👉 fullname: ${fullname ? 'Preenchido' : 'VAZIO!'}`);
      console.log(`   👉 email: ${email ? 'Preenchido' : 'VAZIO!'}`);
      console.log(`   👉 password: ${password ? 'Preenchido' : 'VAZIO!'}`);
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Verificar validação de tamanho de senha
    if (password.length < 8) {
      console.log(`❌ [BACKEND] Erro 400: Senha muito curta. Recebido apenas ${password.length} caracteres.`);
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Verificar se a conexão com o MongoDB já estava estabelecida
    if (!db) {
      console.log('❌ [BACKEND] Erro 500: A conexão com o banco de dados ainda não foi concluída.');
      return res.status(500).json({ error: 'Database connection not ready.' });
    }

    const usersCollection = db.collection('users');
    const existing = await usersCollection.findOne({ email: email.toLowerCase() });
    
    if (existing) {
      console.log('❌ [BACKEND] Erro 409: E-mail já cadastrado no banco:', email);
      return res.status(409).json({ error: 'Email already registered.' });
    }

    console.log('🔐 [BACKEND] Criptografando senha com bcrypt...');
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
      fullname,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
    };

    console.log('💾 [BACKEND] Inserindo documento no MongoDB Atlas...');
    await usersCollection.insertOne(newUser);
    
    console.log('✅ [BACKEND] Usuário cadastrado com absoluto sucesso!');
    return res.status(201).json({ message: 'Account created successfully!' });

  } catch (error) {
    console.error('💥 [BACKEND] Erro interno catastrófico no registro:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// =============================================
// ROTA DE LOGIN (Mapeada para /api/login)
// =============================================
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Gera o token JWT para manter o usuário logado por 7 dias
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        fullname: user.fullname,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Signed in successfully!',
      token,
      user: {
        fullname: user.fullname,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// =============================================
// 📂 ARQUIVOS ESTÁTICOS (DEIXAR SEMPRE NO FINAL)
// =============================================
// Serve o HTML, CSS e JS da pasta após verificar que a requisição não era uma rota de API
app.use(express.static(__dirname));

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));