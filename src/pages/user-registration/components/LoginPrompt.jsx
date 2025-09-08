import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const LoginPrompt = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center space-y-4 pt-6 border-t border-border">
      <p className="text-body-base text-text-secondary">
        ¿Ya tienes una cuenta?
      </p>
      
      <Button
        variant="outline"
        size="lg"
        fullWidth
        onClick={() => navigate('/user-login')}
        iconName="LogIn"
        iconPosition="left"
      >
        Iniciar sesión
      </Button>
    </div>
  );
};

export default LoginPrompt;