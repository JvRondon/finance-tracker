import React, { createContext, useState } from 'react';
import { encryptData, decryptData } from '../utils/crypto';

export const FinanceContext = createContext();

const DEFAULT_DATA = { transactions: [] };

export const FinanceProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [financeData, setFinanceData] = useState(DEFAULT_DATA);

  const login = (password) => {
    const encryptedStorage = localStorage.getItem('finance_data_secure');
    if (!encryptedStorage) {
      setMasterPassword(password);
      setIsAuthenticated(true);
      saveData(DEFAULT_DATA, password);
      return true;
    }
    const decrypted = decryptData(encryptedStorage, password);
    if (decrypted) {
      setFinanceData(decrypted);
      setMasterPassword(password);
      setIsAuthenticated(true);
      return true;
    }
    return false; 
  };

  const saveData = (newData, password = masterPassword) => {
    setFinanceData(newData);
    const encrypted = encryptData(newData, password);
    if (encrypted) localStorage.setItem('finance_data_secure', encrypted);
  };

  const changePassword = (currentPassword, newPassword) => {
    if (currentPassword !== masterPassword) return false; 
    setMasterPassword(newPassword);
    const encrypted = encryptData(financeData, newPassword);
    if (encrypted) {
      localStorage.setItem('finance_data_secure', encrypted);
      return true;
    }
    return false;
  };

  // NEW: Import function for backups
  const importBackup = (backupData) => {
    try {
      if (backupData && backupData.transactions) {
        saveData(backupData);
        return true;
      }
      return false;
    } catch(e) { return false; }
  };

  return (
    <FinanceContext.Provider value={{ isAuthenticated, login, financeData, saveData, changePassword, importBackup }}>
      {children}
    </FinanceContext.Provider>
  );
};