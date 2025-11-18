# Lousa Digital Integrated Studio Tool

O **Lousa Digital Integrated Studio Tool** é uma aplicação desktop independente (Electron) para criação, edição e empacotamento de **extensões** (plugins) para a plataforma Lousa Digital.

## 📋 O que você pode criar

- **Lesson Templates** (modelos de aula pré-configurados)
- **Tool Plugins** (ferramentas didáticas customizadas)
- **Theme Packs** (temas visuais e paletas de cores)
- **Integration Plugins** (integrações com sistemas externos)
- **Resource Packs** (coleções de imagens, vídeos, áudio)

## 🏗️ Arquitetura

Este projeto segue os princípios de **Clean Architecture** e está dividido em:

- **Studio Tool**: Aplicação desktop Electron para criar extensões
- **Extension Runtime**: Módulo para carregar extensões na aplicação principal
- **Shared Types**: Tipos e schemas compartilhados
- **Cloud Resource Manager**: Gerenciamento de recursos na nuvem

### Tecnologias

- **Frontend**: React + TypeScript + Tailwind CSS
- **Desktop**: Electron
- **Build**: Vite
- **Validation**: Ajv (JSON Schema)
- **Testing**: Vitest

## 🚀 Começando

### Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0

### Instalação

```bash
# Instalar dependências
npm install

# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Criar pacote desktop
npm run package
```

## 📦 Estrutura do Projeto

```
piloto-lousa-digital-studio/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts
│   │   └── preload.ts
│   ├── renderer/             # React UI
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles/
│   ├── shared/               # Shared code
│   │   ├── types/            # TypeScript types
│   │   ├── schemas/          # JSON schemas
│   │   └── utils/            # Utilities
│   └── modules/
│       └── extensions/       # Extension Runtime Module
│           ├── ExtensionRegistry.ts
│           ├── CloudResourceManager.ts
│           └── index.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.main.config.ts       # Vite config for main process
├── vite.renderer.config.ts   # Vite config for renderer
└── tailwind.config.js
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia em modo desenvolvimento
- `npm run build` - Build para produção
- `npm run type-check` - Verificação de tipos TypeScript
- `npm run lint` - Linting com ESLint
- `npm run test` - Executa testes
- `npm run package` - Cria pacote executável

## 📖 Documentação

Para documentação completa da especificação, veja os ADRs relacionados:

- ADR-006: Plugin/Extension System
- ADR-007: Cloud Storage Integration
- ADR-003: Clean Architecture
- ADR-001: Technology Stack

## 🔐 Segurança

- Validação de manifesto com JSON Schema
- Checksums SHA-256 para integridade
- Assinatura digital de pacotes
- Sandboxing de extensões
- Permissões granulares

## 📝 Formato de Pacote (.ldip)

Extensões são empacotadas em arquivos `.ldip` (Lousa Digital Integrated Plugin):

```
extension.ldip (ZIP)
├── manifest.json        # Metadados e configuração
├── templates/           # Templates (se template-pack)
├── scripts/             # Lifecycle hooks
└── schemas/             # Configuração schemas
```

Recursos grandes (imagens, vídeos) são armazenados na nuvem, não no pacote.

## 🤝 Contribuindo

Este é um projeto piloto. Para contribuir:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja LICENSE para detalhes

## 👥 Time

- Product Orchestrator
- Architecture & Platform Team

---

**Status**: Em desenvolvimento (Versão 1.0.0 - MVP)  
**Última atualização**: 2025-01-18
