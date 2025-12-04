import { Company, Work } from '../types';

// Sabit API ayarları
const SERVER_URL = 'https://ejderbeyazdavar.com/mobile-api';
const API_KEY = 'O52E7jC7RyuCEjtkKw19KYW7YHTVvhBc';

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: {
    companies: Company[];
    works: Work[];
  };
}

class SyncService {
  /**
   * Sunucudan tüm verileri çeker
   */
  async fetchData(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${SERVER_URL}/api.php?action=download&api_key=${API_KEY}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        return {
          success: true,
          message: 'Veriler başarıyla yüklendi',
          data: {
            companies: result.data.companies || [],
            works: result.data.works || [],
          },
        };
      } else {
        return {
          success: false,
          message: result.message || 'Veri yükleme başarısız',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Bağlantı hatası: ${error.message}`,
      };
    }
  }

  /**
   * Sunucuya tüm verileri kaydeder
   */
  async saveData(companies: Company[], works: Work[]): Promise<ApiResponse> {
    try {
      const response = await fetch(`${SERVER_URL}/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'upload',
          api_key: API_KEY,
          companies,
          works,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          message: 'Veriler başarıyla kaydedildi',
          data: result.data || { companies, works },
        };
      } else {
        return {
          success: false,
          message: result.message || 'Kaydetme başarısız',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Bağlantı hatası: ${error.message}`,
      };
    }
  }
}

export const syncService = new SyncService();

