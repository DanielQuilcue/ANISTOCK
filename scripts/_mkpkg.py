#!/usr/bin/env python3
"""Mini package installer for anistock via jsDelivr (npm registry is blocked).

Downloads the published npm tarball contents for a package (and its
`dependencies`) into node_modules so Next.js bundler can resolve them.
No lockfile entries are created; a later `npm install` over a working
registry will produce the canonical lockfile.

Usage:
    mkpkg.py <node_modules_root> pkg@version [pkg@version ...]
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

DATA = "https://data.jsdelivr.com/v1/packages/npm/"
CDN = "https://cdn.jsdelivr.net/npm/"
MAX_RETRIES = 6
RETRY_SLEEP = 2.5


def fetch(url: str, binary: bool = False):
    last = None
    for i in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "mkpkg"})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            return data
        except urllib.error.HTTPError as e:
            if e.code in (404, 403):
                raise
            last = e
        except Exception as e:  # noqa: BLE001 - network flakes
            last = e
        time.sleep(RETRY_SLEEP)
    raise RuntimeError(f"fetch failed: {url} ({last})")


def fetch_json(url):
    return json.loads(fetch(url).decode("utf-8"))


def parts_of_ver(ver):
    m = re.match(r"(\d+)\.(\d+)\.(\d+)(.*)$", ver or "")
    if not m:
        return (0, 0, 0, ver or "")
    return (int(m.group(1)), int(m.group(2)), int(m.group(3)), m.group(4))


def satisfies(ver, rng):
    rng = rng.strip()
    if not ver or not rng or rng in ("*", "latest", "x"):
        return bool(ver)
    v = parts_of_ver(ver)
    if rng.startswith("^"):
        base = parts_of_ver(rng[1:].split(" ")[0])
        if base[3] or base[0] == 0:
            return v[:3] >= base[:3] and v[0] == base[0]
        return v[0] == base[0] and v >= base
    if rng.startswith("~"):
        base = parts_of_ver(rng[1:].split(" ")[0])
        return v[:2] == base[:2] and v >= base
    if rng.startswith(">="):
        base = parts_of_ver(rng[2:].strip())
        return v >= base
    if rng.startswith(">"):
        base = parts_of_ver(rng[1:].strip())
        return v > base
    if rng.startswith("<"):
        base = parts_of_ver(rng[1:].strip())
        return v < base
    if " " in rng:
        return all(satisfies(ver, c) for c in rng.split())
    m = re.match(r"^(\d+)(?:\.(\d+))?(?:\.(\d+))?$", rng)
    if m:
        want = tuple(int(g) if g else 0 for g in m.groups())
        got = v[: len(want)]
        return v[: len(want)] == want
    if rng.startswith("||"):
        return any(satisfies(ver, c) for c in rng[2:].split("||"))
    return rng == ver


def pkg_versions(pkg):
    doc = fetch_json(DATA + pkg)
    versions = doc.get("versions") or []
    if isinstance(versions, dict):
        return list(versions.keys())
    out = []
    for v in versions:
        if isinstance(v, dict):
            out.append(v.get("version") or (v.get("tags") or {}).get("latest"))
        else:
            out.append(v)
    return [v for v in out if v]


def sorted_desc(versions):
    stable = [v for v in versions if "-" not in v]
    parsed = [(parts_of_ver(v), v) for v in stable]
    return [v for _, v in sorted(parsed, reverse=True)]


def resolve(pkg, rng):
    versions = pkg_versions(pkg)
    if not versions:
        if rng and re.match(r"^\d", rng):
            return rng.replace("^", "").replace("~", "")
        raise RuntimeError(f"no versions for {pkg} {rng}")
    for ver in sorted_desc(versions):
        if satisfies(ver, rng or "latest"):
            return ver
    raise RuntimeError(f"no version of {pkg} satisfies {rng}")


def get_files(pkg, ver):
    url = DATA + pkg + "@" + ver + "?structure=flat"
    doc = fetch_json(url)
    files = doc.get("files") or []
    out = []
    if files and isinstance(files[0], dict) and "type" in files[0]:
        def walk(fs):
            for f in fs or []:
                if f.get("type") == "file":
                    out.append(f["name"])
                else:
                    walk(f.get("files"))
        walk(files)
    else:
        for f in files:
            if isinstance(f, dict):
                out.append(f.get("name") or "")
            else:
                out.append(str(f))
    return [n for n in out if n]


def npm_dir(root, pkg):
    parts = pkg.split("/", 1) if "/" in pkg else [pkg]
    return os.path.join(root, *parts)


def install(pkg, ver, root):
    pkgdir = npm_dir(root, pkg)
    os.makedirs(pkgdir, exist_ok=True)
    files = get_files(pkg, ver)
    for name in files:
        rel = name.lstrip("/")
        if not rel:
            continue
        target = os.path.join(pkgdir, rel)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        data = fetch(CDN + pkg + "@" + ver + name, binary=True)
        tmp = target + ".tmp"
        with open(tmp, "wb") as fh:
            fh.write(data)
        os.replace(tmp, target)
    pj = os.path.join(pkgdir, "package.json")
    if os.path.exists(pj):
        with open(pj) as fh:
            return json.load(fh)
    return {}


def main():
    root = sys.argv[1]
    queue = []
    installed = {}
    for spec in sys.argv[2:]:
        if "@" in spec[1:]:
            p, v = spec.rsplit("@", 1)
        else:
            p, v = spec, "latest"
        queue.append((p, v))
    while queue:
        pkg, rng = queue.pop(0)
        if pkg in installed:
            continue
        existing = npm_dir(root, pkg)
        if os.path.exists(os.path.join(existing, "package.json")):
            with open(os.path.join(existing, "package.json")) as fh:
                meta = json.load(fh)
            if rng in ("latest", "*", "") or satisfies(meta.get("version", ""), rng):
                installed[pkg] = meta.get("version", "?")
                print(f"[skip] {pkg} present v{installed[pkg]}")
                for dep in (meta.get("dependencies") or {}):
                    if dep not in installed:
                        queue.append((dep, meta["dependencies"][dep]))
                continue
            print(f"[replace] {pkg} present v{meta.get('version')} does not satisfy {rng}")
            import shutil

            shutil.rmtree(existing)
        ver = resolve(pkg, rng)
        print(f"[fetch] {pkg}@{ver} ({rng})")
        meta = install(pkg, ver, root)
        installed[pkg] = ver
        for dep, drng in (meta.get("dependencies") or {}).items():
            if dep not in installed:
                queue.append((dep, drng))
    print("---- done ----")
    for p, v in sorted(installed.items()):
        print(f"{p}@{v}")


if __name__ == "__main__":
    main()