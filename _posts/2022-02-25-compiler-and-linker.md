---
layout: post
title:  编译与链接
date:   2022-02-25 22:00:00 +0800
tag:    notes
---

- g++编译步骤
    - 预处理
    - 编译
    - 汇编
    - 链接
- 当mem-pool项目中包含以下文件时
    - main.cpp
    - mem_pool.cpp
    - mem_pool.h
- 具体以下四个步骤将代码生成可执行文件
    ```bash
    #g++ main.cpp mem_pool.cpp mem_pool.h -o bin

    # 预处理
    g++ -E main.cpp -o main.i
    g++ -E mem_pool.cpp -o mem_pool.i

    # 编译
    g++ -S main.i -o main.s
    g++ -S mem_pool.i -o mem_pool.s

    # 汇编
    g++ -c main.s -o main.o
    g++ -c mem_pool.s -o mem_pool.o

    # 链接
    g++ main.o mem_pool.o -o bin
    ```

通过对以上步骤的了解，当遇到一些问题时可方便的分析出原因，比如最近就遇到头文件中引出全局变量g_net_mem_pool，如果不加extern就会报错重定义，然后我分别打开main.s喝mem_pool.s果然发现有两份相同的汇编指令“globl	g_net_mem_pool”，如果加上extern就会发现只有mem_pool.s中存在一份，main.s中就不会存在了，这样main.cpp中就可以引用mem_pool.h中通过extern声明,mem_pool.cpp中定义的全局变量g_net_mem_pool。

- [mem-pool](https://github.com/samoyedsun/misc/tree/master/mem-pool)
- 扩展阅读
    - [gcc/g++链接库的编译与链接](https://blog.csdn.net/jadeshu/article/details/88922318)
    - [浅谈C/C++链接库](https://segmentfault.com/a/1190000020240898)