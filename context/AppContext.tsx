import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company, Work } from '../types';
import { syncService } from '../services/syncService';
import { offlineQueue } from '../services/offlineQueue';

interface AppContextType {
  companies: Company[];
  works: Work[];
  allWorks: Work[]; // Tüm işler (silinenler dahil)
  loading: boolean;
  isOffline: boolean;
  hasPendingChanges: boolean;
  addCompany: (name: string) => Promise<{ success: boolean; message: string }>;
  updateCompany: (id: string, name: string) => Promise<{ success: boolean; message: string }>;
  addWork: (work: Omit<Work, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string }>;
  updateWork: (workId: string, updates: Partial<Work>) => Promise<{ success: boolean; message: string }>;
  deleteCompany: (id: string) => Promise<{ success: boolean; message: string }>;
  deleteWork: (id: string) => Promise<{ success: boolean; message: string }>;
  refreshData: () => Promise<{ success: boolean; message: string }>;
  syncPendingChanges: () => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  useEffect(() => {
    // Uygulama açılışında verileri yükle
    initializeApp();
  }, []);

  useEffect(() => {
    // Periyodik auto-sync (her 30 saniyede bir)
    if (!hasPendingChanges) return;

    const intervalId = setInterval(async () => {
      if (hasPendingChanges && !loading) {
        console.log('🔄 Auto-sync deneniyor...');
        await syncPendingChanges();
      }
    }, 30000); // 30 saniye

    return () => clearInterval(intervalId);
  }, [hasPendingChanges, loading]);

  const initializeApp = async () => {
    // 1. Önce cache'den yükle (hızlı başlangıç)
    const cachedData = await offlineQueue.getCachedData();
    if (cachedData) {
      setCompanies(cachedData.companies);
      setWorks(cachedData.works);
    }

    // 2. Pending changes var mı kontrol et
    const hasPending = await offlineQueue.hasPendingOperations();
    setHasPendingChanges(hasPending);

    if (hasPending) {
      // Pending changes varsa, onları yükle (cache'den daha güncel)
      const pendingState = await offlineQueue.getLatestPendingState();
      if (pendingState) {
        setCompanies(pendingState.companies);
        setWorks(pendingState.works);
      }
      
      // Sonra senkronize etmeyi dene
      await syncPendingChanges();
    } else {
      // 3. Pending changes yoksa sunucudan güncellemeyi dene
      await loadDataFromServer();
    }
  };

