import { managerService } from './services.js';

export const managersController = {
  async getForShop(shopId) {
    return managerService.getByShop(shopId);
  }
};
