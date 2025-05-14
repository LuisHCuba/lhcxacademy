import { supabase } from './supabase';
import type {
  User, Department, Track, Video, Assignment, Progress,
  QuizQuestion, QuizAnswer, QuizAttempt, Certificate,
  UserWithDepartment, DepartmentWithUserCount, TrackWithProgress,
  VideoWithProgress, AssignmentWithDetails, QuizQuestionWithAnswers,
  UserFilters, TrackFilters, AssignmentFilters,
  SortDirection, TrackWithExtras, Lesson, AssignmentStats,
  QuizAnswerExtended
} from '../types/app';

// Classe Base DAO com métodos genéricos
class BaseDAO<T, TInsert, TUpdate> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async getById(id: string | number): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Erro ao buscar ${this.tableName}:`, error);
      return null;
    }
    
    return data as T;
  }

  async getAll(): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*');
    
    if (error) {
      console.error(`Erro ao buscar ${this.tableName}:`, error);
      return [];
    }
    
    return data as T[];
  }

  async getPaginated(
    page: number = 1, 
    pageSize: number = 10, 
    sortField?: keyof T | null, 
    sortDirection: SortDirection = 'asc',
    searchField?: keyof T,
    searchTerm?: string
  ): Promise<{ data: T[], count: number }> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' });
    
    // Aplicar busca se tiver termo de busca e campo de busca
    if (searchTerm && searchField) {
      query = query.ilike(searchField as string, `%${searchTerm}%`);
    }
    
    // Aplicar ordenação se tiver campo de ordenação
    if (sortField) {
      query = query.order(sortField as string, { ascending: sortDirection === 'asc' });
    }
    
    // Aplicar paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error(`Erro ao buscar ${this.tableName} com paginação:`, error);
      return { data: [], count: 0 };
    }
    
    return { data: data as T[], count: count || 0 };
  }

  async create(item: TInsert): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error(`Erro ao criar ${this.tableName}:`, error);
      return null;
    }
    
    return data as T;
  }

  async update(id: string | number, item: TUpdate): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Erro ao atualizar ${this.tableName}:`, error);
      return null;
    }
    
    return data as T;
  }

  async delete(id: string | number): Promise<boolean> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Erro ao excluir ${this.tableName}:`, error);
      return false;
    }
    
    return true;
  }
}

// DAO específico para Usuários
export class UserDAO extends BaseDAO<User, any, any> {
  constructor() {
    super('users');
  }

  // Adiciona método para contar usuários
  async count(): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error(`Erro ao contar ${this.tableName}:`, error);
      return 0;
    }
    
    return count || 0;
  }

  // Método para buscar estatísticas de atribuições
  async getAssignmentsStats(): Promise<AssignmentStats> {
    // Buscar o total de atribuições
    const { count: total, error: totalError } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('Erro ao contar total de atribuições:', totalError);
      return { total: 0, completed: 0, active: 0, expired: 0 };
    }
    
    // Buscar atribuições completadas
    const { count: completed, error: completedError } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');
    
    if (completedError) {
      console.error('Erro ao contar atribuições completadas:', completedError);
      return { total: total || 0, completed: 0, active: 0, expired: 0 };
    }
    
    // Buscar atribuições ativas
    const { count: active, error: activeError } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .or('status.eq.not_started,status.eq.in_progress');
    
    if (activeError) {
      console.error('Erro ao contar atribuições ativas:', activeError);
      return { 
        total: total || 0, 
        completed: completed || 0, 
        active: 0, 
        expired: 0 
      };
    }
    
    // Buscar atribuições expiradas
    const { count: expired, error: expiredError } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired');
    
    if (expiredError) {
      console.error('Erro ao contar atribuições expiradas:', expiredError);
      return { 
        total: total || 0, 
        completed: completed || 0, 
        active: active || 0, 
        expired: 0 
      };
    }
    
    return {
      total: total || 0,
      completed: completed || 0,
      active: active || 0,
      expired: expired || 0
    };
  }

  // Método para contar certificados emitidos
  async getCertificatesCount(): Promise<number> {
    const { count, error } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Erro ao contar certificados:', error);
      return 0;
    }
    
    return count || 0;
  }

  async getUsersWithDepartment(
    page: number = 1,
    pageSize: number = 10,
    sortField: keyof User | null = 'full_name',
    sortDirection: SortDirection = 'asc',
    searchTerm?: string,
    filters?: UserFilters
  ): Promise<{ data: UserWithDepartment[], count: number }> {
    // Consulta base que busca apenas usuários primeiro
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    // Aplicar busca no nome ou email
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }
    
    // Aplicar filtros
    if (filters) {
      if (filters.department_id) {
        query = query.eq('department_id', filters.department_id);
      }
      
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
    }
    
    // Aplicar ordenação
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    
    // Aplicar paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data: usersData, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return { data: [], count: 0 };
    }

    // Para cada usuário, buscamos o departamento associado, se houver
    const usersWithDepartment: UserWithDepartment[] = await Promise.all(
      usersData.map(async (user) => {
        if (!user.department_id) {
          return { ...user, department: null };
        }
        
        // Buscar o departamento do usuário
        const { data: departmentData } = await supabase
          .from('departments')
          .select('*')
          .eq('id', user.department_id)
          .single();
        
        return {
          ...user,
          department: departmentData || null
        };
      })
    );
    
    return { 
      data: usersWithDepartment, 
      count: count || 0 
    };
  }

  async getUsers(
    page: number = 1,
    pageSize: number = 10,
    sortField: keyof User | null = 'created_at',
    sortDirection: SortDirection = 'desc',
    filters: UserFilters = {}
  ): Promise<{ data: UserWithDepartment[], count: number }> {
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    // Aplicar filtros
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }
    
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    
    // Aplicar ordenação
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    
    // Aplicar paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data: usersData, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return { data: [], count: 0 };
    }
    
    // Para cada usuário, buscamos o departamento associado, se houver
    const usersWithDepartment: UserWithDepartment[] = await Promise.all(
      usersData.map(async (user) => {
        if (!user.department_id) {
          return { ...user, department: null };
        }
        
        // Buscar o departamento do usuário
        const { data: departmentData } = await supabase
          .from('departments')
          .select('*')
          .eq('id', user.department_id)
          .single();
        
        return {
          ...user,
          department: departmentData || null
        };
      })
    );
    
    return { 
      data: usersWithDepartment, 
      count: count || 0 
    };
  }
}

// DAO específico para Departamentos
export class DepartmentDAO extends BaseDAO<Department, any, any> {
  constructor() {
    super('departments');
  }

  // Adiciona método para contar departamentos
  async count(): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error(`Erro ao contar ${this.tableName}:`, error);
      return 0;
    }
    
    return count || 0;
  }

  async getDepartmentsWithUserCount(
    page: number = 1,
    pageSize: number = 10,
    sortField: keyof Department | null = 'name',
    sortDirection: SortDirection = 'asc',
    searchTerm?: string
  ): Promise<{ data: DepartmentWithUserCount[], count: number }> {
    // Nova implementação que não depende do relacionamento direto entre as tabelas
    // Primeiro buscamos os departamentos
    let query = supabase
      .from('departments')
      .select('*', { count: 'exact' });
    
    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }
    
    if (sortField) {
      query = query.order(sortField as string, { ascending: sortDirection === 'asc' });
    }
    
    // Aplicar paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data: departmentsData, error: departmentsError, count } = await query;
    
    if (departmentsError) {
      console.error('Erro ao buscar departamentos:', departmentsError);
      return { data: [], count: 0 };
    }
    
    // Agora para cada departamento, contamos os usuários em uma consulta separada
    const departmentsWithCount: DepartmentWithUserCount[] = await Promise.all(
      departmentsData.map(async (dept) => {
        // Conta usuários para este departamento
        const { count: userCount, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('department_id', dept.id);
        
        if (countError) {
          console.error(`Erro ao contar usuários para o departamento ${dept.id}:`, countError);
          return {
            ...dept,
            user_count: 0
          };
        }
        
        return {
          ...dept,
          user_count: userCount || 0
        };
      })
    );
    
    return { 
      data: departmentsWithCount, 
      count: count || 0 
    };
  }
}

// DAO específico para Trilhas
export class TrackDAO extends BaseDAO<Track, any, any> {
  constructor() {
    super('tracks');
  }

  // Adiciona métodos para contar registros
  async count(): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error(`Erro ao contar ${this.tableName}:`, error);
      return 0;
    }
    
    return count || 0;
  }

  // Método para buscar trilhas com informações de progresso para um usuário específico
  async getTracksWithProgress(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    sortField: string = 'created_at',
    sortDirection: SortDirection = 'desc',
    searchTerm?: string,
    filters: TrackFilters = {}
  ): Promise<{ data: TrackWithProgress[], count: number }> {
    // Primeiro buscar o department_id do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('department_id')
      .eq('id', userId)
      .single();
    
    const departmentId = userData?.department_id;
    
    // Buscar as atribuições do usuário ou do departamento dele
    let assignmentsQuery = supabase
      .from('assignments')
      .select('track_id');
    
    // Construir a condição OR para usuário ou departamento
    if (departmentId) {
      assignmentsQuery = assignmentsQuery.or(`user_id.eq.${userId},department_id.eq.${departmentId}`);
    } else {
      assignmentsQuery = assignmentsQuery.eq('user_id', userId);
    }
    
    const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery;
    
    if (assignmentsError) {
      console.error('Erro ao buscar atribuições de trilhas:', assignmentsError);
      return { data: [], count: 0 };
    }
    
    // Extrair IDs das trilhas atribuídas
    const assignedTrackIds = assignmentsData
      ?.filter(a => a.track_id !== null)
      .map(a => a.track_id) || [];
    
    // Se não houver atribuições, retornar lista vazia
    if (assignedTrackIds.length === 0) {
      return { data: [], count: 0 };
    }
    
    // Agora, buscar apenas as trilhas que estão na lista de atribuições
    let query = supabase
      .from('tracks')
      .select('*', { count: 'exact' })
      .in('id', assignedTrackIds);
    
    // Aplicar busca no nome ou descrição
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    
    // Aplicar filtros
    if (filters) {
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
    }
    
    // Aplicar ordenação
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    
    // Aplicar paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data: tracksData, error: tracksError, count } = await query;
    
    if (tracksError) {
      console.error('Erro ao buscar trilhas:', tracksError);
      return { data: [], count: 0 };
    }
    
    if (!tracksData || tracksData.length === 0) {
      return { data: [], count: 0 };
    }
    
    // Agora, para cada trilha, vamos buscar informações de progresso
    const tracksWithProgress: TrackWithProgress[] = await Promise.all(
      tracksData.map(async (track) => {
        // 1. Buscar todos os vídeos da trilha
        const { data: videos, error: videosError } = await supabase
          .from('videos')
          .select('id')
          .eq('track_id', track.id);
        
        if (videosError) {
          console.error(`Erro ao buscar vídeos da trilha ${track.id}:`, videosError);
          return {
            id: track.id,
            name: track.name,
            description: track.description,
            type: track.type,
            thumbnail_url: track.thumbnail_url,
            total_videos: 0,
            completed_videos: 0,
            progress_percentage: 0
          };
        }
        
        const totalVideos = videos?.length || 0;
        
        if (totalVideos === 0) {
          return {
            id: track.id,
            name: track.name,
            description: track.description,
            type: track.type,
            thumbnail_url: track.thumbnail_url,
            total_videos: 0,
            completed_videos: 0,
            progress_percentage: 0
          };
        }
        
        // 2. Buscar progresso do usuário para os vídeos da trilha
        const videoIds = videos.map(v => v.id);
        const { data: progress, error: progressError } = await supabase
          .from('progress')
          .select('video_id, status')
          .eq('user_id', userId)
          .in('video_id', videoIds)
          .eq('status', 'completed');
        
        if (progressError) {
          console.error(`Erro ao buscar progresso para a trilha ${track.id}:`, progressError);
          return {
            id: track.id,
            name: track.name,
            description: track.description,
            type: track.type,
            thumbnail_url: track.thumbnail_url,
            total_videos: totalVideos,
            completed_videos: 0,
            progress_percentage: 0
          };
        }
        
        const completedVideos = progress?.length || 0;
        const progressPercentage = totalVideos > 0 
          ? (completedVideos / totalVideos) * 100
          : 0;
        
        return {
          id: track.id,
          name: track.name,
          description: track.description,
          type: track.type,
          thumbnail_url: track.thumbnail_url,
          total_videos: totalVideos,
          completed_videos: completedVideos,
          progress_percentage: progressPercentage
        };
      })
    );
    
    return {
      data: tracksWithProgress,
      count: count || 0
    };
  }

  // Método para buscar trilhas com paginação, busca e filtros
  async getTracks(
    page: number = 1,
    pageSize: number = 10,
    sortField: string = 'name',
    sortDirection: SortDirection = 'asc',
    searchTerm?: string,
    filters: TrackFilters = {}
  ): Promise<{ data: TrackWithExtras[], count: number }> {
    // Consulta base sem join
    let query = supabase
      .from('tracks')
      .select('*', { count: 'exact' });
    
    // Aplicar busca no nome ou descrição
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    
    // Aplicar filtros
    if (filters) {
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
    }
    
    // Aplicar ordenação
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    
    // Aplicar paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data: tracksData, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar trilhas:', error);
      return { data: [], count: 0 };
    }
    
    // Para cada trilha, buscamos contagem de vídeos em consultas separadas
    const tracksWithExtras: TrackWithExtras[] = await Promise.all(
      tracksData.map(async (track) => {
        // Contar vídeos para esta trilha
        const { count: videoCount, error: countError } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('track_id', track.id);
        
        if (countError) {
          console.error(`Erro ao contar vídeos para a trilha ${track.id}:`, countError);
          return {
            ...track,
            lessons_count: 0
          };
        }
        
        return {
          ...track,
          lessons_count: videoCount || 0
        };
      })
    );
    
    return { 
      data: tracksWithExtras, 
      count: count || 0 
    };
  }

  // Método para buscar aulas/lições de uma trilha
  async getLessons(trackId: number): Promise<Lesson[]> {
    // Buscar vídeos como lições do tipo vídeo
    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('track_id', trackId)
      .order('order_index', { ascending: true });
    
    if (videoError) {
      console.error('Erro ao buscar vídeos da trilha:', videoError);
      return [];
    }
    
    // Buscar perguntas de quiz como lições do tipo quiz
    const { data: quizData, error: quizError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('track_id', trackId);
    
    if (quizError) {
      console.error('Erro ao buscar perguntas da trilha:', quizError);
      return [];
    }
    
    // Transformar vídeos em lições
    const videoLessons: Lesson[] = videoData.map((video, index) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      type: 'video',
      duration: video.estimated_duration,
      track_id: video.track_id,
      order_index: video.order_index || index,
      status: 'published', // Assumir publicado para vídeos existentes
      created_at: video.created_at,
      created_by: video.created_by
    }));
    
    // Transformar perguntas de quiz em lições
    const quizLessons: Lesson[] = quizData.map((quiz, index) => ({
      id: quiz.id,
      title: quiz.question_text,
      description: 'Quiz question',
      type: 'quiz',
      duration: quiz.time_limit,
      track_id: quiz.track_id,
      order_index: 1000 + index, // Posicionar após os vídeos
      status: 'published', // Assumir publicado para quizzes existentes
      created_at: quiz.created_at,
      created_by: quiz.created_by
    }));
    
    // Combinar e ordenar todas as lições
    const allLessons = [...videoLessons, ...quizLessons].sort((a, b) => a.order_index - b.order_index);
    
    return allLessons;
  }
}

// DAO para Vídeos
export class VideoDAO extends BaseDAO<Video, any, any> {
  constructor() {
    super('videos');
  }

  async getVideosByTrack(
    trackId: number,
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    sortField: keyof Video | null = 'order_index',
    sortDirection: SortDirection = 'asc'
  ): Promise<{ data: VideoWithProgress[], count: number }> {
    // Primeiro, buscamos apenas os vídeos da trilha
    let videoQuery = supabase
      .from('videos')
      .select('*', { count: 'exact' })
      .eq('track_id', trackId);
    
    if (sortField) {
      videoQuery = videoQuery.order(sortField as string, { ascending: sortDirection === 'asc' });
    }
    
    // Aplicar paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    videoQuery = videoQuery.range(from, to);
    
    const { data: videosData, error: videosError, count } = await videoQuery;
    
    if (videosError) {
      console.error('Erro ao buscar vídeos da trilha:', videosError);
      return { data: [], count: 0 };
    }
    
    // Buscar o nome da trilha em uma consulta separada
    const { data: trackData } = await supabase
      .from('tracks')
      .select('name')
      .eq('id', trackId)
      .single();
    
    const trackName = trackData?.name || '';
    
    // Buscar progresso do usuário para os vídeos
    const videoIds = videosData.map(v => v.id);
    const { data: progressData } = await supabase
      .from('progress')
      .select('video_id, status, watch_time')
      .eq('user_id', userId)
      .in('video_id', videoIds);
    
    // Combinar os dados de vídeos com progresso
    const videosWithProgress = videosData.map(video => {
      const progress = progressData?.find(p => p.video_id === video.id);
      
      return {
        ...video,
        status: progress?.status || 'not_started',
        watch_time: progress?.watch_time || 0,
        track_name: trackName
      };
    });
    
    return { 
      data: videosWithProgress as VideoWithProgress[], 
      count: count || 0 
    };
  }

  async updateProgress(userId: string, videoId: number, status: 'not_started' | 'in_progress' | 'completed', watchTime: number): Promise<boolean> {
    // Verifica se já existe um registro de progresso
    const { data: existingProgress } = await supabase
      .from('progress')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();
    
    const now = new Date().toISOString();
    const completedAt = status === 'completed' ? now : null;
    
    if (existingProgress) {
      // Atualiza o progresso existente
      const { error } = await supabase
        .from('progress')
        .update({
          status,
          watch_time: watchTime,
          completed_at: completedAt
        })
        .eq('id', existingProgress.id);
      
      if (error) {
        console.error('Erro ao atualizar progresso:', error);
        return false;
      }
    } else {
      // Cria um novo registro de progresso
      const { error } = await supabase
        .from('progress')
        .insert({
          user_id: userId,
          video_id: videoId,
          status,
          watch_time: watchTime,
          completed_at: completedAt
        });
      
      if (error) {
        console.error('Erro ao criar progresso:', error);
        return false;
      }
    }
    
    return true;
  }
}

// DAO para Atividades
export class AssignmentDAO extends BaseDAO<Assignment, any, any> {
  constructor() {
    super('assignments');
  }

  async getAssignmentsWithDetails(
    page: number = 1,
    pageSize: number = 10,
    sortField: keyof Assignment | null = 'due_date',
    sortDirection: SortDirection = 'asc',
    searchTerm?: string,
    filters?: AssignmentFilters
  ): Promise<{ data: AssignmentWithDetails[], count: number }> {
    // Usar consulta simples sem joins
    let query = supabase
      .from('assignments')
      .select('*', { count: 'exact' });
    
    // Aplicar filtros
    if (filters) {
      if (filters.department_id) {
        query = query.eq('department_id', filters.department_id);
      }
      
      if (filters.track_id) {
        query = query.eq('track_id', filters.track_id);
      }
      
      if (filters.start_date) {
        query = query.gte('start_date', filters.start_date);
      }
      
      if (filters.due_date) {
        query = query.lte('due_date', filters.due_date);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
    }
    
    // Aplicar ordenação
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    
    // Aplicar paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data: assignmentsData, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar atividades:', error);
      return { data: [], count: 0 };
    }
    
    // Agora vamos buscar os detalhes de departamentos e trilhas em consultas separadas
    const departmentIds = assignmentsData
      .filter(a => a.department_id !== null)
      .map(a => a.department_id as number);
      
    const trackIds = assignmentsData
      .filter(a => a.track_id !== null)
      .map(a => a.track_id as number);
    
    // Buscar departamentos
    let departments: Department[] = [];
    if (departmentIds.length > 0) {
      const { data: deptsData } = await supabase
        .from('departments')
        .select('*')
        .in('id', departmentIds);
        
      if (deptsData) {
        departments = deptsData;
      }
    }
    
    // Buscar trilhas
    let tracks: Track[] = [];
    if (trackIds.length > 0) {
      const { data: tracksData } = await supabase
        .from('tracks')
        .select('*')
        .in('id', trackIds);
        
      if (tracksData) {
        tracks = tracksData;
      }
    }
    
    // Combinar os dados
    const assignmentsWithDetails: AssignmentWithDetails[] = assignmentsData.map(assignment => {
      const department = assignment.department_id 
        ? departments.find(d => d.id === assignment.department_id) || null
        : null;
        
      const track = assignment.track_id
        ? tracks.find(t => t.id === assignment.track_id) || null
        : null;
      
      return {
        ...assignment,
        department,
        track
      };
    });
    
    // Aplicar filtro de busca textual após obter os dados relacionados
    let filteredAssignments = assignmentsWithDetails;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredAssignments = assignmentsWithDetails.filter(a => 
        a.track?.name?.toLowerCase().includes(term) || 
        a.department?.name?.toLowerCase().includes(term)
      );
    }
    
    return { 
      data: filteredAssignments, 
      count: searchTerm ? filteredAssignments.length : (count || 0) 
    };
  }

  async getUserAssignments(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
    sortField: keyof Assignment | null = 'due_date',
    sortDirection: SortDirection = 'asc',
    status?: 'not_started' | 'in_progress' | 'completed' | 'expired'
  ): Promise<{ data: AssignmentWithDetails[], count: number }> {
    // Primeiro buscar o department_id do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('department_id')
      .eq('id', userId)
      .single();
    
    const departmentId = userData?.department_id;
    
    // Consulta para buscar atribuições do usuário ou do departamento do usuário
    // Usando consulta simples sem joins
    let query = supabase
      .from('assignments')
      .select('*', { count: 'exact' });
    
    // Construir a condição OR manualmente
    if (departmentId) {
      query = query.or(`user_id.eq.${userId},department_id.eq.${departmentId}`);
    } else {
      query = query.eq('user_id', userId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Aplicar ordenação
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }
    
    // Aplicar paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data: assignmentsData, error, count } = await query;
    
    if (error) {
      console.error('Erro ao buscar atribuições do usuário:', error);
      return { data: [], count: 0 };
    }
    
    // Agora vamos buscar os detalhes de departamentos e trilhas em consultas separadas
    const departmentIds = assignmentsData
      .filter(a => a.department_id !== null)
      .map(a => a.department_id as number);
      
    const trackIds = assignmentsData
      .filter(a => a.track_id !== null)
      .map(a => a.track_id as number);
    
    // Buscar departamentos
    let departments: Department[] = [];
    if (departmentIds.length > 0) {
      const { data: deptsData } = await supabase
        .from('departments')
        .select('*')
        .in('id', departmentIds);
        
      if (deptsData) {
        departments = deptsData;
      }
    }
    
    // Buscar trilhas
    let tracks: Track[] = [];
    if (trackIds.length > 0) {
      const { data: tracksData } = await supabase
        .from('tracks')
        .select('*')
        .in('id', trackIds);
        
      if (tracksData) {
        tracks = tracksData;
      }
    }
    
    // Combinar os dados
    const assignmentsWithDetails: AssignmentWithDetails[] = assignmentsData.map(assignment => {
      const department = assignment.department_id 
        ? departments.find(d => d.id === assignment.department_id) || null
        : null;
        
      const track = assignment.track_id
        ? tracks.find(t => t.id === assignment.track_id) || null
        : null;
      
      return {
        ...assignment,
        department,
        track
      };
    });
    
    return { 
      data: assignmentsWithDetails, 
      count: count || 0 
    };
  }
}

// DAO para Quiz
export class QuizDAO extends BaseDAO<QuizQuestion, any, any> {
  constructor() {
    super('quiz_questions');
  }

  async getQuizQuestionsWithAnswers(
    trackId: number
  ): Promise<QuizQuestionWithAnswers[]> {
    // Primeiro, buscar todas as perguntas do quiz
    const { data: questionsData, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('track_id', trackId);
    
    if (questionsError) {
      console.error('Erro ao buscar perguntas do quiz:', questionsError);
      return [];
    }
    
    if (!questionsData || questionsData.length === 0) {
      return [];
    }
    
    // Pegar todos os IDs de perguntas
    const questionIds = questionsData.map(q => q.id);
    
    // Buscar todas as respostas relacionadas a essas perguntas
    const { data: answersData, error: answersError } = await supabase
      .from('quiz_answers')
      .select('*')
      .in('question_id', questionIds);
    
    if (answersError) {
      console.error('Erro ao buscar respostas do quiz:', answersError);
      return questionsData.map(q => ({ ...q, answers: [] }));
    }
    
    // Combinar perguntas com suas respectivas respostas
    const questionsWithAnswers: QuizQuestionWithAnswers[] = questionsData.map(question => {
      // Filtrar respostas para esta pergunta e adicionar order_index
      const answers = answersData
        ? answersData
            .filter(answer => answer.question_id === question.id)
            .map((answer, index) => ({
              ...answer,
              order_index: index
            }))
        : [];
      
      return {
        ...question,
        answers
      };
    });
    
    return questionsWithAnswers;
  }

  async saveQuizAttempt(
    userId: string,
    questionId: number,
    answerId: number,
    responseTime: number,
    isCorrect: boolean,
    score: number
  ): Promise<boolean> {
    const { error } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: userId,
        question_id: questionId,
        answer_id: answerId,
        response_time: responseTime,
        is_correct: isCorrect,
        score: score
      });
    
    if (error) {
      console.error('Erro ao salvar tentativa de quiz:', error);
      return false;
    }
    
    return true;
  }

  async getQuizResults(
    userId: string,
    trackId: number
  ): Promise<{ totalQuestions: number, correctAnswers: number, totalScore: number, averageResponseTime: number }> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        question:quiz_questions!inner(*)
      `)
      .eq('user_id', userId)
      .eq('question.track_id', trackId);
    
    if (error) {
      console.error('Erro ao buscar resultados do quiz:', error);
      return { totalQuestions: 0, correctAnswers: 0, totalScore: 0, averageResponseTime: 0 };
    }
    
    // Calcular métricas
    const totalQuestions = data.length;
    const correctAnswers = data.filter(a => a.is_correct).length;
    const totalScore = data.reduce((sum, a) => sum + a.score, 0);
    const avgResponseTime = totalQuestions > 0
      ? data.reduce((sum, a) => sum + a.response_time, 0) / totalQuestions
      : 0;
    
    return {
      totalQuestions,
      correctAnswers,
      totalScore,
      averageResponseTime: avgResponseTime
    };
  }

  async getQuizQuestionById(questionId: number): Promise<QuizQuestionWithAnswers | null> {
    // Primeiro, buscar a pergunta
    const { data: questionData, error: questionError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('id', questionId)
      .single();
    
    if (questionError) {
      console.error('Erro ao buscar pergunta do quiz:', questionError);
      return null;
    }
    
    if (!questionData) {
      return null;
    }
    
    // Buscar as respostas relacionadas a esta pergunta
    const { data: answersData, error: answersError } = await supabase
      .from('quiz_answers')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at', { ascending: true });
    
    if (answersError) {
      console.error('Erro ao buscar respostas do quiz:', answersError);
      return {
        ...questionData,
        answers: []
      };
    }
    
    // Adicionar o campo order_index se não existir
    const answersWithOrder: QuizAnswerExtended[] = (answersData || []).map((answer, index) => ({
      ...answer,
      order_index: index
    }));
    
    return {
      ...questionData,
      answers: answersWithOrder
    };
  }

  async createQuestion(data: {
    question_text: string;
    track_id: number;
    created_by: string;
    answers: {
      answer_text: string;
      is_correct: boolean;
      order_index: number;
    }[];
    time_limit?: number;
  }): Promise<QuizQuestionWithAnswers | null> {
    try {
      console.log('Criando pergunta com dados:', JSON.stringify(data, null, 2));
      
      // Garantir que track_id seja um número
      const trackId = typeof data.track_id === 'string' ? parseInt(data.track_id) : data.track_id;
      
      if (isNaN(trackId) || trackId <= 0) {
        throw new Error('ID da trilha inválido');
      }
      
      // Verificar se pelo menos uma resposta está marcada como correta
      const hasCorrectAnswer = data.answers.some(answer => answer.is_correct);
      if (!hasCorrectAnswer) {
        throw new Error('Pelo menos uma resposta deve ser marcada como correta');
      }

      // Verificar se todas as respostas têm texto
      const emptyAnswers = data.answers.filter(answer => !answer.answer_text.trim());
      if (emptyAnswers.length > 0) {
        throw new Error('Todas as respostas devem ter texto');
      }
      
      // Dados a serem inseridos no banco
      const questionInsertData = {
        question_text: data.question_text,
        track_id: trackId,
        created_at: new Date().toISOString(),
        created_by: data.created_by,
        time_limit: data.time_limit || 60 // Valor padrão para time_limit em segundos
      };
      
      console.log('Inserindo pergunta no banco:', JSON.stringify(questionInsertData, null, 2));
      
      // Iniciar uma transação para criar a pergunta e suas respostas
      // Primeiro, inserir a pergunta
      const { data: questionData, error: questionError } = await supabase
        .from('quiz_questions')
        .insert(questionInsertData)
        .select()
        .single();
      
      if (questionError) {
        console.error('Erro ao criar pergunta do quiz:', questionError);
        console.error('Código do erro:', questionError.code);
        console.error('Detalhes do erro:', questionError.details);
        console.error('Mensagem do erro:', questionError.message);
        throw new Error(`Erro ao criar pergunta: ${questionError.message}`);
      }
      
      if (!questionData) {
        console.error('Não foi possível criar a pergunta - nenhum dado retornado');
        throw new Error('Falha ao criar a pergunta: nenhum dado retornado');
      }
      
      console.log('Pergunta criada com sucesso:', JSON.stringify(questionData, null, 2));
      
      // Depois, inserir as respostas
      const currentDate = new Date().toISOString();
      const answersToInsert = data.answers.map(answer => ({
        question_id: questionData.id,
        answer_text: answer.answer_text,
        is_correct: answer.is_correct,
        created_at: currentDate
      }));
      
      console.log('Inserindo respostas no banco:', JSON.stringify(answersToInsert, null, 2));
      
      const { data: answersData, error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answersToInsert)
        .select();
      
      if (answersError) {
        console.error('Erro ao criar respostas do quiz:', answersError);
        console.error('Código do erro:', answersError.code);
        console.error('Detalhes do erro:', answersError.details);
        console.error('Mensagem do erro:', answersError.message);
        
        // Remover a pergunta em caso de falha nas respostas
        console.log('Removendo pergunta devido a erro nas respostas:', questionData.id);
        await supabase
          .from('quiz_questions')
          .delete()
          .eq('id', questionData.id);
          
        throw new Error(`Erro ao criar respostas: ${answersError.message}`);
      }
      
      console.log('Respostas criadas com sucesso:', JSON.stringify(answersData, null, 2));
      
      // Adicionar order_index manualmente para o valor de retorno
      const answersWithOrder = (answersData || []).map((answer, index) => ({
        ...answer,
        order_index: index
      }));
      
      return {
        ...questionData,
        answers: answersWithOrder
      };
    } catch (error) {
      console.error('Erro ao criar pergunta e respostas:', error);
      return null;
    }
  }

  async updateQuestion(questionId: number, data: {
    question_text: string;
    track_id: number;
    answers: {
      answer_text: string;
      is_correct: boolean;
      order_index: number;
    }[];
    time_limit?: number;
  }): Promise<QuizQuestionWithAnswers | null> {
    try {
      console.log('Atualizando pergunta ID', questionId, 'com dados:', JSON.stringify(data, null, 2));
      
      // Garantir que track_id seja um número
      const trackId = typeof data.track_id === 'string' ? parseInt(data.track_id) : data.track_id;
      
      if (isNaN(trackId) || trackId <= 0) {
        throw new Error('ID da trilha inválido');
      }
      
      // Verificar se pelo menos uma resposta está marcada como correta
      const hasCorrectAnswer = data.answers.some(answer => answer.is_correct);
      if (!hasCorrectAnswer) {
        throw new Error('Pelo menos uma resposta deve ser marcada como correta');
      }

      // Verificar se todas as respostas têm texto
      const emptyAnswers = data.answers.filter(answer => !answer.answer_text.trim());
      if (emptyAnswers.length > 0) {
        throw new Error('Todas as respostas devem ter texto');
      }
      
      // Buscar o valor atual de time_limit se não for fornecido
      let timeLimit = data.time_limit;
      if (!timeLimit) {
        console.log('Buscando time_limit atual para ID', questionId);
        const { data: currentQuestion, error: fetchError } = await supabase
          .from('quiz_questions')
          .select('time_limit')
          .eq('id', questionId)
          .single();
          
        if (fetchError) {
          console.error('Erro ao buscar time_limit atual:', fetchError);
        }
        
        timeLimit = currentQuestion?.time_limit || 60;
        console.log('time_limit encontrado:', timeLimit);
      }
      
      // Dados para atualização
      const updateData = {
        question_text: data.question_text,
        track_id: trackId,
        time_limit: timeLimit
      };
      
      console.log('Atualizando pergunta com dados:', JSON.stringify(updateData, null, 2));
      
      // Atualizar a pergunta
      const { data: questionData, error: questionError } = await supabase
        .from('quiz_questions')
        .update(updateData)
        .eq('id', questionId)
        .select()
        .single();
      
      if (questionError) {
        console.error('Erro ao atualizar pergunta do quiz:', questionError);
        console.error('Código do erro:', questionError.code);
        console.error('Detalhes do erro:', questionError.details);
        console.error('Mensagem do erro:', questionError.message);
        throw new Error(`Erro ao atualizar pergunta: ${questionError.message}`);
      }
      
      if (!questionData) {
        console.error('Não foi possível atualizar a pergunta - nenhum dado retornado');
        throw new Error('Falha ao atualizar a pergunta: nenhum dado retornado');
      }
      
      console.log('Pergunta atualizada com sucesso:', JSON.stringify(questionData, null, 2));
      console.log('Excluindo respostas antigas para ID', questionId);
      
      // Remover respostas antigas
      const { error: deleteError } = await supabase
        .from('quiz_answers')
        .delete()
        .eq('question_id', questionId);
      
      if (deleteError) {
        console.error('Erro ao excluir respostas antigas:', deleteError);
        console.error('Código do erro:', deleteError.code);
        console.error('Detalhes do erro:', deleteError.details);
        console.error('Mensagem do erro:', deleteError.message);
        throw new Error(`Erro ao excluir respostas antigas: ${deleteError.message}`);
      }
      
      console.log('Respostas antigas excluídas com sucesso');
      
      // Inserir novas respostas
      const currentDate = new Date().toISOString();
      const answersToInsert = data.answers.map(answer => ({
        question_id: questionId,
        answer_text: answer.answer_text,
        is_correct: answer.is_correct,
        created_at: currentDate
      }));
      
      console.log('Inserindo novas respostas:', JSON.stringify(answersToInsert, null, 2));
      
      const { data: answersData, error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answersToInsert)
        .select();
      
      if (answersError) {
        console.error('Erro ao criar novas respostas:', answersError);
        console.error('Código do erro:', answersError.code);
        console.error('Detalhes do erro:', answersError.details);
        console.error('Mensagem do erro:', answersError.message);
        throw new Error(`Erro ao criar novas respostas: ${answersError.message}`);
      }
      
      console.log('Novas respostas criadas com sucesso:', JSON.stringify(answersData, null, 2));
      
      // Adicionar order_index manualmente para o valor de retorno
      const answersWithOrder = (answersData || []).map((answer, index) => ({
        ...answer,
        order_index: index
      }));
      
      return {
        ...questionData,
        answers: answersWithOrder
      };
    } catch (error) {
      console.error('Erro ao atualizar pergunta:', error);
      return null;
    }
  }

  async deleteQuestion(questionId: number): Promise<boolean> {
    // Primeiro excluir as respostas
    const { error: answersError } = await supabase
      .from('quiz_answers')
      .delete()
      .eq('question_id', questionId);
    
    if (answersError) {
      console.error('Erro ao excluir respostas:', answersError);
      return false;
    }
    
    // Depois excluir a pergunta
    const { error: questionError } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', questionId);
    
    if (questionError) {
      console.error('Erro ao excluir pergunta:', questionError);
      return false;
    }
    
    return true;
  }
}

