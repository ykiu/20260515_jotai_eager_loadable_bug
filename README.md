# Bug: `jotai-eager` `loadable` gets stuck in `hasError`

When the atom passed to `loadable` (from `jotai-eager`) transitions from an error state back to a resolved state, the `loadable` wrapper remains in `hasError` instead of updating to `hasData`.

The equivalent `loadable` from `jotai/utils` does not have this problem.

## Reproduction

```
npm install
npm test
```

One test passes (`jotai/utils`) and one fails (`jotai-eager`):

```
✓ jotai/utils: recovers from hasError to hasData
× jotai-eager: gets stuck in hasError even after error is resolved
  → expected 'hasError' to be 'hasData'
```

## Additional observation

The `jotai-eager` test also emits the following deprecation warning repeatedly:

```
[DEPRECATED] setSelf is deprecated and will be removed in v3.
```

## Versions

- `jotai`: 2.20.0
- `jotai-eager`: 0.2.4
