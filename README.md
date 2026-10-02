# cloudflare-os-lab

Public lab Worker that explains [Cloudflare OS](https://os.cloudflare.app/) concepts with a working isolated-state gadget.

**Canonical URL:** https://os.rclabs.in  
**Worker name:** `cloudflare-os-lab`  
**Repo:** https://github.com/chandrasekar-r/cloudflare-os-lab

## What it proves

| Concept | In the real OS | In this lab |
| --- | --- | --- |
| Workspace | Durable Object per agent workspace | Per-room Durable Object (`GadgetRoom`) via `idFromName` |
| Gadgets | Dynamic Worker Facets (isolated) | Separate DO instances per room id — mutate A, B unchanged |
| Gatekeepers | Capability-based access, human-in-the-loop | Client-side grant/deny simulator (no credentials) |

This is **not** a full Cloudflare OS deploy. A company OS typically needs Cloudflare Access and AI Gateway. This hostname is a public explainer.

## API

```bash
# Health
curl -sS https://os.rclabs.in/api/health

# Create / open a room
curl -sS https://os.rclabs.in/api/room \
  -H 'content-type: application/json' \
  -d '{"room":"demo-alpha"}'

# Read state
curl -sS https://os.rclabs.in/api/room/demo-alpha

# Move (tic-tac-toe cell 0..8)
curl -sS https://os.rclabs.in/api/room/demo-alpha \
  -H 'content-type: application/json' \
  -d '{"action":"move","cell":4}'

# Reset
curl -sS https://os.rclabs.in/api/room/demo-alpha \
  -H 'content-type: application/json' \
  -d '{"action":"reset"}'
```

## Deploy notes

- Bindings: Durable Object `GADGET` → class `GadgetRoom` (SQLite-backed, migration tag `v1`).
- Site Ops owns custom domain bind for `os.rclabs.in`. Do not attach domains from scripts here.
- Temporary smoke host: `https://cloudflare-os-lab.rcgpt.workers.dev`.

## Links

- https://os.cloudflare.app/
- https://github.com/cloudflare/cloudflare-os
- Related demos: https://clef-kv.rclabs.in · https://clef-precheck.rclabs.in
