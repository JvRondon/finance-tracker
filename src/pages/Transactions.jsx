import React, { useState, useContext } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { Container, Row, Col, Card, Form, Button, Badge, ListGroup } from 'react-bootstrap';

const Transactions = () => {
  const { financeData, saveData } = useContext(FinanceContext);
  const [formData, setFormData] = useState({ name: '', amount: '', type: 'expense', tag: 'Food' });

  const handleAddTransaction = (e) => {
    e.preventDefault();
    const newTransaction = {
      id: Date.now(),
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date().toISOString().split('T')[0]
    };
    saveData({ ...financeData, transactions: [newTransaction, ...financeData.transactions] });
    setFormData({ name: '', amount: '', type: 'expense', tag: 'Food' });
  };

  const handleDelete = (id) => {
    saveData({ ...financeData, transactions: financeData.transactions.filter(t => t.id !== id) });
  };

  return (
    <Container fluid className="px-4">
      <Row className="g-4">
        <Col md={4}>
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <Card.Title className="fw-bold mb-4">Add Transaction</Card.Title>
              <Form onSubmit={handleAddTransaction}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Amount ($)</Form.Label>
                  <Form.Control type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Category Tag</Form.Label>
                  <Form.Control type="text" required value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} />
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100 fw-bold">Add to Ledger</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <Card.Title className="fw-bold mb-4">Recent Transactions</Card.Title>
              <ListGroup variant="flush">
                {financeData.transactions.map((t) => (
                  <ListGroup.Item key={t.id} className="d-flex justify-content-between align-items-center py-3">
                    <div>
                      <h6 className="mb-0 fw-bold">{t.name}</h6>
                      <small className="text-muted">{t.date} • <Badge bg="secondary">{t.tag}</Badge></small>
                    </div>
                    <div className="d-flex align-items-center">
                      <span className={`fw-bold me-3 ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                      </span>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(t.id)}>Del</Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Transactions;