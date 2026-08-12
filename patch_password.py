import os

f = 'public/reservation_v2.html'
c = open(f, encoding='utf-8').read()
c = c.replace('pwd === "5096"', 'pwd === "2896"')
open(f, 'w', encoding='utf-8').write(c)
print('Password patched in reservation_v2.html')