// DAO para Certificados
export class CertificateDAO extends BaseDAO<Certificate, any, any> {
  constructor() {
    super('certificates');
  }

  async getUserCertificates(
    userId: string
  ): Promise<(Certificate & { track_name: string })[]> {
    // Primeiro, buscar os certificados do usuário
    const { data: certificatesData, error: certificatesError } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('issue_date', { ascending: false });
    
    if (certificatesError) {
      console.error('Erro ao buscar certificados do usuário:', certificatesError);
      return [];
    }
    
    if (!certificatesData || certificatesData.length === 0) {
      return [];
    }
    
    // Buscar todas as trilhas relacionadas aos certificados
    const trackIds = certificatesData.map(cert => cert.track_id);
    const { data: tracksData, error: tracksError } = await supabase
      .from('tracks')
      .select('id, name')
      .in('id', trackIds);
    
    if (tracksError) {
      console.error('Erro ao buscar trilhas para certificados:', tracksError);
      // Retornar certificados sem nomes de trilhas
      return certificatesData.map(cert => ({
        ...cert,
        track_name: 'Trilha não encontrada'
      }));
    }
    
    // Combinar certificados com nomes de trilhas
    const certificatesWithTrackNames = certificatesData.map(cert => {
      const track = tracksData?.find(t => t.id === cert.track_id);
      return {
        ...cert,
        track_name: track?.name || 'Trilha não encontrada'
      };
    });
    
    return certificatesWithTrackNames as (Certificate & { track_name: string })[];
  }

  async issueCertificate(
    userId: string,
    trackId: number
  ): Promise<boolean> {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        track_id: trackId,
        issue_date: now
      });
    
    if (error) {
      console.error('Erro ao emitir certificado:', error);
      return false;
    }
    
    return true;
  }
}

// Exporta instâncias das DAOs para uso em toda a aplicação
export const userDAO = new UserDAO();
export const departmentDAO = new DepartmentDAO();
export const trackDAO = new TrackDAO();
export const videoDAO = new VideoDAO();
export const assignmentDAO = new AssignmentDAO();
export const quizDAO = new QuizDAO();
export const certificateDAO = new CertificateDAO(); 