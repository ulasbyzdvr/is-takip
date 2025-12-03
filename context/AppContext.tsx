import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Company, Work } from '../types';

interface AppContextType {
  companies: Company[];
  works: Work[];
  addCompany: (name: string) => Promise<void>;
  addWork: (work: Omit<Work, 'id' | 'createdAt'>) => Promise<void>;
  deleteCompany: (id: string) => void;
  deleteWork: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  COMPANIES: '@companies',
  WORKS: '@works',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const companiesData = await AsyncStorage.getItem(STORAGE_KEYS.COMPANIES);
      const worksData = await AsyncStorage.getItem(STORAGE_KEYS.WORKS);

      if (companiesData) {
        setCompanies(JSON.parse(companiesData));
      }
      if (worksData) {
        setWorks(JSON.parse(worksData));
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
  };

  const saveCompanies = async (newCompanies: Company[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(newCompanies));
      setCompanies(newCompanies);
    } catch (error) {
      console.error('Firma kaydetme hatası:', error);
    }
  };

  const saveWorks = async (newWorks: Work[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(newWorks));
      setWorks(newWorks);
    } catch (error) {
      console.error('İş kaydetme hatası:', error);
    }
  };

  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addCompany = async (name: string) => {
    const newCompany: Company = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
    };
    const updatedCompanies = [...companies, newCompany];
    await saveCompanies(updatedCompanies);
  };

  const addWork = async (workData: Omit<Work, 'id' | 'createdAt'>) => {
    const newWork: Work = {
      ...workData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updatedWorks = [...works, newWork];
    await saveWorks(updatedWorks);
  };

  const deleteCompany = (id: string) => {
    const updatedCompanies = companies.filter(c => c.id !== id);
    const updatedWorks = works.filter(w => w.companyId !== id);
    saveCompanies(updatedCompanies);
    saveWorks(updatedWorks);
  };

  const deleteWork = (id: string) => {
    const updatedWorks = works.filter(w => w.id !== id);
    saveWorks(updatedWorks);
  };

  return (
    <AppContext.Provider
      value={{
        companies,
        works,
        addCompany,
        addWork,
        deleteCompany,
        deleteWork,
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

