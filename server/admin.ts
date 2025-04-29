import { Request, Response } from "express";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { db, pool } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Middleware para verificar se o usuário é administrador
export function isAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  if (req.user.username !== "edielopx") {
    return res.status(403).json({ error: "Acesso negado. Apenas o administrador pode acessar esta área." });
  }

  next();
}

// Obter todos os usuários
export async function getUsers(req: Request, res: Response) {
  try {
    // Obter todos os usuários do sistema
    const allUsers = await db.select().from(users);
    
    // Remover campos sensíveis antes de enviar para o cliente
    const sanitizedUsers = allUsers.map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      userType: user.userType,
      profileImage: user.profileImage,
      bio: user.bio,
      location: user.location
    }));
    
    res.status(200).json(sanitizedUsers);
  } catch (error) {
    console.error("Erro ao obter usuários:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Alterar senha de um usuário
export async function changeUserPassword(req: Request, res: Response) {
  try {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      return res.status(400).json({ error: "ID do usuário e nova senha são obrigatórios" });
    }
    
    // Verificar se o usuário existe
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    // Gerar hash da nova senha
    const hashedPassword = await hashPassword(newPassword);
    
    // Atualizar a senha do usuário
    const success = await storage.updatePassword(userId, hashedPassword);
    
    if (!success) {
      return res.status(500).json({ error: "Erro ao atualizar senha" });
    }
    
    // Atualizar a senha em texto plano para fins de desenvolvimento
    try {
      await pool.query(
        'UPDATE dev_passwords SET plaintext_password = $1 WHERE user_id = $2',
        [newPassword, userId]
      );
    } catch (err) {
      console.error('Erro ao atualizar senha em texto puro:', err);
      // Não interrompemos o fluxo por causa de erro na tabela de desenvolvimento
    }
    
    res.status(200).json({ message: "Senha atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Excluir um usuário
export async function deleteUser(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuário inválido" });
    }
    
    // Verificar se o usuário existe
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    // Impedir a exclusão do usuário administrador (edielopx)
    if (user.username === "edielopx") {
      return res.status(403).json({ error: "Não é permitido excluir o usuário administrador" });
    }
    
    // Verificação e exclusão de relacionamentos em cascata
    try {
      // Excluir jobs associados ao usuário
      const deleteJobsResult = await pool.query(
        'DELETE FROM jobs WHERE client_id = $1 RETURNING id',
        [userId]
      );
      const deletedJobIds = deleteJobsResult.rows.map(row => row.id);
      const jobCount = deleteJobsResult.rowCount;
      
      // Excluir propostas para os jobs que foram excluídos
      if (deletedJobIds.length > 0) {
        await pool.query(
          `DELETE FROM proposals WHERE job_id IN (${deletedJobIds.join(',')})`,
        );
      }
      
      // Excluir propostas feitas pelo freelancer
      const deleteProposalsResult = await pool.query(
        'DELETE FROM proposals WHERE freelancer_id = $1',
        [userId]
      );
      const proposalCount = deleteProposalsResult.rowCount;
      
      // Excluir perfis de freelancer associados ao usuário
      const deleteProfilesResult = await pool.query(
        'DELETE FROM freelancer_profiles WHERE user_id = $1 RETURNING id',
        [userId]
      );
      
      const deletedProfileIds = deleteProfilesResult.rows.map(row => row.id);
      const profileCount = deleteProfilesResult.rowCount;
      
      // Excluir serviços associados aos perfis de freelancer
      let deleteServicesResult = { rows: [], rowCount: 0 };
      if (deletedProfileIds.length > 0) {
        deleteServicesResult = await pool.query(
          `DELETE FROM services WHERE freelancer_id IN (${deletedProfileIds.join(',')}) RETURNING id`,
        );
      }
      const deletedServiceIds = deleteServicesResult.rows.map(row => row.id);
      const serviceCount = deleteServicesResult.rowCount;
      
      // Excluir agendamentos associados aos serviços excluídos
      if (deletedServiceIds.length > 0) {
        await pool.query(
          `DELETE FROM appointments WHERE service_id IN (${deletedServiceIds.join(',')})`,
        );
      }
      
      // Já tratamos a exclusão dos perfis freelancer acima
      
      // Excluir registros relacionados na tabela dev_passwords
      await pool.query(
        'DELETE FROM dev_passwords WHERE user_id = $1',
        [userId]
      );
      
      // Excluir mensagens associadas ao usuário
      await pool.query(
        'DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1',
        [userId]
      );
      
      // Excluir avaliações associadas ao usuário
      await pool.query(
        'DELETE FROM reviews WHERE client_id = $1 OR freelancer_id = $1',
        [userId]
      );
      
      // Excluir agendamentos associados ao usuário
      await pool.query(
        'DELETE FROM appointments WHERE client_id = $1',
        [userId]
      );
      
      // Excluir o usuário
      await db.delete(users).where(eq(users.id, userId));
      
      res.status(200).json({ message: "Usuário excluído com sucesso" });
    } catch (err) {
      console.error('Erro ao excluir usuário e dados associados:', err);
      res.status(500).json({ error: "Erro ao excluir usuário e dados associados" });
    }
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Executar consulta SQL personalizada (apenas para admin)
export async function executeSqlQuery(req: Request, res: Response) {
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: "Consulta SQL é obrigatória" });
    }
    
    // Executar consulta SQL
    const result = await pool.query(sql);
    
    res.status(200).json({
      rowCount: result.rowCount,
      rows: result.rows
    });
  } catch (error) {
    console.error("Erro ao executar consulta SQL:", error);
    res.status(500).json({ error: `Erro na consulta SQL: ${error.message}` });
  }
}