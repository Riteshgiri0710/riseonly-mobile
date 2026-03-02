# Riseonly App

---

# Quick Start

1. Clone the repo
2. `bun i` (or `yarn` / `npm i`) — bun preferred
3. `npx expo run`

---

# About the architecture

Feature-style modules in `src/`, shared **core** (api, config, lib, stores, ui, widgets), and **mobxSaiWs** for all real-time/CRUD over WebSocket. everything else goes through WebSocket with caching and optimistic updates.

---

# Architecture overview

```
src/
├── app/           # main.tsx, App.tsx, layouts, router
├── assets/        # animations, fonts, icons, images, sounds, styles
├── core/          # api, config, hooks, lib, locales, storage, stores, ui, utils, widgets
└── modules/       # feature modules (auth, chat, user, post, …)
```

---

# `core/` — shared layer

```
core/
├── api/              # Axios instance (HTTP for auth, file uploads). Base URL from .env
├── config/           # Constants, types, regex, mock cache
├── hooks/            # Global React hooks
├── lib/              # Utilities and mobx-toolbox
├── locales/          # i18n (en, ru)
├── storage/          # AsyncStorage wrappers
├── stores/           # Global MobX stores (ws, file, events, tag, global-interactions, memory)
├── ui/               # Reusable UI components
├── utils/            # Helpers (console, functions, jwt, notifications, …)
└── widgets/          # Wrappers, navigations
```

---

## `core/config/`

App constants, regex, global types. `mock.ts` holds offline mock cache for DebuggerUi (export/import mock data).

---

## `core/lib/` — mobx-toolbox and utilities

Main piece: **mobxSaiWs** (WebSocket-based). No HTTP fetch layer like React Query — all request/response flows go over one WebSocket with `service` + `method`, with caching, optimistic updates, and infinite scroll.

```
lib/
├── mobx-toolbox/
│   ├── mobxSaiWs/        # WebSocket requests, cache, optimistic updates, infinite scroll
│   ├── mobxDebouncer/    # Debounced actions
│   ├── useMobxForm/      # Form + validation
│   ├── useMobxUpdate/    # Nested state updates (used inside mobxSaiWs)
│   └── saiFileUpload/    # File upload orchestration
├── date/                 # Date formatting
├── debuggerUi/           # In-app debug panel
├── global/               # Array/Object extensions
├── helpers/              # checker(), logger
├── navigation/           # Navigation ref and helpers
├── notifier/             # Toasts
├── numbers/              # Number formatting
├── obj/                  # Object path/get
├── performance/          # Debounce, optimized callbacks
├── string/               # String utils
├── text/                 # Text formatting
└── theme/                # Colors, gradients
```

---

## `core/stores/`

Global stores: WebSocket API store (whichUrl dev/prod, init), file upload, events, tag, global-interactions and etc.

---

## `core/utils/`

- **`console`** (`@utils/console`): `log` / `warn` / `error` that only run in `__DEV__`. Use instead of raw `console.*` so production builds stay clean.
- **`logger`** (`@lib/helpers`): Colored logging (info, success, warning, error); entries show in DebuggerUi Logger tab.
- Plus: device-info, haptics, jwt, notifications, etc.

---

# `modules/` — feature modules

Each module is self-contained: pages, components, stores (S.A.I), widgets, shared config/schemas.

```
modules/
├── auth/             # Sign in/up, tokens
├── chat/             # Chats, messages, reactions, stickers
├── comment/          # Comments
├── user/             # Profile, subscription, settings
├── post/             # Posts
├── notify/           # Notifications
├── search/           # User and post search
├── moderation/       # Moderation
├── session/          # Sessions
├── theme/            # Theme store
├── sticker/          # Sticker packs
├── report/            # Reports
├── subscription/     # Subscriptions
└── onboarding/       # Onboarding
```

---

# S.A.I store layout

- **S — Services**: Handlers (success/error), derived state, “boilerplate” between actions and UI.
- **A — Actions**: Request functions and request state. All server calls go through **mobxSaiWs** (WebSocket) or axios for auth/file uploads.
- **I — Interactions**: UI logic, what to show when, navigation, modals.

Example:

```
auth/stores/
├── auth-actions/       # login, refresh, logout — mobxSaiWs or axios
├── auth-interactions/  # Sign in/up flow, redirects
├── auth-service/      # Token storage, success/error handlers
└── index.ts
```

---

# mobxSaiWs — WebSocket requests with cache and optimistic updates and etc

All main API calls (messages, chats, profile, posts, etc.) use **mobxSaiWs**: one WebSocket connection, requests by `service` + `method`, with:

- In-memory and localStorage cache
- Optimistic updates (temp data → replace with server response)
- Infinite scroll (dataScope, scrollRef, top/bot percentage)
- Shadow requests (e.g. only when route is Chat)
- Queue and retry options

## Basic usage (in a store)

```tsx
import { mobxSaiWs } from '@lib/mobx-toolbox/mobxSaiWs';
import { MobxSaiWsInstance } from '@lib/mobx-toolbox/mobxSaiWs/types';

class MessageActionsStore {
  messages: MobxSaiWsInstance<GetMessagesResponse> = {};

  getMessagesAction = async () => {
    this.messages = mobxSaiWs(
      params,
      {
        id: `getMessages-${chatId}`,
        service: 'message',
        method: 'get_messages',
        pathToArray: 'messages',
        storageCache: true,
        takeCachePriority: 'localStorage',
        onSuccess: getMessagesSuccessHandler,
        onError: getMessagesErrorHandler,
        dataScope: {
          startFrom: 'bot',
          scrollRef: messagesScrollRef,
          topPercentage: 20,
          botPercentage: 80,
          setParams,
          relativeParamsKey: 'relative_id',
          upOrDownParamsKey: 'up',
          isHaveMoreResKey: 'is_have_more',
          scopeLimit: 200,
        },
        fetchAddTo: { path: 'messages', addTo: 'end' },
      }
    );
  };
}
```

## Instance shape (MobxSaiWsInstance)

- `data`, `error`, `body`
- `status`, `isPending`, `isFulfilled`, `isRejected`
- Scope: `scopeStatus`, `isScopePending`, `isHaveMoreTop`, `isHaveMoreBot`
- `saiUpdater(id, key, valueOrUpdater, idKey, cacheId, updateCache)` — update cache (memory and/or localStorage)
- `fetch()`, `reset()`

---

# DebuggerUi

Floating debug panel (dev only): Requests (WebSocket + HTTP), cache, logger, localStorage, mock import/export. Same idea as in the original template — all logs from `logger` and from `console` (from `@utils/console`) appear in the Logger tab; in production, `console` does nothing.

---

# Theming

Controlled by `@modules/theme/stores`. Theme tokens (bg_*, text_*, primary_*, radius_*, etc.) are used across `core/ui`. Change theme via theme store; UI updates reactively.

---

# Creating a new module

```
modules/your-feature/
├── pages/
│   └── YourPage.tsx
├── stores/
│   ├── your-actions/      # mobxSaiWs(…) or axios calls
│   ├── your-interactions/
│   ├── your-service/
│   └── index.ts
├── widgets/
├── shared/
│   ├── config/
│   └── schemas/
└── components/
```

Use path aliases: `@auth`, `@chat`, `@user`, `@lib`, `@stores`, `@core`, etc. (see `babel.config.js`).

---

# Contact

Telegram: [@nics51](https://t.me/nics51)

---

Made with ❤️
