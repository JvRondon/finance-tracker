import React, { useState, useContext } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';

const LoginScreen = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(FinanceContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = login(password);
    if (!success) {
      setError('Invalid master password. Please try again.');
    }
  };

  return (
    <Container className="d-flex vh-100 align-items-center justify-content-center bg-light" fluid>
      <Card className="shadow-sm p-4 border-0" style={{ width: '100%', maxWidth: '400px', borderRadius: '15px' }}>
        <Card.Body>
          <Card.Title className="fs-3 fw-bold mb-2 text-dark">Cofre Financeiro</Card.Title>
          <Card.Subtitle className="mb-4 text-muted">
            Insira a Senha para prosseguir
          </Card.Subtitle>
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Master Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                size="lg"
              />
            </Form.Group>
            
            {error && <Alert variant="danger" className="py-2">{error}</Alert>}
            
            <Button variant="primary" type="submit" size="lg" className="w-100 fw-bold">
              Desbloquear
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoginScreen;