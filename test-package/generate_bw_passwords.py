#!/usr/bin/env python3
import os
import time
import sys

if len(sys.argv) != 3:
    raise ValueError('Please provide the number of pws you want and the file name to save it to.')
start = time.time()
for i in range(int(sys.argv[1])):
    os.system(f'bw generate >> {sys.argv[2]}')
    os.system(f'echo "" >> {sys.argv[2]}')
end = time.time()
print(str(round(end-start, 2)) + " secs which is ")
print(str(round(end-start, 2)/60) + " mins")
