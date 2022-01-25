---
layout: post
title:  "瑞士军刀的N种招式"
date:   2020-10-07 16:35:26 +0800
tag:    notes
---



### 聊天
---
窗口A:
```bash
[root@mac ~]# nc -l 9999
B:你好,I'm B.
A:你好啊B ,I'm A. 啊哈哈哈哈哈哈.
```

窗口B:
```bash
[root@mac ~]# nc -nv 127.0.0.1 9999
Ncat: Version 7.50 ( https://nmap.org/ncat )
Ncat: Connected to 127.0.0.1:9999.
B:你好,I'm B.
A:你好啊B,I'm A. 啊哈哈哈哈哈哈.
```

### 传文件
---
窗口A:
```bash
[root@mac ~]# nc -l 9999 > 1.txt
[root@mac ~]#
```

窗口B:
```bash
[root@mac ~]# nc 127.0.0.1 9999 < 2.txt
[root@mac ~]#
```
