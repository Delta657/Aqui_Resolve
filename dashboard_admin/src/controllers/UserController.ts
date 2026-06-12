import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) { res.status(400).json({ success: false, message: 'ID obrigatório' }); return; }

      const user = await this.userService.getUserById(id);
      if (!user) { res.status(404).json({ success: false, message: 'Usuário não encontrado' }); return; }

      res.json({ success: true, data: user });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const userType = req.query['userType'] as string | undefined;
      const isActive = req.query['isActive'] as string | undefined;
      const limitCount = parseInt(req.query['limit'] as string) || 100;

      const result = await this.userService.getUsers({
        userType,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        limitCount,
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) { res.status(400).json({ success: false, message: 'ID obrigatório' }); return; }

      await this.userService.updateUser(id, req.body);
      res.json({ success: true, message: 'Usuário atualizado com sucesso' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) { res.status(400).json({ success: false, message: 'ID obrigatório' }); return; }

      await this.userService.toggleUserStatus(id);
      res.json({ success: true, message: 'Status alterado com sucesso' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
