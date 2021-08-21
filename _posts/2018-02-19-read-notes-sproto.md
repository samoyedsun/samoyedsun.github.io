---
layout: post
title:  "阅读笔记之sproto"
date:   2018-02-19 05:09:26 +0800
tag: notes
---

**一：**
-------------

``` c
// align by 8
sz = (sz + 7) & ~7;
```

<table>
    <tr>
        <td>sz = 1</td> 
        <td>代入后</td> 
        <td>sz = 8</td> 
    </tr>
    <tr>
        <td>sz = 2</td> 
        <td>代入后</td> 
        <td>sz = 8</td> 
    </tr>
    <tr>
        <td>sz = 8</td> 
        <td>代入后</td> 
        <td>sz = 8</td> 
    </tr>
    <tr>
        <td>sz = 9</td> 
        <td>代入后</td> 
        <td>sz = 16</td> 
    </tr>
    <tr>
        <td>sz = 10</td> 
        <td>代入后</td> 
        <td>sz = 16</td> 
    </tr>
</table>

由结果可知这行代码就是让sz的大小为8的倍数，这样在分配空间的时候以8的倍数为单位分配可以减少内存碎片。

7按位取反是-8; 7的二进制存储形式（补码形式存储; 正数的补码是他本身，负数的补码是其绝对值按位取反加一，所以负数补码的绝对值就是减一按位取反）是0000 0111, 按位取反加一是1111 1000, 正是-8的补码形式，接着减一按位取反是0000 1000, 正是-8的绝对值！

正数取反运算:

<table>
    <tr>
        <td>7 存储形式</td> 
        <td>0000 0111</td> 
   </tr>
    <tr>
        <td >～7</td>    
        <td >1111 1000</td>  
    </tr>
    <tr>
        <td >-8 存储形式</td>
        <td >1111 1000</td>  
    </tr>
</table>

负数取反运算:

<table>
    <tr>
        <td>-8 存储形式</td> 
        <td>1111 1000</td> 
    </tr>
    <tr>
        <td >～-8</td>    
        <td >0000 0111</td>  
    </tr>
    <tr>
        <td>7 存储形式</td> 
        <td>0000 0111</td> 
    </tr>
</table>

**二：**
-------------

``` c
static inline int
toword(const uint8_t * p) {
	return p[0] | p[1]<<8;
}

static inline uint32_t
todword(const uint8_t *p) {
	return p[0] | p[1]<<8 | p[2]<<16 | p[3]<<24;
}
```

由于我们的sproto中编码是以小端对齐的方式存储的，而我们的计算机通常是大端对齐的方式存储数据，这里如果需要将比编码后数据拿出来用的话就需要用以上两个接口将编码转化为大端方式; 用来解析header(2个字节), fields(2个字节), array header(4个字节)

**三：**
-------------

``` c
static int
struct_field(const uint8_t * stream, size_t sz)
```

解析数据前用此接口验证数据格式是否合法的，合法返回header value，也就是字段数量; 否则返回-1.

``` c
static struct sproto *
create_from_bundle(struct sproto *s, const uint8_t * stream, size_t sz)
```

解析第一层时最多只有type, protocol两个字段，其余的所有数据都在这两个字段里存储;此接口做了根据stream中这两种数据的元素数量为其分配合适空间，并将元素内容一一填入分配的堆空间中这两件事.

**四：**
-------------

``` c
if (tag <= last)
    return NULL;	// tag must in ascending order
if (tag > last+1) {
    ++maxn;
}
last = tag;
```

tag必须按照升序排列，但是tag可以不连续; 如果不连续，则记录的跳开的数字差. 这里没看明白，需要阅读其他代码才能明白这里。

``` c
t->base = t->f[0].tag;
n = t->f[n-1].tag - t->base + 1;
if (n != t->n) {
    t->base = -1;
}
```

默认base是第一个tag的值，如果tag是连续的，base是0; 这段代码告诉我们如果base等于-1说明有些tag是不连续的。

```
.package {
	type 0 : integer
	session 1 : integer
}

foobar 1 {
	request {
		what 0 : string
	}
	response {
		ok 0 : boolean
	}
}

foo 2 {
	response {
		ok 0 : boolean
	}
}

bar 3 {
	response nil
}

blackhole 4 {
}
```

解析后：

```
+protocol+blackhole+tag [4]
|        +bar+confirm [true]
|        |   +tag [3]
|        +foo+response [foo.response]
|        |   +tag [2]
|        +foobar+tag [1]
|               +response [foobar.response]
|               +request [foobar.request]
+type+foobar.response+1+typename [boolean]
     |                 +tag [0]
     |                 +name [ok]
     +foobar.request+1+typename [string]
     |                +tag [0]
     |                +name [what]
     +package+1+typename [integer]
     |       | +tag [0]
     |       | +name [type]
     |       +2+typename [integer]
     |         +tag [1]
     |         +name [session]
     +foo.response+1+typename [boolean]
                    +tag [0]
                    +name [ok]
```