  /**
   * Sunucudan tüm verileri yükler
   */
  const loadDataFromServer = async () => {
    setLoading(true);
    try {
      const result = await syncService.fetchData();
      if (result.success && result.data) {
        // Geriye dönük uyumluluk: updatedAt yoksa createdAt kullan
        const companiesWithUpdatedAt = result.data.companies.map(c => ({
          ...c,
          updatedAt: c.updatedAt || c.createdAt,
        }));
        const worksWithUpdatedAt = result.data.works.map(w => ({
          ...w,
          updatedAt: w.updatedAt || w.createdAt,
        }));
        
        setCompanies(companiesWithUpdatedAt);
        setWorks(worksWithUpdatedAt);
        setIsOffline(false);
        
        // Sunucudan gelen verileri cache'le (offline erişim için)
        await offlineQueue.cacheServerData(companiesWithUpdatedAt, worksWithUpdatedAt);
      } else {
        // Sunucu hatası
        setIsOffline(true);
      }
    } catch (error) {
      // Network hatası
      console.error('Veri yükleme hatası:', error);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sunucuya tüm verileri kaydeder (offline mode destekli)
   */
  const saveDataToServer = async (
    newCompanies: Company[],
    newWorks: Work[]
  ): Promise<{ success: boolean; message: string }> => {
    // Önce local state'i güncelle (hızlı UI response)
    setCompanies(newCompanies);
    setWorks(newWorks);

    setLoading(true);
    try {
      const result = await syncService.saveData(newCompanies, newWorks);
      if (result.success) {
        // Sunucu kaydetme başarılı, offline mode'dan çık
        setIsOffline(false);
        setHasPendingChanges(false);
        await offlineQueue.clearQueue();
        return { success: true, message: result.message };
      } else {
        // Sunucu hatası - offline mode'a geç
        setIsOffline(true);
        setHasPendingChanges(true);
        await offlineQueue.addOperation(newCompanies, newWorks);
        return { 
          success: true, // UI için success (local'de kaydedildi)
          message: 'İnternet yok - değişiklikler kaydedildi, internet olunca senkronize edilecek' 
        };
      }
    } catch (error: any) {
      // Ağ hatası - offline mode'a geç
      setIsOffline(true);
      setHasPendingChanges(true);
      await offlineQueue.addOperation(newCompanies, newWorks);
      return { 
        success: true, // UI için success (local'de kaydedildi)
        message: 'İnternet yok - değişiklikler kaydedildi, internet olunca senkronize edilecek' 
      };
    } finally {
      setLoading(false);
    }
  };

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addCompany = async (name: string): Promise<{ success: boolean; message: string }> => {
    const now = new Date().toISOString();
    const newCompany: Company = {
      id: generateId(),
      name,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
    const updatedCompanies = [...companies, newCompany];
    return await saveDataToServer(updatedCompanies, works);
  };

  const updateCompany = async (id: string, name: string): Promise<{ success: boolean; message: string }> => {
    const now = new Date().toISOString();
    const updatedCompanies = companies.map(c =>
      c.id === id ? { ...c, name, updatedAt: now } : c
    );
    return await saveDataToServer(updatedCompanies, works);
  };

  const deleteCompany = async (id: string): Promise<{ success: boolean; message: string }> => {
    const now = new Date().toISOString();
    // Firmayı sil ve ilişkili işleri de sil, updatedAt güncelle
    const updatedCompanies = companies.map(c =>
      c.id === id ? { ...c, isDeleted: true, updatedAt: now } : c
    );
    const updatedWorks = works.map(w =>
      w.companyId === id ? { ...w, isDeleted: true, updatedAt: now } : w
    );
    return await saveDataToServer(updatedCompanies, updatedWorks);
  };

  const addWork = async (workData: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; message: string }> => {
    const now = new Date().toISOString();
    const newWork: Work = {
      ...workData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
    const updatedWorks = [...works, newWork];
    return await saveDataToServer(companies, updatedWorks);
  };

  const updateWork = async (workId: string, updates: Partial<Work>): Promise<{ success: boolean; message: string }> => {
    const now = new Date().toISOString();
    const updatedWorks = works.map(w =>
      w.id === workId ? { ...w, ...updates, updatedAt: now } : w
    );
    return await saveDataToServer(companies, updatedWorks);
  };

  const deleteWork = async (id: string): Promise<{ success: boolean; message: string }> => {
    // İşi gerçekten silme, sadece isDeleted olarak işaretle
    const now = new Date().toISOString();
    const updatedWorks = works.map(w =>
      w.id === id ? { ...w, isDeleted: true, updatedAt: now } : w
    );
    return await saveDataToServer(companies, updatedWorks);
  };

  const refreshData = async (): Promise<{ success: boolean; message: string }> => {
    // Önce pending changes'i senkronize et
    if (hasPendingChanges) {
      await syncPendingChanges();
    }

    setLoading(true);
    try {
      const result = await syncService.fetchData();
      if (result.success && result.data) {
        setCompanies(result.data.companies);
        setWorks(result.data.works);
        setIsOffline(false);
        
        // Cache'i güncelle
        await offlineQueue.cacheServerData(result.data.companies, result.data.works);
        
        return { success: true, message: 'Veriler başarıyla yenilendi' };
      } else {
        setIsOffline(true);
        return { success: false, message: result.message };
      }
    } catch (error: any) {
      setIsOffline(true);
      return { success: false, message: error.message || 'Yenileme hatası' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Bekleyen değişiklikleri sunucuya senkronize et
   */
  const syncPendingChanges = async (): Promise<{ success: boolean; message: string }> => {
    const hasPending = await offlineQueue.hasPendingOperations();
    if (!hasPending) {
      return { success: true, message: 'Bekleyen değişiklik yok' };
    }

    const pendingState = await offlineQueue.getLatestPendingState();
    if (!pendingState) {
      return { success: false, message: 'Pending state bulunamadı' };
    }

    setLoading(true);
    try {
      const result = await syncService.saveData(pendingState.companies, pendingState.works);
      if (result.success) {
        // Senkronizasyon başarılı
        setIsOffline(false);
        setHasPendingChanges(false);
        await offlineQueue.clearQueue();
        
        // Sunucudan güncel verileri çek
        const freshData = await syncService.fetchData();
        if (freshData.success && freshData.data) {
          setCompanies(freshData.data.companies);
          setWorks(freshData.data.works);
          
          // Cache'i güncelle
          await offlineQueue.cacheServerData(freshData.data.companies, freshData.data.works);
        }
        
        return { success: true, message: 'Değişiklikler senkronize edildi' };
      } else {
        setIsOffline(true);
        return { success: false, message: 'Senkronizasyon başarısız: ' + result.message };
      }
    } catch (error: any) {
      setIsOffline(true);
      return { success: false, message: 'Senkronizasyon hatası: ' + error.message };
    } finally {
      setLoading(false);
    }
  };

  // Aktif işleri filtrele (silinmemiş olanlar)
  const activeWorks = works.filter(w => !w.isDeleted);
  // Aktif firmaları filtrele (silinmemiş olanlar)
  const activeCompanies = companies.filter(c => !c.isDeleted);

  return (
    <AppContext.Provider
      value={{
        companies: activeCompanies, // Sadece aktif firmaları göster (UI için)
        works: activeWorks, // Sadece aktif işleri göster (UI için)
        allWorks: works, // Tüm işler (silinenler dahil) - düzenleme için
        loading,
        isOffline,
        hasPendingChanges,
        addCompany,
        updateCompany,
        addWork,
        updateWork,
        deleteCompany,
        deleteWork,
        refreshData,
        syncPendingChanges,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

