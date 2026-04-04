import React, { useContext, useState, useMemo } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { Container, Row, Col, Card, Form, Button, Badge, ProgressBar, ButtonGroup, Modal } from 'react-bootstrap';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { 
  ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle, Circle, 
  ArrowUpRight, ArrowDownRight, Wallet, ShoppingCart, Car, 
  Film, Zap, MonitorPlay, DollarSign, Tag, Utensils, Home, HeartPulse
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
  DollarSign: <DollarSign size={20} className="text-success" />
};

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const Dashboard = () => {
  const { financeData, saveData } = useContext(FinanceContext);
  
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1)); 
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());

  const selectedMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  const openPicker = () => { setPickerYear(currentDate.getFullYear()); setShowPicker(true); };
  const selectMonthFromPicker = (index) => { setCurrentDate(new Date(pickerYear, index, 1)); setShowPicker(false); };

  const monthlyTransactions = useMemo(() => financeData.transactions.filter(t => t.date.startsWith(selectedMonthStr)), [financeData.transactions, selectedMonthStr]);

  const incomes = monthlyTransactions.filter(t => t.type === 'income');
  const expenses = monthlyTransactions.filter(t => t.type === 'expense');
  const subscriptions = expenses.filter(e => e.isSubscription);

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const paidExpenses = expenses.filter(e => e.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
  const pendingExpenses = expenses.filter(e => !e.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = paidExpenses + pendingExpenses;
  const balance = totalIncome - paidExpenses;

  const expensesByCategory = useMemo(() => {
    const grouped = {};
    expenses.forEach(e => { grouped[e.category] = (grouped[e.category] || 0) + e.amount; });
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    return { list: sorted, max: sorted.length ? sorted[0][1] : 1 };
  }, [expenses]);

  const chartData = [
    { name: 'Entradas', value: totalIncome, fill: '#10b981' },
    { name: 'Saídas', value: totalExpenses, fill: '#ef4444' }
  ];
  const subChartData = subscriptions.map(s => ({ name: s.name, amount: s.amount, fill: '#8b5cf6' }));

  const [formType, setFormType] = useState('expense'); 
  const [newExp, setNewExp] = useState({ date: `${selectedMonthStr}-01`, name: '', method: 'Pix', essential: true, category: '', amount: '', isPaid: true, isSubscription: false, icon: 'Tag' });

  const handleAddTransaction = (e) => {
    e.preventDefault();
    const transaction = {
      id: Date.now(), type: formType, ...newExp, amount: parseFloat(newExp.amount), 
      essential: newExp.essential === 'true' || newExp.essential === true, 
      isPaid: formType === 'income' ? true : (newExp.isPaid === 'true' || newExp.isPaid === true),
      icon: formType === 'income' ? 'DollarSign' : newExp.icon
    };
    saveData({ ...financeData, transactions: [...financeData.transactions, transaction] });
    setNewExp({ ...newExp, name: '', amount: '', category: '', isSubscription: false, icon: 'Tag' }); 
  };

  const toggleStatus = (id) => {
    saveData({ ...financeData, transactions: financeData.transactions.map(t => t.id === id ? { ...t, isPaid: !t.isPaid } : t) });
  };
  const deleteRow = (id) => {
    saveData({ ...financeData, transactions: financeData.transactions.filter(t => t.id !== id) });
  };

  const getLegacyIcon = (category, type) => {
    if (type === 'income') return ICON_MAP.DollarSign;
    const cat = (category || '').toLowerCase();
    if (cat.includes('mercado') || cat.includes('padaria')) return ICON_MAP.ShoppingCart;
    if (cat.includes('restaurante') || cat.includes('ifood')) return ICON_MAP.Utensils;
    if (cat.includes('uber') || cat.includes('carro')) return ICON_MAP.Car;
    if (cat.includes('cinema') || cat.includes('rolê')) return ICON_MAP.Film;
    if (cat.includes('luz') || cat.includes('água')) return ICON_MAP.Zap;
    return ICON_MAP.Tag;
  };

  const handleAutoBillSubscriptions = () => {
    const allSubs = financeData.transactions.filter(t => t.isSubscription);
    const uniqueSubs = [];
    const map = new Map();
    for (const item of allSubs) {
      if (!map.has(item.name)) { map.set(item.name, true); uniqueSubs.push(item); }
    }
    const alreadyInThisMonth = monthlyTransactions.map(t => t.name);
    const missingSubs = uniqueSubs.filter(sub => !alreadyInThisMonth.includes(sub.name));

    if (missingSubs.length === 0) return alert('Todas as assinaturas já estão lançadas neste mês!');

    const newTransactions = missingSubs.map(sub => ({
      ...sub, id: Date.now() + Math.random(), date: `${selectedMonthStr}-05`, isPaid: false
    }));
    saveData({ ...financeData, transactions: [...financeData.transactions, ...newTransactions] });
    alert(`${newTransactions.length} assinatura(s) importada(s) para este mês!`);
  };

  return (
    <Container fluid className="py-4 min-vh-100" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
        <div>
          <h4 className="fw-bold mb-0 text-dark">Visão Geral</h4>
          <span className="text-muted small">Controle e planejamento financeiro</span>
        </div>
        <div className="d-flex align-items-center bg-white rounded-pill px-2 py-1 shadow-sm border">
          <Button variant="link" className="p-2 text-dark" onClick={() => changeMonth(-1)}><ChevronLeft size={20}/></Button>
          <Button variant="link" className="fw-bold text-dark text-decoration-none px-3" style={{ minWidth: '150px', fontSize: '0.9rem' }} onClick={openPicker}>
            {monthLabel}
          </Button>
          <Button variant="link" className="p-2 text-dark" onClick={() => changeMonth(1)}><ChevronRight size={20}/></Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <Row className="g-3 mb-4">
        {[
          { label: 'Entradas', value: totalIncome, icon: <ArrowUpRight size={24} className="text-success" />, color: 'text-success' },
          { label: 'À Pagar', value: pendingExpenses, icon: <ArrowDownRight size={24} className="text-warning" />, color: 'text-warning' },
          { label: 'Pago', value: paidExpenses, icon: <CheckCircle size={24} className="text-primary" />, color: 'text-primary' },
          { label: 'Saldo Atual', value: balance, icon: <Wallet size={24} className="text-dark" />, color: 'text-dark' }
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
        {/* LEFT COLUMN: Ledger */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4 text-dark">Novo Lançamento</h5>

              <div className="bg-white p-3 rounded-4 border mb-4">
                <ButtonGroup className="w-100 mb-3 shadow-sm rounded-3">
                  <Button variant={formType === 'expense' ? 'danger' : 'outline-secondary'} className="fw-bold" onClick={() => setFormType('expense')}>
                    <ArrowDownRight size={16} className="me-1"/> Saída
                  </Button>
                  <Button variant={formType === 'income' ? 'success' : 'outline-secondary'} className="fw-bold" onClick={() => setFormType('income')}>
                    <ArrowUpRight size={16} className="me-1"/> Entrada
                  </Button>
                </ButtonGroup>

                <Form onSubmit={handleAddTransaction} className="d-flex flex-wrap gap-2">
                  <Form.Control size="sm" type="date" value={newExp.date} onChange={e => setNewExp({...newExp, date: e.target.value})} required style={{ maxWidth: '130px' }} />
                  
                  {formType === 'expense' && (
                    <Form.Select size="sm" value={newExp.icon} onChange={e => setNewExp({...newExp, icon: e.target.value})} style={{ maxWidth: '140px' }}>
                      <option value="Tag">🏷️ Geral</option>
                      <option value="ShoppingCart">🛒 Mercado</option>
                      <option value="Utensils">🍔 Comida</option>
                      <option value="Car">🚗 Transporte</option>
                      <option value="Film">🎬 Lazer/Role</option>
                      <option value="Zap">⚡ Contas</option>
                      <option value="Home">🏠 Moradia</option>
                      <option value="HeartPulse">❤️ Saúde</option>
                      <option value="MonitorPlay">🖥️ Assinatura</option>
                    </Form.Select>
                  )}

                  <Form.Control size="sm" placeholder={formType === 'income' ? "Origem (ex: Salário)" : "Descrição"} value={newExp.name} onChange={e => setNewExp({...newExp, name: e.target.value})} required className="flex-grow-1" />
                  
                  {formType === 'expense' && (
                    <>
                      <Form.Select size="sm" value={newExp.method} onChange={e => setNewExp({...newExp, method: e.target.value})} style={{ width: '100px' }}>
                        <option value="Pix">Pix</option>
                        <option value="Débito">Débito</option>
                        <option value="Crédito">Crédito</option>
                      </Form.Select>
                      <Form.Select size="sm" value={newExp.essential} onChange={e => setNewExp({...newExp, essential: e.target.value})} style={{ width: '110px' }}>
                        <option value={true}>Essencial</option>
                        <option value={false}>Não Ess.</option>
                      </Form.Select>
                      <Form.Check type="switch" id="sub-switch" label="Assinatura?" className="d-flex align-items-center ms-2 small text-muted" checked={newExp.isSubscription} onChange={e => setNewExp({...newExp, isSubscription: e.target.checked})} />
                    </>
                  )}
                  
                  <Form.Control size="sm" placeholder="Categoria" value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})} required style={{ maxWidth: '140px' }} />
                  <Form.Control size="sm" type="number" step="0.01" placeholder="R$" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} required style={{ width: '100px' }} />
                  <Button type="submit" size="sm" variant="dark" className="rounded-3 px-3 fw-bold"><Plus size={16} /> Add</Button>
                </Form>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
                <h5 className="fw-bold mb-0 text-dark">Extrato do Mês</h5>
                <Button variant="outline-purple" style={{borderColor: '#8b5cf6', color: '#8b5cf6'}} size="sm" className="fw-bold d-flex align-items-center gap-1" onClick={handleAutoBillSubscriptions}>
                  <MonitorPlay size={16} /> Puxar Assinaturas
                </Button>
              </div>

              <div className="d-flex flex-column gap-2">
                {monthlyTransactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => (
                  <div key={t.id} className="d-flex align-items-center justify-content-between p-3 border rounded-3 bg-white" style={{ transition: 'all 0.2s ease' }}>
                    
                    <div className="d-flex align-items-center gap-3" style={{ minWidth: '40%' }}>
                      <div className="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                        {t.icon ? ICON_MAP[t.icon] : getLegacyIcon(t.category, t.type)}
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                          {t.name} {t.isSubscription && <MonitorPlay size={12} style={{color: '#8b5cf6'}} />}
                        </h6>
                        <span className="text-muted small me-2">{t.date.split('-').reverse().join('/')}</span>
                        <span className="text-muted small text-capitalize">• {t.category}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-4">
                      {t.type === 'expense' && (
                        <Badge bg={t.essential ? 'success' : 'secondary'} bg-opacity={10} className={`text-${t.essential ? 'success' : 'secondary'} bg-opacity-10 border border-${t.essential ? 'success' : 'secondary'} rounded-pill fw-normal px-2`}>
                          {t.essential ? 'Essencial' : 'Não Essencial'}
                        </Badge>
                      )}
                      <span className={`fw-bold ${t.type === 'income' ? 'text-success' : 'text-dark'}`} style={{ width: '100px', textAlign: 'right' }}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </span>
                      {t.type === 'expense' ? (
                        <Button variant="link" className="p-0 text-decoration-none d-flex align-items-center gap-1" onClick={() => toggleStatus(t.id)} style={{ width: '85px', color: t.isPaid ? '#198754' : '#fd7e14' }}>
                          {t.isPaid ? <CheckCircle size={18} /> : <Circle size={18} />}
                          <span className="small fw-semibold">{t.isPaid ? 'Pago' : 'Pendente'}</span>
                        </Button>
                      ) : <div style={{ width: '85px' }}></div>}
                      <Button variant="link" className="p-0 text-muted hover-danger" onClick={()=> deleteRow(t.id)}><Trash2 size={16} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* RIGHT COLUMN: Analytics */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 mb-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4 text-dark">Fluxo de Caixa</h5>
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

              <hr className="text-muted opacity-25 my-4" />

              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
                <MonitorPlay size={20} style={{color: '#8b5cf6'}} /> Assinaturas Ativas
              </h5>
              {subscriptions.length > 0 ? (
                <div style={{ height: '150px' }} className="mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subChartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} style={{fontSize: '12px', fill: '#6c757d'}} />
                      <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} cursor={{fill: 'transparent'}} />
                      <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={15} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted small mb-4">Nenhuma assinatura marcada para este mês.</p>
              )}

              <hr className="text-muted opacity-25 my-4" />

              <h6 className="fw-bold mb-3 text-dark">Maiores Gastos (Top 5)</h6>
              <div className="d-flex flex-column gap-3">
                {expensesByCategory.list.slice(0, 5).map(([catName, amount], index) => {
                  const percent = (amount / expensesByCategory.max) * 100;
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

      {/* QUICK DATE PICKER MODAL */}
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
                  <Button 
                    variant={isSelected ? 'dark' : 'outline-secondary'} 
                    className={`w-100 fw-bold border-0 ${isSelected ? 'shadow-sm' : 'bg-light'}`}
                    onClick={() => selectMonthFromPicker(index)}
                  >
                    {m}
                  </Button>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default Dashboard;