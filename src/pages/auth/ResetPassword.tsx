import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';

// Schema para validação do formulário de solicitação de redefinição
const requestResetSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
});

// Schema para validação do formulário de nova senha
const newPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme sua senha'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RequestResetFormData = z.infer<typeof requestResetSchema>;
type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

const ResetPassword = () => {
  const { resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Verificar se é uma redefinição de senha (com token na URL) ou solicitação de redefinição
  const hash = window.location.hash;
  const isPasswordReset = hash.includes('#access_token=');
  
  // Formulário para solicitação de redefinição
  const requestResetForm = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
  });
  
  // Formulário para nova senha
  const newPasswordForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
  });

  // Função para solicitar redefinição de senha
  const handleRequestReset = async (data: RequestResetFormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const { error } = await resetPassword(data.email);
      
      if (error) {
        setErrorMessage('Ocorreu um erro ao solicitar a redefinição de senha. Por favor, tente novamente.');
        return;
      }
      
      setSuccessMessage(
        'Instruções para redefinição de senha foram enviadas para seu email. ' +
        'Por favor, verifique sua caixa de entrada e siga as instruções.'
      );
    } catch (error) {
      setErrorMessage('Ocorreu um erro ao solicitar a redefinição de senha. Por favor, tente novamente.');
      console.error('Erro na solicitação de redefinição:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para definir nova senha
  const handlePasswordUpdate = async (data: NewPasswordFormData) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      const { error } = await updatePassword(data.password);
      
      if (error) {
        setErrorMessage('Ocorreu um erro ao atualizar sua senha. Por favor, tente novamente.');
        return;
      }
      
      setSuccessMessage('Senha atualizada com sucesso!');
      
      // Redirecionar para o login após alguns segundos
      setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 2000);
    } catch (error) {
      setErrorMessage('Ocorreu um erro ao atualizar sua senha. Por favor, tente novamente.');
      console.error('Erro na atualização de senha:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar formulário de solicitação de redefinição
  const renderRequestResetForm = () => (
    <form onSubmit={requestResetForm.handleSubmit(handleRequestReset)} className="space-y-6">
      <div>
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...requestResetForm.register('email')}
          className="input-field"
        />
        {requestResetForm.formState.errors.email && (
          <p className="error-message">{requestResetForm.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? 'Enviando...' : 'Enviar instruções'}
        </button>
      </div>
    </form>
  );

  // Renderizar formulário de nova senha
  const renderNewPasswordForm = () => (
    <form onSubmit={newPasswordForm.handleSubmit(handlePasswordUpdate)} className="space-y-6">
      <div>
        <label htmlFor="password" className="form-label">
          Nova senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          {...newPasswordForm.register('password')}
          className="input-field"
        />
        {newPasswordForm.formState.errors.password && (
          <p className="error-message">{newPasswordForm.formState.errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="form-label">
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...newPasswordForm.register('confirmPassword')}
          className="input-field"
        />
        {newPasswordForm.formState.errors.confirmPassword && (
          <p className="error-message">{newPasswordForm.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full"
        >
          {isLoading ? 'Atualizando...' : 'Atualizar senha'}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        {isPasswordReset ? 'Definir nova senha' : 'Recuperar senha'}
      </h2>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
          {successMessage}
        </div>
      )}
      
      {!isPasswordReset && !successMessage && (
        <p className="mb-4 text-sm text-gray-600">
          Informe seu endereço de email e enviaremos um link para redefinir sua senha.
        </p>
      )}
      
      {isPasswordReset ? renderNewPasswordForm() : !successMessage && renderRequestResetForm()}
      
      <div className="mt-6 text-center text-sm">
        <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword; 