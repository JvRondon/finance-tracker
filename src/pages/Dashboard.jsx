import React, { useContext, useState, useMemo, useEffect } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { Container, Row, Col, Card, Form, Button, Badge, ProgressBar, ButtonGroup, Modal } from 'react-bootstrap';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, Circle, Edit3, AlertCircle,
  ArrowUpRight, ArrowDownRight, Wallet, ShoppingCart, Car, 
  Film, Zap, MonitorPlay, DollarSign, Tag, Utensils, Home, HeartPulse, CreditCard, RefreshCw
} from 'lucide-react';

const ICON_MAP = {
  ShoppingCart: <ShoppingCart size={20} className="text-primary" />,
  Utensils: <Utensils size={20} className="text-danger" />,
  Car: <Car size={20} className="text-warning" />,
  Film: <Film size={20} className="text-info" />,
  Zap: <Zap size={20} className="text-secondary" />,
  MonitorPlay: <MonitorPlay size={20} style={{color: '#8b5cf6'}} />,
  Home: <Home size={20} className="text-dark" />,
  HeartPulse: <HeartPulse size={20} className="text-danger" />,
  Tag: <Tag size={20} className="text-muted" />,
  DollarSign: <DollarSign size={20} className="text-success" />,
  CreditCard: <CreditCard size={20} className="text-info" />
};

