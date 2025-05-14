// Exportar todos os DAOs do sistema
export { certificateDAO } from './certificateDAO';

// Importação temporária para o userDAO e trackDAO
// Esses são usados no componente de administração de certificados
// Quando esses DAOs forem implementados, remova esse código temporário
export const userDAO = {
  async getAll() {
    return []; // Retorna lista vazia temporariamente
  }
};

export const trackDAO = {
  async getTracks() {
    return { data: [] }; // Retorna dados vazios temporariamente
  }
};