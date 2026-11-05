# `@grok-hack/api-contract`

Shared request and response types for the games API. The frontend can depend on this package directly. It has no Next.js or Supabase dependency.

```ts
import { createGameRequestSchema, apiPaths, type Game } from '@grok-hack/api-contract';
```

The human-readable contract and the OpenAPI document live in [`docs/`](../../docs/).