**五：**
-------------

遇到一个不熟悉的接口 lua_upvalueindex(1) ,关于闭包和上值的; 通过阅读[这里](http://blog.csdn.net/linuxheik/article/details/18702479)我理解了！

``` c
#define ENCODE_BUFFERSIZE 2050

static void *
expand_buffer(lua_State *L, int osz, int nsz) {
	void *output;
	do {
		osz *= 2;
	} while (osz < nsz);
	if (osz > ENCODE_MAXSIZE) {
		luaL_error(L, "object is too large (>%d)", ENCODE_MAXSIZE);
		return NULL;
	}
	output = lua_newuserdata(L, osz);
	lua_replace(L, lua_upvalueindex(1));
	lua_pushinteger(L, osz);
	lua_replace(L, lua_upvalueindex(2));

	return output;
}

static void
pushfunction_withbuffer(lua_State *L, const char * name, lua_CFunction func) {
	lua_newuserdata(L, ENCODE_BUFFERSIZE);
	lua_pushinteger(L, ENCODE_BUFFERSIZE);
	lua_pushcclosure(L, func, 2);
	lua_setfield(L, -2, name);
}

```

pushfunction_withbuffer 会在进程启动的时候预先为绑定的命令生成一块 ENCODE_BUFFERSIZE 大小的buffer区域，与buffer的大小作为上值供回调的功能逻辑中使用; 当buffer区域不够用的时候再用expand_buffer以翻倍的形式扩充; 不过一般情况都是够用的，所以才这样写！

**六：**
-------------

``` lua
local tag = R"09" ^ 1 / tonumber
```

lpeg.R ({range})

返回一个pattern， 可以匹配range范围内的任一字符。 

patt^n

若n为非负数，则匹配 n 或者更多的patt；若n为负数，则最多匹配n个patt。

patt / function

将patt捕获到的值作为参数传递到function,调用function得到最终结果。就像shell中的管道命令

``` lua
local function count_lines(_,pos, parser_state)
	if parser_state.pos < pos then
		parser_state.line = parser_state.line + 1
		parser_state.pos = pos
	end
	return pos
end
local eof = P(-1)
local newline = lpeg.Cmt((P"\n" + "\r\n") * lpeg.Carg(1) ,count_lines)
local line_comment = "#" * (1 - newline) ^0 * (newline + eof)
local blank = S" \t" + newline + line_comment
local blank0 = blank ^ 0
local blanks = blank ^ 1
local alpha = R"az" + R"AZ" + "_"
local alnum = alpha + R"09"
local word = alpha * alnum ^ 0
local name = C(word)
local typename = C(word * ("." * word) ^ 0)
local tag = R"09" ^ 1 / tonumber
local mainkey = "(" * blank0 * name * blank0 * ")"
local decimal = "(" * blank0 * C(tag) * blank0 * ")"
```

lpeg.P (value)

如果参数是一个字符串，它将被转换为一个与字符串相匹配的模式。

如果参数是一个负数-n，则结果是只有输入字符串剩余少于n个字符时才会成功的模式：lpeg.P（-n）等价于-lpeg.P（n）（请参阅一元 减操作）。

-patt

作为示例，模式-lpeg.P（1）仅匹配字符串的末尾。

lpeg.S (string)

匹配集合中的任何内容

返回与给定字符串中出现的任何单个字符相匹配的模式

作为一个例子，模式lpeg.S(" \t")匹配空格或tab转义字符。
```
print(lpeg.match(C(S' \t'^1 * S'a' * S' \t'^1 * S'c'), "    a		c")) 
=> "    a           c"
```


patt1 + patt2

返回一个模式，为两个模式的交集, 输入匹配之一即可

返回等同于patt1和patt2的有序选择的模式

```
print(match( C(P'b' + P'ab'), "abc")) 
=> "ab"
```


lpeg.Carg (n)

创建一个参数捕获，模式匹配了一个空串，并产生一个值，能match的额外第n个参数。

```
print (lpeg.match(lpeg.Carg(1), "aaaaaaccccc", 0, "bbb", "werwer"))
=>"bbb"
print (lpeg.match(lpeg.Carg(2), "aaaaaaccccc", 0, "bbb", "werwer"))
=>"werwer"
```


``` lua
local function multipat(pat)
	return Ct(blank0 * (pat * blanks) ^ 0 * pat^0 * blank0)
end

local function namedpat(name, pat)
	return Ct(Cg(Cc(name), "type") * Cg(pat))
end
local typedef = P {
	"ALL",
	FIELD = namedpat("field", (name * blanks * tag * blank0 * ":" * blank0 * (C"*")^-1 * typename * (mainkey +  decimal)^0)),
	STRUCT = P"{" * multipat(V"FIELD" + V"TYPE") * P"}",
	TYPE = namedpat("type", P"." * name * blank0 * V"STRUCT" ),
	SUBPROTO = Ct((C"request" + C"response") * blanks * (typename + V"STRUCT")),
	PROTOCOL = namedpat("protocol", name * blanks * tag * blank0 * P"{" * multipat(V"SUBPROTO") * P"}"),
	ALL = multipat(V"TYPE" + V"PROTOCOL"),
}

local proto = blank0 * typedef * blank0
```

* 描述:
    - FIELD 定义一个变量的文本，比如phone 3 : *PhoneNumber # PhoneNumber数组
    - STRUCT {}及其中间的所有内容
    - TYPE 定义一个类型的所有文本
    - SUBPROTO 协议中的request或者response
    - PROTOCOL 整个协议
    - ALL 所有文本
    - name 变量名，类型名，协议名
    - tag 数字
    - blanks 最少一个空格
    - blank0 0或多个空格
    - typename 不仅可以匹配name， 还可以匹配Person.PhoneNumber
    - mainkey 匹配 (id) 也就是指定map结构的key，这里的id是一个字段名
    - decimal 匹配(2) 预设的小数位数，不属于浮点数，能够保证数据计算更为精确
    - namedpat(name, pat) namedpat返回一个新的pat，其匹配规则和pat一样，但是会将name存储到type变量中，这y样我们就知道这个pat匹配的是什么，比如field，或者protocol 或者是type
    - multipat（pat） 则是匹配多个pat

FIELD结构（optional）：
```
|           +1+typename [integer]
|           | +name [i]
|           | +key [a]
|           | +decimal [2]
|           | +array [true]
|           | +tag [8]
* key       指定map类型的键的字段名
* decimal   预设的小数位数，可保证精确
```

基础类型：
``` lua
local buildin_types = {
	integer = 0,
	boolean = 1,
	string = 2,
	binary = 2,	-- binary is a sub type of string
}
```

``` lua
local function packtype(name, t, alltypes)
	local fields = {}
	local tmp = {}
	for _, f in ipairs(t) do
		tmp.array = f.array
		tmp.name = f.name
		tmp.tag = f.tag
		tmp.extra = f.decimal

        tmp.buildin = buildin_types[f.typename]
		if f.typename == "binary" then
			tmp.extra = 1	-- binary is sub type of string
		end
        -- ....
    end
    -- ...
end
```

这里extra有两种可能的意思：
如果当前字段是integer类型extra决定当前字段是否为一个小数，并记录是保留几位小数
如果当前字段是binary类型extra决定当前字段是一string的子类型

**七：**
-------------

``` lua
function packbytes(str)
    return string.pack("<s4",str)
end

function packvalue(id)
    id = (id + 1) * 2
    return string.pack("<I2",id)
end
```

``` c
for (i=0;i<fn;i++) {
    int value;
    ++tag;
    value = toword(stream + SIZEOF_FIELD * i);
    if (value & 1) {
        tag+= value/2;
        continue;
    }
    if (tag == 0) { // name
        if (value != 0)
            return NULL;
        f->name = import_string(s, stream + fn * SIZEOF_FIELD);
        continue;
    }
    if (value == 0)
        return NULL;
    value = value/2 - 1;
    switch(tag) {
        //...
    }
    //...
}
```

**官方原文：**

**If n is even (and not zero), the value of this field is n/2-1 , and the tag increases 1;**

**If n is odd, that means the tags is not continuous, and we should add current tag by (n+1)/2 .**

之所以说n为偶数时value等于(n / 2- 1)是因为packvalue时((n + 1) * 2);由算法可发现无论n是几packvalue返回的都是偶数。

之所以说当n是奇数时tag通过((n + 1) * 2)增加(也就是tag += (n + 1) * 2)是因为所谓的奇数时是n=1时((n + 1) * 2) = 1,所以也就是tag+=1（唯一的可能）。

``` c
if f.buildin then					
    table.insert(strtbl, packvalue(f.buildin))	-- buildin (tag = 1)
    if f.extra then
        table.insert(strtbl, packvalue(f.extra))	-- f.buildin can be integer or string
    else
        table.insert(strtbl, "\1\0")	-- skip (tag = 2)
    end
    table.insert(strtbl, packvalue(f.tag))		-- tag (tag = 3)
else
    table.insert(strtbl, "\1\0")	-- skip (tag = 1)
    table.insert(strtbl, packvalue(f.type))		-- type (tag = 2)
    table.insert(strtbl, packvalue(f.tag))		-- tag (tag = 3)
end
```

如果是基础类型f.buildin是基础类型的编号;否则f.buildin是空，就插入“\1\0”(奇数)，表示忽略这条数据(c层的import_field里面解析时会跳过这条数据)。

当f.buildin表示string or integer类型时f.extra才可能存在，因为integer有个”小数“(decimal)子类型，string有个"二进制"(binary)子类型;否则f.extra不存在，c层import_field里面解析时也会跳过这条数据.

``` c
static int
calc_pow(int base, int n) {
	int r;
	if (n == 0)
		return 1;
	r = calc_pow(base * base , n / 2);
	if (n&1) {
		r *= base;
	}
	return r;
}
```

求base的n次幂,用在小数运算中（10的n次幂）
