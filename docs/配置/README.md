---
title: 配置
lang: zh-CN
---

# 配置

## 简述

Bird的配置文件采用的是自家的格式，大致如下：

```
global options;
protocol proto {
    protocol options;
    channel chan {
        channel options;
    };
};
```

如果使用了模板，那么就会有：

```
template protocol temp_name {
	protocol options;
	channel chan {
        channel options;
    };
};
protocol proto from temp_name {
	protocol options;
    channel chan {
        channel options;
    };
};
```

该配置一般会存放在 `/etc/bird/bird.conf`。

## 基本语法

以下内容摘自[ Soha 的文章](https://soha.moe/post/bird-bgp-kickstart.html)：

> 和 Juniper、Cisco 等路由器，或 FRR（Quagga）等路由软件不同，写 BIRD 的配置文件就像是在写程序，如果你是个程序员，那么上手应该会很快。正因如此，它也有着和常见编程语言所类似的语法。下面则是一些基础语法。
>
> ### 杂项
>
> 用 `/* */` 包起来的内容是注释，`#` 至其所在行行末的内容也是注释。
>
> 分号 `;` 标示着一个选项或语句的结束，而花括号 `{ }` 内则是多个选项或语句。
>
> 在 BIRD 的配置文件中，有协议实例（`protocol <proto> <name> {}`），过滤器（`filter <name> [local_variables] {}`），函数（`function <name> [local_variables] {}`）可以定义，这些将在下文各部分选择性挑重点介绍。
>
> `print` 用来输出内容，这些会输出在 BIRD 的日志文件中，在使用 systemd 的系统中，可以使用 `journalctl -xeu bird.service` 查看。
>
> ### 变量与常量
>
> 变量名、常量名、协议实例名、过滤器名、函数名等，都遵循着这样的规则：必须以下划线或字母开头，名称内也只能有字母、数字、下划线。比如 `Soha233`、`_my_filter`、`bgp_4842` 都是合法的名字。当然在 BIRD 中有例外，如果一个名字用单引号括起来，那么我们还可以用冒号、横线、点，比如 `'2.333:what-a-strange-name'`，只不过不推荐这么用就是了。
>
> 使用 `define` 定义常量，如 `define LOCAL_AS = 65550`。
>
> BIRD 中可以针对很多变量类型定义集合。集合用一对方括号定义，如 `[1, 2, 3, 4]`。集合可以用范围来快速生成，比如 `[1, 2, 10..13]` 就会生成为 `[1, 2, 10, 11, 12, 13]`。范围的写法还可以用在社区属性中，如 `[(64512, 100..200)]`，在社区属性中还可以用通配符，如 `[(1, 2, *)]`。
>
> 前缀的集合中的范围写法较为复杂，`[prefix{low, high}]`，`prefix` 是一个用于匹配的前缀，`low` 和 `high` 两个值限制了它的 CIDR 长度。`[192.168.1.0/24{16,30}]` 表示的是包含或被包含于 192.168.1.0/24 且 CIDR 在 16-30 之间的前缀，例如 `192.168.0.0/20` 和 `192.168.1.0/29` 均属于这个集合，而 `192.168.233.0/24` 不属于。这样子的写法可能过于麻烦，所以 BIRD 中也使用加号和减号提供了两种便捷的写法，如 `[2001:db8:10::/44+, 2001:db8:2333::/48-]` 则等价于 `[2001:db8:10::/44{44,128}, 2001:db8:2333::/48{0,48}]`。
>
> 在 BIRD 中还有一类特殊的变量类型，他们都是列表，`bgppath`（AS Path，路由的 `bgp_path` 属性）、`clist`（BGP Community 列表，路由的 `bgp_community` 属性）、`eclist`（BGP Extended Community 列表，路由的 `bgp_ext_community` 属性）、`lclist`（BGP Large Community 列表，路由的 `bgp_large_community` 属性）都是这类变量，他们的操作有非常特殊的用法。下面的代码展示了 `bgppath` 的用法。`clist/eclist/lclist` 与之类似，但是它们只能使用其中的 `empty`、`len`、`add`、`delete`、`filter`。
>
> ```
> function foo()
> bgppath P;
> bgppath P2; {
>     print "path 中第一个元素是", P.first, "，最后一个元素是", P.last;
>     # 第一个元素可以认为是邻居的 ASN，最后一个元素是宣告这条路由的 ASN
>     # 这两个在 P 中没有元素的时候是 0
>     print "path 的长度是", P.len;
>     if P.empty then {
>         print "path 为空";
>     }
>     P.prepend(233); # 在 path 的第一个位置插入元素
>     P.delete(233); # 删除 path 中所有等于 233 的元素
>     P.delete([64512..65535]); # 删除 path 中所有属于集合 [64512..65535] 的元素
>     P.filter([64512..65535]); # 只在 path 中留下集合 [64512..65535] 中出现的元素
> 
>     # 如果不想改变 P，可以使用下面这样的方法将操作后的结果存入 P2
>     P2 = delete(P, 233)
>     P2 = filter(P, [64512..65535])
> }
> ```
>
> 变量只能定义在函数或过滤器的最开头（左花括号外面），关于变量类型的更详细信息，请移步[官方文档相关部分](https://bird.network.cz/?get_doc&v=20&f=bird.html#ss5.2)。
>
> ### 操作符
>
> 在 BIRD 中有很多常见的操作符。如 `+`、`-`、`*`、`/`、`()` 这些基本的算数操作符，有等于 `a = b`、不等于 `a != b`、大于 `a > b`、大于等于 `a >= b`、小于 `a < b`、小于等于 `a <= b` 这些比较符，有与 `&&`、或 `||`、非 `!` 这三种逻辑操作符。还有 `~` 和 `!~` 这两种判断包含或者不包含的操作符。包含操作符的用法写在附录 3 中。
>
> ### 分支
>
> 过滤器和函数中的语句都是顺序执行的。同时支持 `case` 和 `if` 两种分支语句。在 BIRD 中是不支持循环的。
>
> `if` 的写法如下：
>
> ```
> if 6939 ~ bgp_path then {   # 只要 AS Path 中有 6939
>     bgp_local_pref = 233;   # 就将这条路由的 Local Preference 调为 233
> } else {
>     bgp_local_pref = 2333;  # 否则设为 2333
> }
> ```
>
> `case` 的写法如下：
>
> ```
> case arg1 {
>     2: print "two"; print "I can do more commands without {}";
>     #  ^ case 不需要花括号就能在一个分支中写下更多语句。
>     3..5: print "three to five";
>     else: print "something else";
> }
> ```
>
> 在 BIRD 中，if 和 case 的写法均与常见编程语言略有不同。

## 一些全局可用的语句

有这么一些语句在整篇文档中任何地方都可用。

### include

导入一个文件到该语句所在的位置。

使用方法：

```
include "filename";
```

filename 支持通配符，将按照字母顺序导入，如果遇到文件夹也会向下包含，最大深度为8。

**该语句必须位于行首**

**该语句仅会将文件拼接进入，不会做其他处理**

所以，我们建议在被导入的文件中就写好格式，或者按照你的需求定制。被导入的文件出现了错误，bird也会显示文件名而不是`bird.conf`。

