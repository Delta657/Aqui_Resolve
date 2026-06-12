import { Request, Response } from 'express';
import { ProviderLocationService } from '../services/ProviderLocationService';

export class ProviderLocationController {
  private providerLocationService: ProviderLocationService;

  constructor() {
    this.providerLocationService = new ProviderLocationService();
  }

  async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      if (!providerId) { res.status(400).json({ success: false, message: 'ID do prestador obrigatório' }); return; }

      const lat = Number(req.body.latitude);
      const lng = Number(req.body.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        res.status(400).json({ success: false, message: 'Latitude e longitude obrigatórios e válidos' });
        return;
      }

      await this.providerLocationService.updateProviderLocation(providerId, { ...req.body, latitude: lat, longitude: lng });
      res.json({ success: true, message: 'Localização atualizada com sucesso' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getProviderLocation(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      if (!providerId) { res.status(400).json({ success: false, message: 'ID do prestador obrigatório' }); return; }

      const location = await this.providerLocationService.getProviderLocation(providerId);
      if (!location) { res.status(404).json({ success: false, message: 'Prestador não encontrado' }); return; }

      res.json({ success: true, data: location });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAllProviderLocations(_req: Request, res: Response): Promise<void> {
    try {
      const locations = await this.providerLocationService.getAllProviderLocations();
      res.json({ success: true, data: locations });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateProviderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { providerId } = req.params;
      const { status } = req.body;
      if (!providerId) { res.status(400).json({ success: false, message: 'ID do prestador obrigatório' }); return; }
      if (!status || !['online', 'offline', 'busy', 'available'].includes(status)) {
        res.status(400).json({ success: false, message: 'Status válido obrigatório' });
        return;
      }
      await this.providerLocationService.updateProviderLocation(providerId, { status });
      res.json({ success: true, message: 'Status atualizado com sucesso' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
