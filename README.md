# GoAcademy - Plataforma de Aprendizado Corporativo

GoAcademy é uma plataforma de aprendizado corporativo (Learning Management System - LMS) desenvolvida com React, TypeScript e Supabase, seguindo o esquema SQL existente.

## Atualizações Recentes

### Correção do Sistema de Quizzes

- Melhorias no tratamento de erros nos métodos `createQuestion` e `updateQuestion`
- Adicionado campo `created_at` consistente para os objetos de resposta
- Melhorada a validação de formulários para evitar criação de quizzes inválidos
- Implementada atualização automática da lista de perguntas após edição
- Adicionada verificação para garantir que o usuário esteja logado
- Melhoradas as mensagens de erro para facilitar a resolução de problemas
- Corrigido o tratamento de tipos para o campo `track_id`
- Implementada validação adicional para evitar IDs de trilha inválidos
- Adicionados logs de debug para facilitar a identificação de problemas
- Melhorado o tratamento quando nenhuma trilha é selecionada
- Adicionado campo `time_limit` para perguntas conforme exigido pelo banco de dados
- Criado tipo `QuizAnswerExtended` para incluir o campo `order_index` necessário
- Garantido que as perguntas sejam ordenadas corretamente por data de criação

## Tecnologias

- React 19
- TypeScript
- Supabase (Autenticação e Banco de Dados)
- TailwindCSS
- React Router Dom
- React Query
- React Hook Form
- Zod (Validação)
- Headless UI

## Funcionalidades

- **Autenticação de Usuários**
  - Login
  - Registro
  - Recuperação de Senha
  - Proteção de Rotas

- **Dashboard de Usuário**
  - Resumo de progresso
  - Trilhas recentes
  - Atividades pendentes
  - Certificados

- **Perfil do Usuário**
  - Visualização e edição de informações pessoais
  - Gerenciamento de avatar
  - Visualização de certificados obtidos

- **Gestão de Atividades**
  - Listagem de atividades atribuídas
  - Detalhes da atividade e progresso
  - Alteração de status de atividades

- **Gestão de Trilhas e Vídeos**
  - Listagem de trilhas com filtros e paginação
  - Detalhes da trilha com lista de vídeos e progresso
  - Player de vídeo com rastreamento de progresso
  - Sistema de quiz interativo

- **Avaliação e Certificados**
  - Sistema de quiz interativo
  - Cálculo de pontuação baseado em tempo de resposta
  - Resultados detalhados após quiz
  - Emissão de certificados para trilhas concluídas

- **Painel Administrativo Completo**
  - Dashboard com estatísticas gerais
  - Gestão de usuários e departamentos
  - Gestão de trilhas e conteúdos
    - Interface CRUD completa para trilhas
    - Gestão de conteúdos associados (vídeos e quizzes)
  - Gestão de atribuições
    - Atribuição de trilhas a usuários/departamentos
    - Filtros por departamento, trilha e status
  - Sistema de quizzes
    - Criação e edição de perguntas
    - Gestão de alternativas e respostas corretas
  - Resultados de quizzes
    - Estatísticas detalhadas de tentativas
    - Métricas por usuário e gerais
  - Gestão de certificados
    - Emissão e gerenciamento
    - Integração com usuários e trilhas
  - Sistema de relatórios
    - Visualizações gráficas de desempenho
    - Filtros por departamento e trilha

## Estrutura do Projeto

