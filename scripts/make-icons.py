"""Render the code-native percent icon to dependency-free PWA PNGs."""
from pathlib import Path
import math
import struct
import zlib

TARGET = Path(__file__).resolve().parents[1] / 'dist' / 'icons'

def segment_distance(x, y, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)))
    return math.hypot(x-ax-t*dx, y-ay-t*dy)

def render(size, filename):
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            px, py = (x+.5)*512/size, (y+.5)*512/size
            distance = min(abs(math.hypot(px-180,py-180)-38), abs(math.hypot(px-332,py-332)-38), segment_distance(px,py,190,340,322,172))
            coverage = max(0, min(1, (14-distance)*size/512+.5))
            background = [34+(8-34)*y/max(1,size-1),35+(11-35)*y/max(1,size-1),55+(14-55)*y/max(1,size-1)]
            row.extend(round(base*(1-coverage)+accent*coverage) for base,accent in zip(background,[119,255,223]))
        rows.append(bytes(row))
    def chunk(kind, data):
        return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
    header = struct.pack('>IIBBBBB',size,size,8,2,0,0,0)
    data = b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',header)+chunk(b'IDAT',zlib.compress(b''.join(rows),9))+chunk(b'IEND',b'')
    (TARGET/filename).write_bytes(data)

TARGET.mkdir(parents=True,exist_ok=True)
for dimension,name in [(192,'icon-192.png'),(512,'icon-512.png'),(512,'icon-maskable-512.png'),(180,'apple-touch-icon.png')]:
    render(dimension,name)
print('Created four PWA icons.')
