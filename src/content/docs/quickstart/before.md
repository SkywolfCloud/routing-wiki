---
title: 开始之前
description: 介绍一些BGP跟Bird的相关知识
---

# 开始之前

在这章，我们将介绍一些BGP跟Bird的相关知识。

## 何为路由

通俗而言，路由就是"将一个数据包根据路由表进行转发的过程"。

而一条路由，就是一条"这个目标地址该被转发到哪个接口"的记录。

路由表，就是记录了很多个"这个目标地址该被转发到哪个接口"的表。

当然，路由表内还包含很多比如失效日期、MTU之类的附属信息，并通过优化手段进行存储，具体实现可以自行去查询各厂源代码或Google。

比如，如下是一条在Linux内记录的去往`1.1.1.1`的路由

```
1.1.1.1 via 100.100.0.0 dev eth0 src 2.2.2.2
```

接下来我们来分段分析

- `1.1.1.1` 目标IP，实际存储肯定是按照IP块来存储
- `via 100.100.0.0` 下一跳的IP
- `dev eth0` 目标接口
- `src 2.2.2.2` 当这跳转发的来源是本机的时候，采用的源地址IP

如果同时有`dev`和`via`，那么会根据ARP表将目标MAC重写为下一跳的MAC（如果表内没有则在`dev`指定的接口查询），然后转发到`dev`指定的接口。

如果仅有`dev`没有`via`，那么会根据ARP表将目标MAC重写为目标地址的MAC（如果表内没有则在`dev`指定的接口查询），然后转发到`dev`指定的接口。

如果仅有`via`没有`dev`，那么会递归查询到至少拥有`dev`的下一跳，根据原来的`via`和查询到的`dev`，按照第一条规则处理。

## BGP Session 与 IP Transit

有的时候，我们会看到有商家说：提供BGP Session，也有的商家说：提供 IP Transit，那么它们的区别在哪呢？

区别：BGP Session 指的是一个会话，而IP Transit是在这个会话之内提供的服务。

一般而言，提供BGP Session的商家会给你提供互联网上全表（互联网上所有IP的路由）的服务，这项服务也被称作IP Transit。也就是说，一般商家而言的BGP Session，包括IP Transit。

而当我们直接买带宽的时候，我们会听到IP Transit（有时简称IPT），因为它要与另外一项服务：传输（Transit）区分开，后者指的是一条点对点的隧道，但是有服务保证。

而鉴于目前互联网上通用的不同AS间发送路由的协议只有BGP，所以IP Transit一般隐含了BGP Session，不然路由无法接收，更谈不上广播了。

## 什么是BGP

