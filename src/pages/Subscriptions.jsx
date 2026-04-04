import React, { useState, useContext } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { Container, Row, Col, Card, Form, Button, ListGroup } from 'react-bootstrap';

const Subscriptions = () => {
  const { financeData, saveData } = useContext(FinanceContext);
  const [formData, setFormData] = useState({ name: '', amount: '', billingCycle: 'monthly' });

  const handleAddSubscription = (e) => {
    e.preventDefault();
    const newSub = { id: Date.now(), ...formData, amount: parseFloat(formData.amount) };
    saveData({ ...financeData, subscriptions: [...financeData.subscriptions, newSub] });
    setFormData({ name: '', amount: '', billingCycle: 'monthly' });
  };

  const handleDelete = (id) => {
    saveData({ ...financeData, subscriptions: financeData.subscriptions.filter(s => s.id !== id) });
  };

  return (
    <Container fluid className="px-4">
      <Row className="g-4">
        <Col md={4}>
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <Card.Title className="fw-bold mb-4">Add Subscription</Card.Title>
              <Form onSubmit={handleAddSubscription}>
                <Form.Group className="mb-3">
                  <Form.Label>Service Name</Form.Label>
                  <Form.Control type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Amount ($)</Form.Label>
                  <Form.Control type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label>Billing Cycle</Form.Label>
                  <Form.Select value={formData.billingCycle} onChange={e => setFormData({...formData, billingCycle: e.target.value})}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </Form.Select>
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100 fw-bold">Save</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <Card.Title className="fw-bold mb-4">Active Subscriptions</Card.Title>
              <ListGroup variant="flush">
                {financeData.subscriptions.map((s) => (
                  <ListGroup.Item key={s.id} className="d-flex justify-content-between align-items-center py-3">
                    <div>
                      <h6 className="mb-0 fw-bold">{s.name}</h6>
                      <small className="text-muted text-capitalize">{s.billingCycle}</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <span className="fw-bold me-3 text-danger">${s.amount.toFixed(2)}</span>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(s.id)}>Cancel</Button>
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

export default Subscriptions;