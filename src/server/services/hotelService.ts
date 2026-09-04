/**
 * Hotel Service
 * Cached catalog queries, room rate calculation, and partner inventory management
 */

import { Hotel, SearchFilters } from '../../types';
import { hotelRepository } from '../repositories/hotelRepository';

export class HotelService {
  public async searchHotels(filters: SearchFilters): Promise<{ hotels: Hotel[]; totalCount: number }> {
    return hotelRepository.search(filters);
  }

  public async getHotelById(id: string): Promise<Hotel | null> {
    return hotelRepository.findById(id);
  }

  public async getAllHotels(): Promise<Hotel[]> {
    return hotelRepository.findAll();
  }

  public async updatePartnerHotel(hotelId: string, updates: Partial<Hotel>): Promise<Hotel | null> {
    return hotelRepository.update(hotelId, updates);
  }
}

export const hotelService = new HotelService();
