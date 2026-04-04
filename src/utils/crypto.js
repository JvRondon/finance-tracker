import CryptoJS from 'crypto-js';

const SALT = "finance_tracker_static_salt_v1";

export const encryptData = (data, password) => {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, password + SALT).toString();
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
};

export const decryptData = (ciphertext, password) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password + SALT);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) throw new Error("Invalid password or corrupted data");
    
    return JSON.parse(decryptedString);
  } catch (error) {
    return null;
  }
};