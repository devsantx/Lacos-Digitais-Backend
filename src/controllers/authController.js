// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { AnonymousUser } = require("../models");

class AuthController {
  async register(req, res) {
    try {
      const { username, password } = req.body;

      // Validação
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

      // Verificar se usuário já existe
      const existingUser = await AnonymousUser.findOne({
        where: { username },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "Username já está em uso",
        });
      }

      // Hash da senha
      const password_hash = await bcrypt.hash(password, 10);

      // Criar usuário
      const user = await AnonymousUser.create({
        username,
        password_hash,
      });

      // Gerar token JWT
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
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error("❌ Erro no registro:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao criar conta",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Username e senha são obrigatórios",
        });
      }

      // Buscar usuário
      const user = await AnonymousUser.findOne({
        where: { username },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Credenciais inválidas",
        });
      }

      // Verificar senha
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: "Credenciais inválidas",
        });
      }

      // Atualizar último login
      await user.update({ last_login: new Date() });

      // Gerar token JWT
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
          lastLogin: user.last_login,
        },
      });
    } catch (error) {
      console.error("❌ Erro no login:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao fazer login",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  async verifyToken(req, res) {
    try {
      // Buscar usuário atualizado
      const user = await AnonymousUser.findByPk(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuário não encontrado",
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
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

  async getProfile(req, res) {
    try {
      const user = await AnonymousUser.findByPk(req.userId, {
        attributes: ["id", "username", "created_at", "last_login", "is_active"],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Usuário não encontrado",
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.created_at,
          lastLogin: user.last_login,
          isActive: user.is_active,
        },
      });
    } catch (error) {
      console.error("❌ Erro ao buscar perfil:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar perfil",
      });
    }
  }
}

module.exports = new AuthController();
