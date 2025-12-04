import AsyncStorage from '@react-native-async-storage/async-storage';
import { Company, Work } from '../types';

const QUEUE_KEY = '@pending_operations';
const CACHE_KEY = '@cached_data';

export interface PendingOperation {
  id: string;
  timestamp: number;
  type: 'save';
  data: {
    companies: Company[];
    works: Work[];
  };
}

class OfflineQueue {
  /**
   * Queue'ya yeni bir işlem ekle
   */
  async addOperation(companies: Company[], works: Work[]): Promise<void> {
    try {
      const operation: PendingOperation = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        type: 'save',
        data: { companies, works },
      };

      const queue = await this.getQueue();
      
      // Son işlemi değiştir (her zaman son state'i tutmalıyız)
      // Queue'da sadece 1 işlem olmalı - en son state
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([operation]));
    } catch (error) {
      console.error('Queue\'ya ekleme hatası:', error);
    }
  }

  /**
   * Queue'daki tüm işlemleri getir
   */
  async getQueue(): Promise<PendingOperation[]> {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      if (!queueData) return [];
      return JSON.parse(queueData);
    } catch (error) {
      console.error('Queue okuma hatası:', error);
      return [];
    }
  }

  /**
   * Queue'yu temizle
   */
  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
    } catch (error) {
      console.error('Queue temizleme hatası:', error);
    }
  }

  /**
   * Queue'da bekleyen işlem var mı?
   */
  async hasPendingOperations(): Promise<boolean> {
    const queue = await this.getQueue();
    return queue.length > 0;
  }

  /**
   * En son pending state'i getir
   */
  async getLatestPendingState(): Promise<{ companies: Company[]; works: Work[] } | null> {
    const queue = await this.getQueue();
    if (queue.length === 0) return null;
    
    // En son eklenen işlemi al
    const latestOperation = queue[queue.length - 1];
    return latestOperation.data;
  }

  /**
   * Sunucudan gelen verileri cache'le (offline erişim için)
   */
  async cacheServerData(companies: Company[], works: Work[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        companies,
        works,
        cachedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Cache yazma hatası:', error);
    }
  }

  /**
   * Cache'lenmiş verileri getir
   */
  async getCachedData(): Promise<{ companies: Company[]; works: Work[] } | null> {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_KEY);
      if (!cacheData) return null;
      
      const parsed = JSON.parse(cacheData);
      return {
        companies: parsed.companies || [],
        works: parsed.works || [],
      };
    } catch (error) {
      console.error('Cache okuma hatası:', error);
      return null;
    }
  }

  /**
   * Cache'i temizle
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Cache temizleme hatası:', error);
    }
  }
}

export const offlineQueue = new OfflineQueue();

