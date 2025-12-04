#!/usr/bin/env python3
"""
Standalone camera probe for HTTP/MJPEG/RTSP streams.
Tries OpenCV first (with and without FFMPEG), then a raw MJPEG parser.
Also probes common HTTP endpoint variants and will save a snapshot if successful.

Usage:
  python scripts/test_camera_probe.py --url http://100.122.166.77:8888/Dispatch/
  python scripts/test_camera_probe.py --url http://... --username admin --password pass
"""

import argparse
import time
import re
from urllib.parse import urljoin

import cv2
import numpy as np
import requests


def opencv_read_one(url: str, backend_ffmpeg: bool = False):
    try:
        if backend_ffmpeg:
            cap = cv2.VideoCapture(url, cv2.CAP_FFMPEG)
        else:
            cap = cv2.VideoCapture(url)
        ok, frame = cap.read()
        cap.release()
        return frame if ok and frame is not None else None
    except Exception:
        return None


def mjpeg_read_one(url: str, username: str | None = None, password: str | None = None, timeout: float = 8.0):
    try:
        auth = (username, password) if username and password else None
        headers = {"User-Agent": "Mozilla/5.0"}
        with requests.get(url, stream=True, timeout=timeout, auth=auth, headers=headers) as r:
            r.raise_for_status()
            data = b""
            t0 = time.time()
            for chunk in r.iter_content(chunk_size=4096):
                if not chunk:
                    continue
                data += chunk
                a = data.find(b"\xff\xd8")
                b = data.find(b"\xff\xd9")
                if a != -1 and b != -1 and b > a:
                    jpg = data[a:b + 2]
                    data = data[b + 2:]
                    arr = np.frombuffer(jpg, dtype=np.uint8)
                    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                    if frame is not None:
                        return frame
                if time.time() - t0 > timeout:
                    break
    except Exception:
        return None
    return None


def mjpeg_read_one_boundary(url: str, username: str | None = None, password: str | None = None, timeout: float = 8.0):
    """Boundary-aware multipart/x-mixed-replace MJPEG reader (parses declared boundary)."""
    try:
        auth = (username, password) if username and password else None
        headers = {"User-Agent": "Mozilla/5.0"}
        with requests.get(url, stream=True, timeout=timeout, auth=auth, headers=headers) as r:
            r.raise_for_status()
            ctype = r.headers.get('Content-Type', '')
            if 'multipart' not in ctype.lower():
                return None
            # Extract boundary token
            boundary = None
            for part in ctype.split(';'):
                part = part.strip()
                if part.lower().startswith('boundary='):
                    boundary = part.split('=', 1)[1].strip().strip('"')
                    break
            if not boundary:
                return None
            if not boundary.startswith('--'):
                boundary = '--' + boundary
            boundary_bytes = boundary.encode('utf-8')

            buf = b''
            t0 = time.time()
            for chunk in r.iter_content(chunk_size=4096):
                if not chunk:
                    continue
                buf += chunk
                # Look for boundary
                bpos = buf.find(boundary_bytes)
                while bpos != -1:
                    # Remove everything up to boundary
                    part = buf[bpos + len(boundary_bytes):]
                    # If it's the last boundary with --, break
                    if part.startswith(b'--'):
                        return None
                    # Expect CRLF then headers then CRLFCRLF then data until next boundary
                    # Find header terminator
                    hdr_end = part.find(b'\r\n\r\n')
                    if hdr_end == -1:
                        break
                    body = part[hdr_end + 4:]
                    # Try to find next boundary to limit body
                    next_b = body.find(boundary_bytes)
                    if next_b != -1:
                        body = body[:next_b]
                    # Extract JPEG frame from body
                    a = body.find(b'\xff\xd8')
                    z = body.find(b'\xff\xd9')
                    if a != -1 and z != -1 and z > a:
                        jpg = body[a:z + 2]
                        arr = np.frombuffer(jpg, dtype=np.uint8)
                        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                        if frame is not None:
                            return frame
                    # Move buffer past this boundary to continue
                    buf = body[next_b:] if next_b != -1 else b''
                    bpos = buf.find(boundary_bytes)
                if time.time() - t0 > timeout:
                    break
    except Exception:
        return None
    return None


def discover_http_variants(base_url: str, username: str | None, password: str | None):
    candidates: list[str] = []
    base = base_url.rstrip('/')
    # try given and common variants
    candidates.extend([
        base_url,
        f"{base}/stream",
        f"{base}/video",
        f"{base}/mjpeg",
        f"{base}/video.mjpg",
        f"{base}?action=stream",
        f"{base}?action=stream.mjpeg",
    ])
    # discover from HTML if present
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        resp = requests.get(base_url, timeout=5, headers=headers)
        ctype = resp.headers.get('Content-Type', '')
        if 'text/html' in ctype.lower() and resp.text:
            for src in re.findall(r'src=["\']([^"\']+)["\']', resp.text, re.IGNORECASE):
                if any(tag in src.lower() for tag in ['mjpg', 'mjpeg', 'stream', 'video']):
                    candidates.insert(1, urljoin(base_url, src))
    except Exception:
        pass
    # de-duplicate, keep order
    seen = set()
    unique = []
    for u in candidates:
        if u not in seen:
            seen.add(u)
            unique.append(u)
    return unique


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', required=True)
    parser.add_argument('--username')
    parser.add_argument('--password')
    parser.add_argument('--snapshot', default='static/uploads/probe_snapshot.jpg')
    args = parser.parse_args()

    print(f"\n=== Camera Probe ===\nURL: {args.url}\n")

    # Try direct OpenCV
    for flag in [False, True]:
        frame = opencv_read_one(args.url, backend_ffmpeg=flag)
        print(f"OpenCV read (ffmpeg={flag}): {'OK' if frame is not None else 'FAIL'}")
        if frame is not None:
            cv2.imwrite(args.snapshot, frame)
            print(f"Saved snapshot to: {args.snapshot}")
            return 0

    # If HTTP, try variants and MJPEG
    if args.url.startswith('http://') or args.url.startswith('https://'):
        variants = discover_http_variants(args.url, args.username, args.password)
        print("\nHTTP/MJPEG variants to try:")
        for v in variants:
            print(f" - {v}")

        for v in variants:
            # Try OpenCV then MJPEG (chunk scan), then boundary-aware multipart
            frame = opencv_read_one(v)
            if frame is None:
                frame = mjpeg_read_one(v, args.username, args.password)
            if frame is None:
                frame = mjpeg_read_one_boundary(v, args.username, args.password)
            print(f"Probe {v}: {'OK' if frame is not None else 'FAIL'}")
            if frame is not None:
                cv2.imwrite(args.snapshot, frame)
                print(f"SUCCESS. Working variant: {v}")
                print(f"Saved snapshot to: {args.snapshot}")
                return 0

    print("\nCamera probe failed. No readable frames.")
    return 2


if __name__ == '__main__':
    raise SystemExit(main())


