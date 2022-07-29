---
layout: post
title:  关于extern"C"的意义
date:   2022-07-29 16:41:00 +0800
tag:    skill
---

关于extern "C"的作用一直没搞明白，今天在群里讨论到这个问题，就试图分析个清楚；百度上基本都是说加上它就是将其范围内的代码以C语言的规则编译；其实这句话很笼统，稍微不细心思考的话就会被忽悠过去，而自己心里依然迷迷糊糊，解释详细一点的会说由于c++支持重载所以c++编译器会在编译时对函数名字做调整避免重名。不过这些解释并不能说服我，可能是知识限制了我的理解能力吧，不管怎样我还是觉得没理解透彻，假如未来别人问我这个问题，我也这样解释的话，其实是比较心虚的。

于是我换了一个角度问自己，某种场景下加了extern "C"与不加extern "C"的区别是什么，会报什么错，如果能亲眼所见它的报错场景我觉得对于它的理解算是透彻了，如果跟别人讲这个话题也就不会心虚了。结合前面百度上说的话我突然想到，函数重载终究是编译器的功能，那么如果gcc编译器所编译的动态库，g++编译器编译的动态库中去调用的话这个函数名调整与不调整就形成了冲突，比如gcc编译了一个函数aaa, g++中去调用函数时调整函数名为aaa_v，那么就会报错函数找不到，那么它的使用场景也就很明确了。

通过上面的想法我写了一个例子，执行后结果也差不多符合预期。一目了然，明白了什么时候需要使用extern"C", 也明白了为什么使用。

b.c
```c
#include "b.h"

int hello()
{
    return 100;
}
```

b.h
```c
#ifndef _B_H_
#define _B_H_

int hello();

#endif
```

a.cpp
```cpp
#include <cstdio>
extern "C"
{
#include "b.h"
}

int main()
{
    int ret = hello();
    printf("I'm Geek! ret:%d\n", ret);
    return 0;
}
```

```bash
admin@mac:> ls
a.cpp  b.c  b.h
admin@mac:> gcc -c b.c -o b.o
admin@mac:> g++ -c a.cpp -o a.o
admin@mac:> g++ b.o a.o -o bin
/usr/bin/ld: a.o: in function `main':
a.cpp:(.text+0xd): undefined reference to `hello()'
collect2: error: ld returned 1 exit status
admin@mac:> vim a.cpp
admin@mac:> g++ -c a.cpp -o a.o
admin@mac:> g++ b.o a.o -o bin
admin@mac:> ./bin
I'm Geek! ret:100
admin@mac:> cat a.cpp
```