```
src/
├── assets/           # Recursos estáticos (imagens, ícones)
├── components/       # Componentes reutilizáveis
│   ├── auth/         # Componentes de autenticação
│   ├── common/       # Componentes comuns (botões, inputs, etc)
│   └── layouts/      # Layouts da aplicação
├── context/          # Contextos React (AuthContext, etc)
├── lib/              # Bibliotecas e configurações (Supabase, DAOs, etc)
├── pages/            # Páginas da aplicação
│   ├── admin/        # Páginas administrativas
│   │   ├── Assignments.tsx       # Gestão de atribuições
│   │   ├── AssignmentDetails.tsx # Detalhes de atribuições
│   │   ├── Certificates.tsx      # Gerenciamento de certificados
│   │   ├── Dashboard.tsx         # Dashboard administrativo
│   │   ├── Departments.tsx       # Gerenciamento de departamentos
│   │   ├── DepartmentDetails.tsx # Detalhes de departamentos
│   │   ├── Quizzes.tsx           # Gerenciamento de quizzes
│   │   ├── QuizResults.tsx       # Resultados de quizzes
│   │   ├── Reports.tsx           # Relatórios e análises
│   │   ├── Tracks.tsx            # Gerenciamento de trilhas
│   │   ├── TrackDetails.tsx      # Detalhes de trilhas
│   │   ├── Users.tsx             # Gerenciamento de usuários
│   │   └── UserDetails.tsx       # Detalhes de usuários
│   ├── Dashboard.tsx     # Dashboard do usuário
│   ├── LessonDetails.tsx # Player de vídeo e progresso
│   ├── QuizView.tsx      # Sistema de quiz interativo
│   ├── Tracks.tsx        # Listagem de trilhas
│   └── UserProfile.tsx   # Perfil do usuário
├── types/            # Definições de tipos TypeScript
└── utils/            # Funções utilitárias
```

## Modelo de Banco de Dados

O projeto segue o esquema SQL existente com as seguintes tabelas principais:

- **users**: Usuários do sistema com papéis 'admin', 'instructor', 'collaborator'
- **departments**: Departamentos da empresa
- **tracks**: Trilhas de aprendizado (track, pill, grid)
- **videos**: Vídeos associados às trilhas
- **assignments**: Atribuições de trilhas para usuários
- **progress**: Progresso dos usuários nos vídeos
- **quiz_questions/quiz_answers/quiz_attempts**: Sistema de quiz
- **certificates**: Certificados emitidos para usuários

## Configuração do Ambiente

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Crie um arquivo `.env` com as seguintes variáveis:
   ```
   # Supabase - Obtenha esses valores no console do Supabase
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
   
   # Outras configurações (opcionais)
   VITE_APP_NAME=Go Academy
   VITE_API_BASE_URL=/api
   ```
4. Certifique-se de que o esquema do banco de dados no Supabase corresponde ao descrito em `sql/`
5. Inicie o servidor de desenvolvimento: `npm run dev`

## Navegação na Aplicação

A aplicação possui as seguintes rotas principais:

Área do Usuário:
- `/dashboard` - Dashboard principal
- `/dashboard/tracks` - Listagem de trilhas disponíveis
- `/dashboard/tracks/:trackId` - Detalhes de uma trilha específica
- `/dashboard/lessons/:lessonId` - Visualização de uma aula/vídeo
- `/dashboard/quiz/:trackId` - Realização de quiz para uma trilha
- `/dashboard/profile` - Perfil do usuário
- `/dashboard/assignments` - Listagem de atividades do usuário

Área Administrativa:
- `/admin` - Dashboard administrativo
- `/admin/users` - Gerenciamento de usuários
- `/admin/users/:userId` - Detalhes e edição de usuário
- `/admin/departments` - Gerenciamento de departamentos
- `/admin/departments/:departmentId` - Detalhes e edição de departamento
- `/admin/tracks` - Gerenciamento de trilhas de aprendizado
- `/admin/tracks/:trackId` - Detalhes e edição de trilha
- `/admin/quizzes` - Gerenciamento de quizzes
- `/admin/quiz-results` - Resultados de quizzes realizados
- `/admin/assignments` - Gerenciamento de atribuições
- `/admin/assignments/:assignmentId` - Detalhes e edição de atribuição
- `/admin/reports` - Relatórios de desempenho
- `/admin/certificates` - Gestão de certificados

## Otimizações de Performance

A plataforma foi estruturada com foco em desempenho, implementando:

- **Consultas SQL Otimizadas**: Utilização de JOINs e subconsultas eficientes para evitar problemas N+1
- **Paginação e Filtragem Eficiente**: Implementada no backend para reduzir volume de dados transferidos
- **Camada DAO**: Padrão para acesso otimizado ao banco de dados
- **Caching com React Query**: Redução de chamadas desnecessárias à API
- **Carregamento Otimizado**: Carregamento sob demanda de componentes e recursos

## Contribuindo

1. Faça o fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Envie para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT.
