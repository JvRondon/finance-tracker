import React, { useContext, useState, useRef, useEffect } from 'react';
import { FinanceProvider, FinanceContext } from './context/FinanceContext';
import LoginScreen from './pages/LoginScreen';
import Dashboard from './pages/Dashboard';
import { Navbar, Container, Button, Modal, Form, Alert } from 'react-bootstrap';
import { KeyRound, Lock, Download, Upload, Sun, Moon } from 'lucide-react';

const MainLayout = () => {
  const { isAuthenticated, changePassword, financeData, importBackup } = useContext(FinanceContext);
  
  // Dark Mode State
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
  const [showModal, setShowModal] = useState(false);
  const [oldPass, setOldPass] = useState(''); 
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);

  // Apply theme on load and change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleLogout = () => window.location.reload();

  const handleExport = () => {
    const dataStr = JSON.stringify(financeData);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const success = importBackup(JSON.parse(event.target.result));
      if (success) alert("Backup restaurado!");
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) return <LoginScreen />;

  return (
    <>
      <Navbar bg={isDark ? "dark" : "dark"} variant="dark" className="py-2 shadow-sm border-bottom border-secondary">
        <Container fluid>
          <Navbar.Brand className="fs-6 fw-bold d-flex align-items-center gap-2">
            <Lock size={16} className="text-warning" /> Finance Vault
          </Navbar.Brand>
          
          <div className="d-flex gap-2 align-items-center">
            {/* DARK MODE TOGGLE */}
            <Button variant="link" className="text-light p-2 border-0" onClick={() => setIsDark(!isDark)}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
            <Button variant="outline-success" size="sm" className="border-0" onClick={() => fileInputRef.current.click()} title="Importar">
              <Upload size={16} />
            </Button>
            <Button variant="outline-info" size="sm" className="border-0" onClick={handleExport} title="Exportar">
              <Download size={16} />
            </Button>
            <Button variant="outline-light" size="sm" className="border-0 ms-2" onClick={() => setShowModal(true)}>
              <KeyRound size={16} />
            </Button>
            <Button variant="danger" size="sm" className="fw-bold px-3 ms-2" onClick={handleLogout}>Bloquear</Button>
          </div>
        </Container>
      </Navbar>

      <Dashboard isDark={isDark} /> 

      {/* Keep your Change Password Modal here... */}
    </>
  );
};

const App = () => (
  <FinanceProvider>
    <MainLayout />
  </FinanceProvider>
);

export default App;