// ==========================================
// BANCO DE LOGOS (COLOQUE SEUS LINKS AQUI)
// ==========================================
const getBrandLogo = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('netflix')) return 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg';
  if (n.includes('spotify')) return 'https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png';
  if (n.includes('amazon') || n.includes('prime')) return 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png';
  if (n.includes('ifood')) return 'https://upload.wikimedia.org/wikipedia/commons/1/18/Ifood-logo.png';
  if (n.includes('uber')) return 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png';
  
  // Exemplo de como adicionar um novo:
  // if (n.includes('academia')) return 'LINK_DA_IMAGEM_AQUI.png';
  
  return null;
};

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const Dashboard = () => {
  const { financeData, saveData, editTransaction } = useContext(FinanceContext);
  
  const [realToday, setRealToday] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); 

  useEffect(() => {
    fetch('http://worldtimeapi.org/api/timezone/America/Sao_Paulo')
      .then(res => res.json())
      .then(data => setRealToday(new Date(data.datetime)))
      .catch(() => console.warn("API de tempo falhou."));
  }, []);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);

  // ESTADO DA ABA DO EXTRATO (Corrente vs Crédito)
  const [extratoView, setExtratoView] = useState('corrente');

  const selectedMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  const openPicker = () => { setPickerYear(currentDate.getFullYear()); setShowPicker(true); };
  const selectMonthFromPicker = (index) => { setCurrentDate(new Date(pickerYear, index, 1)); setShowPicker(false); };

  const monthlyTransactions = useMemo(() => financeData.transactions.filter(t => t.date.startsWith(selectedMonthStr)), [financeData.transactions, selectedMonthStr]);

  const incomes = monthlyTransactions.filter(t => t.type === 'income');
  const expenses = monthlyTransactions.filter(t => t.type === 'expense');
  const subscriptions = expenses.filter(e => e.isSubscription);

  const creditExpenses = expenses.filter(e => e.method === 'Crédito');
  const nonCreditExpenses = expenses.filter(e => e.method !== 'Crédito');

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const paidExpenses = nonCreditExpenses.filter(e => e.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
  const pendingExpenses = nonCreditExpenses.filter(e => !e.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
  
  const pixDebitTotal = paidExpenses + pendingExpenses;
  const creditTotal = creditExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - paidExpenses;

  // Arrays separados para exibição no extrato
  const displayTransactions = extratoView === 'corrente' 
    ? monthlyTransactions.filter(t => t.method !== 'Crédito') 
    : monthlyTransactions.filter(t => t.method === 'Crédito');

  const expensesByCategory = useMemo(() => {
    const grouped = {};
    expenses.forEach(e => { grouped[e.category] = (grouped[e.category] || 0) + e.amount; });
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    return { list: sorted, max: sorted.length ? sorted[0][1] : 1 };
  }, [expenses]);

  const chartData = [
    { name: 'Entradas', value: totalIncome, fill: '#10b981' },
    { name: 'Saídas (Pix/Déb)', value: pixDebitTotal, fill: '#ef4444' },
    { name: 'Crédito', value: creditTotal, fill: '#3b82f6' }
  ];
  const subChartData = subscriptions.map(s => ({ name: s.name, amount: s.amount, fill: '#8b5cf6' }));

  const [formType, setFormType] = useState('expense'); 
  const [newExp, setNewExp] = useState({ date: `${selectedMonthStr}-01`, dueDate: '', name: '', method: 'Pix', essential: true, category: '', amount: '', isPaid: true, isSubscription: false, icon: 'Tag' });

  const handleAddTransaction = (e) => {
    e.preventDefault();
    const transaction = {
      id: Date.now(), type: formType, ...newExp, amount: parseFloat(newExp.amount), 
      essential: String(newExp.essential) === 'true', 
      isPaid: formType === 'income' ? true : (newExp.method === 'Crédito' ? false : String(newExp.isPaid) === 'true'),
      icon: formType === 'income' ? 'DollarSign' : newExp.icon,
      dueDate: newExp.dueDate || newExp.date 
    };
    saveData({ ...financeData, transactions: [...financeData.transactions, transaction] });
    setNewExp({ ...newExp, name: '', amount: '', category: '', isSubscription: false, icon: 'Tag', dueDate: '' }); 
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    editTransaction(editingData.id, { ...editingData, amount: parseFloat(editingData.amount), essential: String(editingData.essential) === 'true' });
    setEditModalOpen(false); setEditingData(null);
  };

  const toggleStatus = (id) => saveData({ ...financeData, transactions: financeData.transactions.map(t => t.id === id ? { ...t, isPaid: !t.isPaid } : t) });
  const deleteRow = (id) => saveData({ ...financeData, transactions: financeData.transactions.filter(t => t.id !== id) });

  const isDueSoon = (dueDate, isPaid) => {
    if (isPaid || !dueDate) return false;
    const diffDays = Math.ceil((new Date(dueDate) - realToday) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= -5; 
  };

  const handleAutoBillSubscriptions = () => {
    const allSubs = financeData.transactions.filter(t => t.isSubscription);
    const uniqueMap = new Map();
    allSubs.forEach(item => { if (!uniqueMap.has(item.name)) uniqueMap.set(item.name, item); });
    
    const missingSubs = Array.from(uniqueMap.values()).filter(sub => !monthlyTransactions.some(t => t.name === sub.name));
    if (missingSubs.length === 0) return alert('Assinaturas já estão lançadas neste mês!');

    const newTxs = missingSubs.map(sub => ({ ...sub, id: Date.now() + Math.random(), date: `${selectedMonthStr}-05`, dueDate: `${selectedMonthStr}-05`, isPaid: false }));
    saveData({ ...financeData, transactions: [...financeData.transactions, ...newTxs] });
    alert(`${newTxs.length} assinatura(s) importada(s)!`);
  };

  // ==========================================
  // NOVA FUNÇÃO: PUXAR FATURA DO MÊS PASSADO
  // ==========================================
  const handlePullCreditInvoice = () => {
    // Descobre o mês anterior
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthLabel = prevDate.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();

    // Filtra compras no crédito do mês passado
    const prevCreditTxs = financeData.transactions.filter(t => t.date.startsWith(prevMonthStr) && t.method === 'Crédito');
    const totalFatura = prevCreditTxs.reduce((acc, curr) => acc + curr.amount, 0);

    if (totalFatura === 0) return alert(`Nenhum gasto no crédito encontrado em ${prevMonthLabel}.`);

    const invoiceName = `Fatura Cartão - ${prevMonthLabel}`;
    
    // Evita duplicidade
    if (monthlyTransactions.some(t => t.name === invoiceName)) {
      return alert('A fatura do mês passado já foi importada para este mês!');
    }

    // Cria a nova conta a pagar (no método Pix, pois sai do saldo da conta)
    const newInvoice = {
      id: Date.now(),
      type: 'expense',
      name: invoiceName,
      amount: totalFatura,
      date: `${selectedMonthStr}-10`, // Ex: Data padrão dia 10
      dueDate: `${selectedMonthStr}-10`,
      method: 'Pix', 
      essential: true,
      category: 'Cartão de Crédito',
      isPaid: false,
      isSubscription: false,
      icon: 'CreditCard' // Usa o ícone do cartão
    };

    saveData({ ...financeData, transactions: [...financeData.transactions, newInvoice] });
    setExtratoView('corrente'); // Muda a aba para mostrar a nova conta a pagar
    alert(`Fatura de R$ ${totalFatura.toFixed(2)} importada com sucesso!`);
  };

  return (
    <Container fluid className="py-4 min-vh-100" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Visão Geral</h4>
          <span className="text-muted small">Atualizado: {realToday.toLocaleDateString('pt-BR')}</span>
        </div>
        <div className="d-flex align-items-center bg-white rounded-pill px-2 py-1 shadow-sm border">
          <Button variant="link" className="p-2 text-dark" onClick={() => changeMonth(-1)}><ChevronLeft size={20}/></Button>
          <Button variant="link" className="fw-bold text-dark text-decoration-none px-3" style={{ minWidth: '150px', fontSize: '0.9rem' }} onClick={openPicker}>{monthLabel}</Button>
          <Button variant="link" className="p-2 text-dark" onClick={() => changeMonth(1)}><ChevronRight size={20}/></Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        {[
          { label: 'Entradas', value: totalIncome, icon: <ArrowUpRight size={24} className="text-success" />, color: 'text-success' },
          { label: 'Saídas (Pix/Débito)', value: pixDebitTotal, icon: <ArrowDownRight size={24} className="text-danger" />, color: 'text-danger' },
          { label: 'Fatura Mês Atual', value: creditTotal, icon: <CreditCard size={24} className="text-info" />, color: 'text-info' },
          { label: 'Saldo Bancário', value: balance, icon: <Wallet size={24} className="text-dark" />, color: 'text-dark' }
        ].map((stat, idx) => (
          <Col md={3} key={idx}>
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="d-flex align-items-center justify-content-between p-4">
                <div>
                  <p className="text-muted mb-1 small fw-semibold text-uppercase">{stat.label}</p>
                  <h3 className={`fw-bold mb-0 ${stat.color}`}>R$ {stat.value.toFixed(2)}</h3>
                </div>
                <div className="bg-light p-3 rounded-circle">{stat.icon}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4 text-dark">Novo Lançamento</h5>
              <div className="bg-white p-3 rounded-4 border mb-4">
                <ButtonGroup className="w-100 mb-3 shadow-sm rounded-3">
                  <Button variant={formType === 'expense' ? 'danger' : 'outline-secondary'} className="fw-bold" onClick={() => setFormType('expense')}><ArrowDownRight size={16} className="me-1"/> Saída</Button>
                  <Button variant={formType === 'income' ? 'success' : 'outline-secondary'} className="fw-bold" onClick={() => setFormType('income')}><ArrowUpRight size={16} className="me-1"/> Entrada</Button>
                </ButtonGroup>
<Form onSubmit={handleAddTransaction} className="d-flex flex-wrap align-items-end gap-2">
                  
                  <div>
                    <label className="small text-muted mb-1" style={{fontSize: '0.75rem'}}>Data Compra</label>
                    <Form.Control size="sm" type="date" value={newExp.date} onChange={e => setNewExp({...newExp, date: e.target.value})} required style={{ maxWidth: '130px' }} />
                  </div>
                  
                  {formType === 'expense' && (
                    <>
                      <div>
                        <label className="small text-muted mb-1" style={{fontSize: '0.75rem'}}>Vencimento</label>
                        <Form.Control size="sm" type="date" value={newExp.dueDate} onChange={e => setNewExp({...newExp, dueDate: e.target.value})} style={{ maxWidth: '130px' }} />
                      </div>
                      <div>
                        <label className="small text-muted mb-1" style={{fontSize: '0.75rem'}}>Ícone/Loja</label>
                        <Form.Select size="sm" value={newExp.icon} onChange={e => setNewExp({...newExp, icon: e.target.value})} style={{ maxWidth: '130px' }}>
                          <option value="Tag">🏷️ Geral</option>
                          <option value="ShoppingCart">🛒 Mercado</option>
                          <option value="Utensils">🍔 Comida</option>
                          <option value="Car">🚗 Transporte</option>
                          <option value="Film">🎬 Lazer</option>
                          <option value="Zap">⚡ Contas</option>
                          <option value="Home">🏠 Moradia</option>
                          <option value="HeartPulse">❤️ Saúde</option>
                          <option value="MonitorPlay">🖥️ Assinatura</option>
                        </Form.Select>
                      </div>
                    </>
                  )}

                  <div className="flex-grow-1">
                    <label className="small text-muted mb-1" style={{fontSize: '0.75rem'}}>Descrição</label>
                    <Form.Control size="sm" placeholder={formType === 'income' ? "Origem do dinheiro" : "Ex: Assinatura Netflix"} value={newExp.name} onChange={e => setNewExp({...newExp, name: e.target.value})} required />
                  </div>
                  
                  {formType === 'expense' && (
                    <>
                      <div>
                        <label className="small text-muted mb-1" style={{fontSize: '0.75rem'}}>Método</label>
                        <Form.Select size="sm" value={newExp.method} onChange={e => setNewExp({...newExp, method: e.target.value})} style={{ width: '100px' }}>
                          <option value="Pix">Pix/Débito</option>
                          <option value="Crédito">Crédito</option>
                        </Form.Select>
                      </div>
                      <div>
                        <label className="small text-muted mb-1" style={{fontSize: '0.75rem'}}>Prioridade</label>
                        <Form.Select size="sm" value={newExp.essential} onChange={e => setNewExp({...newExp, essential: e.target.value})} style={{ width: '100px' }}>
                          <option value={true}>Essencial</option>
                          <option value={false}>Não Ess.</option>
                        </Form.Select>
                      </div>
                      <div className="pb-1">
                        <Form.Check type="switch" id="sub-switch" label="Assinatura?" className="d-flex align-items-center ms-1 small text-muted" checked={newExp.isSubscription} onChange={e => setNewExp({...newExp, isSubscription: e.target.checked})} />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label className="small text-muted mb-1" style={{fontSize: '0.75rem'}}>Categoria</label>
                    <Form.Control size="sm" placeholder="Ex: Lazer" value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})} required style={{ maxWidth: '120px' }} />
                  </div>
                  <div>
                    <label className="small text-muted mb-1" style={{fontSize: '0.75rem'}}>Valor (R$)</label>
                    <Form.Control size="sm" type="number" step="0.01" placeholder="0.00" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} required style={{ width: '90px' }} />
                  </div>
                  <Button type="submit" size="sm" variant="dark" className="rounded-3 px-3 fw-bold mb-1"><Plus size={16} /> Add</Button>
                </Form>
              </div>

              {/* BARRA DE FERRAMENTAS DO EXTRATO */}
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 mt-4 gap-2">
                
                {/* ABAS: CONTA CORRENTE VS CARTÃO DE CRÉDITO */}
                <ButtonGroup className="shadow-sm rounded-3">
                  <Button variant={extratoView === 'corrente' ? 'dark' : 'outline-secondary'} size="sm" className="fw-bold px-3" onClick={() => setExtratoView('corrente')}>
                    <Wallet size={14} className="me-2"/> Conta Corrente
                  </Button>
                  <Button variant={extratoView === 'credito' ? 'info' : 'outline-secondary'} size="sm" className="fw-bold px-3" onClick={() => setExtratoView('credito')}>
                    <CreditCard size={14} className="me-2"/> Cartão de Crédito
                  </Button>
                </ButtonGroup>

                <div className="d-flex gap-2">
                  <Button variant="outline-info" size="sm" className="fw-bold d-flex align-items-center gap-1" onClick={handlePullCreditInvoice}>
                    <RefreshCw size={14} /> Puxar Fatura Ant.
                  </Button>
                  <Button variant="outline-purple" style={{borderColor: '#8b5cf6', color: '#8b5cf6'}} size="sm" className="fw-bold d-flex align-items-center gap-1" onClick={handleAutoBillSubscriptions}>
                    <MonitorPlay size={14} /> Puxar Assinaturas
                  </Button>
                </div>
              </div>

              <div className="d-flex flex-column gap-2">
                {displayTransactions.length === 0 && (
                  <div className="text-center p-4 text-muted border rounded-3 bg-light">Nenhum lançamento encontrado nesta aba.</div>
                )}
                {displayTransactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => {
                  const brandLogo = getBrandLogo(t.name);
                  const alertDue = t.type === 'expense' && t.method !== 'Crédito' && isDueSoon(t.dueDate, t.isPaid);

                  return (
                    <div key={t.id} className={`d-flex align-items-center justify-content-between p-3 border rounded-3 bg-white ${alertDue ? 'border-warning shadow-sm' : ''}`} style={{ transition: 'all 0.2s ease' }}>
                      <div className="d-flex align-items-center gap-3" style={{ minWidth: '40%' }}>
                        <div className="bg-light rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', overflow: 'hidden' }}>
                          {brandLogo ? <img src={brandLogo} alt={t.name} style={{ width: '70%', height: '70%', objectFit: 'contain' }} /> : (ICON_MAP[t.icon] || <Tag size={20} className="text-muted"/>)}
                        </div>
                        <div>
                          <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                            {t.name} {t.isSubscription && <MonitorPlay size={12} style={{color: '#8b5cf6'}} />}
                            {alertDue && <Badge bg="warning" text="dark" className="ms-2" style={{fontSize: '0.65rem'}}><AlertCircle size={10} className="me-1"/>Vence Logo</Badge>}
                          </h6>
                          <span className="text-muted small me-2">{t.date.split('-').reverse().join('/')}</span>
                          {t.dueDate && t.dueDate !== t.date && <span className="text-warning small me-2 fw-bold">• Vence: {t.dueDate.split('-').reverse().join('/')}</span>}
                          <span className="text-muted small text-capitalize">• {t.category}</span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-4">
                        <span className={`fw-bold ${t.type === 'income' ? 'text-success' : 'text-dark'}`} style={{ width: '100px', textAlign: 'right' }}>
                          {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                        </span>
                        
                        {t.type === 'expense' && t.method !== 'Crédito' ? (
                          <Button variant="link" className="p-0 text-decoration-none d-flex align-items-center gap-1" onClick={() => toggleStatus(t.id)} style={{ width: '85px', color: t.isPaid ? '#198754' : '#fd7e14' }}>
                            {t.isPaid ? <CheckCircle size={18} /> : <Circle size={18} />}
                            <span className="small fw-semibold">{t.isPaid ? 'Pago' : 'Pendente'}</span>
                          </Button>
                        ) : <div style={{ width: '85px' }}></div>}

                        <div className="d-flex gap-2">
                          <Button variant="link" className="p-0 text-muted hover-primary" onClick={() => { setEditingData(t); setEditModalOpen(true); }}><Edit3 size={16} /></Button>
                          <Button variant="link" className="p-0 text-muted hover-danger" onClick={()=> deleteRow(t.id)}><Trash2 size={16} /></Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>

{/* RIGHT COLUMN: Analytics */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4 text-dark">Despesas por Categoria</h5>
              <div className="d-flex justify-content-center mb-4" style={{ height: '180px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* ========================================== */}
              {/* ASSINATURAS DO MÊS (COM LOGOS E BARRAS) */}
              {/* ========================================== */}
              <hr className="text-muted opacity-25 my-4" />
              <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                <MonitorPlay size={18} style={{color: '#8b5cf6'}} /> Assinaturas do Mês
              </h6>
              
              {subscriptions.length > 0 ? (
                <div className="d-flex flex-column gap-3 mb-4">
                  {subscriptions.map((sub, idx) => {
                    const brandLogo = getBrandLogo(sub.name);
                    // Calcula a porcentagem baseada na assinatura mais cara
                    const maxSub = Math.max(...subscriptions.map(s => s.amount));
                    const percent = maxSub > 0 ? (sub.amount / maxSub) * 100 : 0;

                    return (
                      <div key={idx}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <div className="bg-light rounded p-1 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                              {brandLogo ? (
                                <img src={brandLogo} alt={sub.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              ) : (
                                <MonitorPlay size={12} className="text-muted"/>
                              )}
                            </div>
                            <span className="small fw-semibold text-dark text-capitalize">{sub.name}</span>
                          </div>
                          <span className="text-muted small">R$ {sub.amount.toFixed(2)}</span>
                        </div>
                        {/* Barra Roxa Customizada */}
                        <div className="w-100 bg-secondary bg-opacity-10 rounded-pill" style={{ height: '6px' }}>
                          <div className="rounded-pill" style={{ width: `${percent}%`, height: '100%', backgroundColor: '#8b5cf6' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted small mb-4">Nenhuma assinatura lançada neste mês.</p>
              )}

              {/* ========================================== */}
              {/* TOP 5 GASTOS */}
              {/* ========================================== */}
              <hr className="text-muted opacity-25 my-4" />
              <h6 className="fw-bold mb-3 text-dark">Top 5 Gastos do Mês</h6>
              <div className="d-flex flex-column gap-3">
                {expensesByCategory.list.slice(0, 5).map(([catName, amount], index) => {
                  const percent = expensesByCategory.max > 0 ? (amount / expensesByCategory.max) * 100 : 0;
                  return (
                    <div key={index}>
                      <div className="d-flex justify-content-between mb-1 small">
                        <span className="fw-semibold text-dark text-capitalize">{catName}</span>
                        <span className="text-muted">R$ {amount.toFixed(2)}</span>
                      </div>
                      <ProgressBar now={percent} style={{ height: '6px' }} variant={index === 0 ? 'danger' : index === 1 ? 'warning' : 'primary'} />
                    </div>
                  );
                })}
              </div>
              
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showPicker} onHide={() => setShowPicker(false)} centered size="sm">
        <Modal.Header className="d-flex justify-content-between align-items-center border-0 pb-0 bg-white">
          <Button variant="light" size="sm" onClick={() => setPickerYear(y => y - 1)} className="rounded-circle p-2"><ChevronLeft size={18}/></Button>
          <span className="fw-bold fs-5 text-dark">{pickerYear}</span>
          <Button variant="light" size="sm" onClick={() => setPickerYear(y => y + 1)} className="rounded-circle p-2"><ChevronRight size={18}/></Button>
        </Modal.Header>
        <Modal.Body className="pt-3 bg-white">
          <Row className="g-2">
            {MONTH_NAMES.map((m, index) => {
              const isSelected = currentDate.getMonth() === index && currentDate.getFullYear() === pickerYear;
              return (
                <Col xs={4} key={m}>
                  <Button variant={isSelected ? 'dark' : 'outline-secondary'} className={`w-100 fw-bold border-0 ${isSelected ? 'shadow-sm' : 'bg-light'}`} onClick={() => selectMonthFromPicker(index)}>
                    {m}
                  </Button>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
      </Modal>

      <Modal show={editModalOpen} onHide={() => setEditModalOpen(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-dark fs-5">Editar Lançamento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingData && (
            <Form onSubmit={handleSaveEdit}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Nome</Form.Label>
                <Form.Control value={editingData.name} onChange={e => setEditingData({...editingData, name: e.target.value})} required />
              </Form.Group>
              <Row className="mb-3">
                <Col>
                  <Form.Label className="small fw-bold text-muted">Categoria</Form.Label>
                  <Form.Control value={editingData.category} onChange={e => setEditingData({...editingData, category: e.target.value})} required />
                </Col>
                <Col>
                  <Form.Label className="small fw-bold text-muted">Valor (R$)</Form.Label>
                  <Form.Control type="number" step="0.01" value={editingData.amount} onChange={e => setEditingData({...editingData, amount: e.target.value})} required />
                </Col>
              </Row>
              <Row className="mb-4">
                <Col>
                  <Form.Label className="small fw-bold text-muted">Data da Compra</Form.Label>
                  <Form.Control type="date" value={editingData.date} onChange={e => setEditingData({...editingData, date: e.target.value})} required />
                </Col>
                {editingData.type === 'expense' && (
                  <Col>
                    <Form.Label className="small fw-bold text-muted">Ícone</Form.Label>
                    <Form.Select value={editingData.icon} onChange={e => setEditingData({...editingData, icon: e.target.value})}>
                      <option value="Tag">🏷️ Geral</option>
                      <option value="ShoppingCart">🛒 Mercado</option>
                      <option value="Utensils">🍔 Comida</option>
                      <option value="Car">🚗 Transporte</option>
                      <option value="Film">🎬 Lazer</option>
                      <option value="Zap">⚡ Contas</option>
                      <option value="MonitorPlay">🖥️ Assinatura</option>
                      <option value="CreditCard">💳 Cartão</option>
                    </Form.Select>
                  </Col>
                )}
              </Row>
              <Button type="submit" variant="primary" className="w-100 fw-bold">Salvar Alterações</Button>
            </Form>
          )}
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default Dashboard;