以下文段来自[维基百科](https://zh.wikipedia.org/wiki/%E8%BE%B9%E7%95%8C%E7%BD%91%E5%85%B3%E5%8D%8F%E8%AE%AE)

> **边界网关协议**（英语：Border Gateway Protocol，缩写：BGP）是[互联网](https://zh.wikipedia.org/wiki/互联网)上一个核心的去中心化自治[路由协议](https://zh.wikipedia.org/wiki/路由协议)。它通过维护IP[路由表](https://zh.wikipedia.org/wiki/路由表)或"前缀"表来实现[自治系统](https://zh.wikipedia.org/wiki/自治系统)（AS）之间的可达性，属于矢量路由协议。BGP不使用传统的[内部网关协议](https://zh.wikipedia.org/wiki/内部网关协议)（IGP）的指标，而使用基于路径、网络策略或规则集来决定路由。因此，它更适合被称为矢量性协议，而不是路由协议。
>
> 大多数[互联网服务提供商](https://zh.wikipedia.org/wiki/互联网服务提供商)必须使用BGP来与其他ISP创建路由连接（尤其是当它们采取多宿主连接时）。因此，即使大多数互联网用户不直接使用它，但是与[7号信令系统](https://zh.wikipedia.org/wiki/7号信令系统)——即通过PSTN的跨供应商核心响应设置协议相比，BGP仍然是互联网最重要的协议之一。特大型的私有[IP](https://zh.wikipedia.org/wiki/网际协议)网络也可以使用BGP。例如，当需要将若干个大型的[OSPF](https://zh.wikipedia.org/wiki/OSPF)（[开放最短路径优先](https://zh.wikipedia.org/wiki/开放最短路径优先)）网络进行合并，而OSPF本身又无法提供这种可扩展性时。使用BGP的另一个原因是其能为多宿主的单个或多个ISP（[RFC 1998](https://tools.ietf.org/html/rfc1998)）网络提供更好的冗余。

简而言之，BGP是在自治系统之间的最主要的路由协议（思科的EIGRP也能提供自治系统之间的路由，但目前我没看到任何实际使用），用来在自治系统间传递路由。通常而言，BGP只会把最优路由传递给对方。

## 什么是Bird

以下文段来自[bird官网](https://bird.network.cz)

> **BIRD**项目旨在开发一个功能齐全的动态 IP 路由守护程序，主要针对（但不限于）Linux、FreeBSD 和其他类 UNIX系统，并在[GNU 通用公共许可证](http://www.gnu.org/copyleft/copyleft.html)下分发。
>
> 目前它由[CZ.NIC Labs](http://labs.nic.cz/)开发和支持。目前**BIRD**团队成员有：
>
> - [Ondřej Filip](http://feela.network.cz/)（OSPF、BSD 端口、发布、打包）
> - [Martin Mareš](http://mj.ucw.cz/)（整体架构、核心、转储、BGP）
> - [Ondřej Zajíček](http://artax.karlin.mff.cuni.cz/~zajio1am/)（新的 BGP 功能、OSPFv3、BFD）
> - [Maria Matějka](http://mq.ucw.cz/)（MPLS、过滤器、多线程）
>
> 
>
> 前**BIRD**团队成员是 [Libor Forst](http://www.ms.mff.cuni.cz/~forst/)和 [Pavel Machek](http://atrey.karlin.mff.cuni.cz/~pavel/)。

如上所写，bird是一个在*nix和FreeBSD平台运行的大部分由C实现的路由程序，支持包括但不限于BGP、RIP、OSPF、Babel等协议。同类产品还有OpenBGPD, FRRouting等。但是目前使用比较广的是Bird，本wiki也是为了bird而写。

## Bird的版本变迁

Bird目前有三个大版本：v1, v2, v3

### v1

Bird v1 是最早的Bird，由两个Daemon分别支持IPv4与IPv6的路由，最晚版本是1.6.8，于2019年9月11日发布。

目前而言我们不推荐使用此版本。

### v2

Bird v2是目前Bird的主线版本。与v1相比，v2仅使用一个Daemon来运行v4与v6的路由。最新版本是2.0.9，于2022年3月2日发布。

本Wiki将主要讲述该版本的使用。

### v3

Bird v3是Bird的下一代版本，该版本增加了多线程的支持。目前的最新版本为3.0-alpha0，于2022年2月7日发布。

目前v3还处在alpha阶段，我们欢迎有时间的用户去测试这个版本，并给作者提出建议。

## Bird的基本语法

以下内容摘自[ Soha 的文章](https://soha.moe/post/bird-bgp-kickstart.html)：

> 和 Juniper、Cisco 等路由器，或 FRR（Quagga）等路由软件不同，写 BIRD 的配置文件就像是在写程序，如果你是个程序员，那么上手应该会很快。正因如此，它也有着和常见编程语言所类似的语法。下面则是一些基础语法。
>
> ### 杂项
>
> 用 `/* */` 包起来的内容是注释，`#` 至其所在行行末的内容也是注释。
>
> 分号 `;` 标示着一个选项或语句的结束，而花括号 `{ }` 内则是多个选项或语句。
>
> 在 BIRD 的配置文件中，有协议实例（`protocol <proto> <n> {}`），过滤器（`filter <n> [local_variables] {}`），函数（`function <n> [local_variables] {}`）可以定义，这些将在下文各部分选择性挑重点介绍。
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
>  print "path 中第一个元素是", P.first, "，最后一个元素是", P.last;
>  # 第一个元素可以认为是邻居的 ASN，最后一个元素是宣告这条路由的 ASN
>  # 这两个在 P 中没有元素的时候是 0
>  print "path 的长度是", P.len;
>  if P.empty then {
>      print "path 为空";
>  }
>  P.prepend(233); # 在 path 的第一个位置插入元素
>  P.delete(233); # 删除 path 中所有等于 233 的元素
>  P.delete([64512..65535]); # 删除 path 中所有属于集合 [64512..65535] 的元素
>  P.filter([64512..65535]); # 只在 path 中留下集合 [64512..65535] 中出现的元素
> 
>  # 如果不想改变 P，可以使用下面这样的方法将操作后的结果存入 P2
>  P2 = delete(P, 233)
>  P2 = filter(P, [64512..65535])
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
>  bgp_local_pref = 233;   # 就将这条路由的 Local Preference 调为 233
> } else {
>  bgp_local_pref = 2333;  # 否则设为 2333
> }
> ```
>
> `case` 的写法如下：
>
> ```
> case arg1 {
>  2: print "two"; print "I can do more commands without {}";
>  #  ^ case 不需要花括号就能在一个分支中写下更多语句。
>  3..5: print "three to five";
>  else: print "something else";
> }
> ```
>
> 在 BIRD 中，if 和 case 的写法均与常见编程语言略有不同。 