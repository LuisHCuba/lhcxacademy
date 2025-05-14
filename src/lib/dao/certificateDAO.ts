import { supabase } from '../supabase';
import type { Certificate } from '../../types/app';

/**
 * DAO para gerenciamento de certificados
 */
export const certificateDAO = {
  /**
   * Busca certificados de um usuário
   * @param userId ID do usuário
   * @returns Lista de certificados com detalhes das trilhas
   */
  async getUserCertificates(userId: string): Promise<(Certificate & { track_name: string })[]> {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          tracks (id, name, type, thumbnail_url)
        `)
        .eq('user_id', userId)
        .order('issue_date', { ascending: false });
        
      if (error) throw error;
      
      return (data || []).map(cert => ({
        ...cert,
        track_name: cert.tracks?.name || 'Trilha desconhecida',
        track_type: cert.tracks?.type,
        track_thumbnail_url: cert.tracks?.thumbnail_url
      }));
    } catch (error) {
      console.error('Erro ao buscar certificados do usuário:', error);
      return [];
    }
  },

  /**
   * Emite um certificado para um usuário
   * @param userId ID do usuário
   * @param trackId ID da trilha
   * @returns Sucesso da operação
   */
  async issueCertificate(userId: string, trackId: number): Promise<boolean> {
    try {
      // Verificar se já existe um certificado para esse usuário e trilha
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('track_id', trackId)
        .maybeSingle();
        
      if (existingCert) {
        // Certificado já existe, retornar true
        return true;
      }
      
      // Criar novo certificado
      const { error } = await supabase
        .from('certificates')
        .insert({
          user_id: userId,
          track_id: trackId,
          issue_date: new Date().toISOString()
        });
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao emitir certificado:', error);
      return false;
    }
  },

  /**
   * Busca um certificado pelo ID
   * @param id ID do certificado
   * @returns Certificado ou null se não encontrado
   */
  async getById(id: number): Promise<Certificate | null> {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar certificado:', error);
      return null;
    }
  },

  /**
   * Exclui um certificado
   * @param id ID do certificado
   * @returns Sucesso da operação
   */
  async delete(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao excluir certificado:', error);
      return false;
    }
  },

  /**
   * Marca um certificado como baixado pelo usuário
   * @param certificateId ID do certificado
   * @returns Sucesso da operação
   */
  async markCertificateAsDownloaded(certificateId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ 
          downloaded: true, 
          download_date: new Date().toISOString() 
        })
        .eq('id', certificateId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao marcar certificado como baixado:', error);
      return false;
    }
  }
};