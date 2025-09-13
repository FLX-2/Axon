# Compilation Fixes for Unified Storage Architecture

## Overview
To resolve tauri dev errors:
- Missing tokio dependency in main code.
- Mutable borrow error in cache cleanup.
- Unused mut warnings.
- Bin/lib target name collision.

These fixes will enable compilation. After fixes, verify with `npm run tauri dev`.

## Fix 1: Add Tokio to Dependencies
In [`src-tauri/Cargo.toml`](src-tauri/Cargo.toml):
- Move/add tokio to [dependencies] with features for async runtime and time.

SEARCH/REPLACE:
```
<<<<<<< SEARCH
:start_line:50
-------
[dev-dependencies]
tokio = { version = "1.0", features = ["full"] }
=======
[dependencies]
tokio = { version = "1.0", features = ["rt-multi-thread", "time", "macros"] }

[dev-dependencies]
tokio = { version = "1.0", features = ["full"] }
>>>>>>> REPLACE
```

## Fix 2: Resolve Borrow Error in Cache Cleanup
In [`src-tauri/src/settings_manager.rs`](src-tauri/src/settings_manager.rs:847-854):
- Collect keys to remove in Vec to avoid borrowing issues.

SEARCH/REPLACE:
```
<<<<<<< SEARCH
:start_line:847
-------
            let mut entries: Vec<_> = cache.iter().collect();
            entries.sort_by_key(|(_, entry)| entry.access_count);
            
            let to_remove = cache.len() - 40; // Keep 40 entries
            for (key, _) in entries.iter().take(to_remove) {
                cache.remove(*key);
            }
=======
            let mut entries: Vec<_> = cache.iter().collect();
            entries.sort_by_key(|(_, entry)| entry.access_count);
            
            let to_remove = cache.len() - 40; // Keep 40 entries
            let keys_to_remove: Vec<&String> = entries.iter().take(to_remove).map(|(k, _)| k).collect();
            for key in keys_to_remove {
                cache.remove(key);
            }
>>>>>>> REPLACE
```

## Fix 3: Remove Unused Mut Variables
In [`src-tauri/src/migration.rs`](src-tauri/src/migration.rs):
- Remove `mut` from non-mutated variables (e.g., lines ~1450, ~976, etc.).

Multiple blocks:
```
<<<<<<< SEARCH
:start_line:1450
-------
        let mut warnings = Vec::new();
=======
        let warnings = Vec::new();
>>>>>>> REPLACE
```

```
<<<<<<< SEARCH
:start_line:976
-------
        let mut all_valid = true;
=======
        let all_valid = true;
>>>>>>> REPLACE
```

(Apply similar for other instances like line 730, 731 if present.)

## Fix 4: Rename Bin Target
In [`src-tauri/Cargo.toml`](src-tauri/Cargo.toml):
- Add [[bin]] section with unique name to avoid collision.

SEARCH/REPLACE (after [lib]):
```
<<<<<<< SEARCH
:start_line:13
-------
[lib]
name = "axon"
crate-type = ["cdylib", "rlib"]
=======
[lib]
name = "axon"
crate-type = ["cdylib", "rlib"]

[[bin]]
name = "axon-app"
path = "src/main.rs"
>>>>>>> REPLACE
```

## Verification
- Run `cargo check` in src-tauri/.
- Then `npm run tauri dev`.
- If successful, proceed to tasks 11-12.
