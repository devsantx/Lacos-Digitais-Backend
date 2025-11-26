const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AnonymousUser = require("../models/AnonymousUser");

class AuthController {
  async register(req, res) {
    try {
      if (!AnonymousUser) {
        return res.status(503).json({
          success: false,
          error: "Banco de dados não configurado",
        });
      }

      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Username e senha são obrigatórios",
        });
      }

      if (username.length < 3 || username.length > 50) {
        return res.status(400).json({
          success: false,
          error: "Username deve ter entre 3 e 50 caracteres",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Senha deve ter no mínimo 6 caracteres",
        });
      }

      const existingUser = await AnonymousUser.findOne({
        where: { username },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "Username já está em uso",
        });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const user = await AnonymousUser.create({
        username,
        password_hash,
      });

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          type: "anonymous",
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso",
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      console.error("❌ Erro no registro:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao criar conta",
      });
    }
  }

  async login(req, res) {
    try {
      if (!AnonymousUser) {
        return res.status(503).json({
          success: false,
          error: "Banco de dados não configurado",
        });
      }

      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Username e senha são obrigatórios",
        });
      }

      const user = await AnonymousUser.findOne({
        where: { username },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Credenciais inválidas",
        });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: "Credenciais inválidas",
        });
      }

      await user.update({ last_login: new Date() });

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          type: "anonymous",
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.json({
        success: true,
        message: "Login realizado com sucesso",
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error) {
      console.error("❌ Erro no login:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao fazer login",
      });
    }
  }

  async verifyToken(req, res) {
    try {
      res.json({
        success: true,
        user: {
          id: req.userId,
          username: req.username,
          type: req.userType,
        },
      });
    } catch (error) {
      console.error("❌ Erro ao verificar token:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao verificar token",
      });
    }
  }
}

module.exports = new AuthController();
