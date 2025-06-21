---
title: 开始之前
description: 介绍一些BGP跟Bird的相关知识
---

# 什么是路由

通常而言，路由作为动词就是"将一个数据包根据路由表进行转发的过程“，而作为名词就是”规定了某个 IP 地址段的目标数据应该从哪个接口或通过哪个下一跳设备发送出去“的规则。而一条路由，就是一条"这个目标地址该被转发到哪个接口，交给谁"的记录。路由表，顾名思义，就是记录了很多个路由的表。

当然，路由表内还包含很多比如失效时间、度量、学习来源之类的附属信息。

比如，如下是一条在Linux内记录的去往`10.2.5.0/24`的路由

```
10.2.5.0/24 via 10.254.0.34 dev wg0 proto bird src 10.2.3.1 metric 32
```

接下来我们来分段分析

- `10.2.5.0/24` 目标IP段
- `via 10.254.0.34` 下一跳的IP
- `dev wg0` 目标接口
- `proto bird` 路由来源的协议，此处为bird指的是从bird写入
- `src 10.2.3.1` 当这跳转发的来源是本机的时候，采用的源地址IP
- `matric 32` 路由度量值，存在多个对同一IP段的路由时用来决定选择哪条路由来使用，matric越小路由优先级越高

如果同时有`dev`和`via`，那么会根据ARP表将目标MAC重写为下一跳的MAC（如果表内没有则在`dev`指定的接口查询），然后转发到`dev`指定的接口。

如果仅有`dev`没有`via`，那么会根据ARP表将目标MAC重写为目标地址的MAC（如果表内没有则在`dev`指定的接口查询），然后转发到`dev`指定的接口。

如果仅有`via`没有`dev`，那么会递归查询到至少拥有`dev`的下一跳，根据原来的`via`和查询到的`dev`，按照第一条规则处理。

# BGP Session 、 BYOIP 与 IP Transit

在网络行业中，我们经常会看到不同服务商宣传诸如“提供 BGP Session”、“支持 BYOIP”或“提供 IP Transit”等服务。但这些术语具体指的是什么？它们之间又有何区别？本章将对其进行简要梳理。

## BGP Session

**BGP Session** 指的是与服务商建立 Border Gateway Protocol（边界网关协议）会话的服务，常见于 IDC（数据中心）环境中。通过建立 BGP 会话，你可以将自己的 IP 地址广播到互联网，并通常能够接收到完整的 BGP 路由表（即“全表”）。这种服务多见于各类虚拟服务器，大多数情况下，BGP Session 所产生的流量会与你自身网络的出入流量合并计算。

## BYOIP

**BYOIP** 指的是“自带 IP 地址”的服务，常见于云计算平台（如 AWS、GCP）和部分 SaaS 提供商（如Cloudflare）。这项服务允许你将自己的 IP 地址段（通常是 RIR 分配的）映射到云平台上使用。

与 BGP Session 和 IP Transit 不同的是，许多 BYOIP 服务**并不直接与用户建立 BGP 会话**。虽然服务商依然会使用 BGP 将你的 IP 广播到互联网，但你作为用户通常只需在控制面中提交 IP 段，后台由平台负责路由发布。因此，从你的角度看，它更像是使用一个“静态 IP”，而不是动态的路由对等关系。

## IP Transit

**IP Transit** 是最传统意义上的“接入互联网”服务，主要提供商是 ISP 或上游运营商。购买 IP Transit 意味着你可以使用对方的网络作为通往整个互联网的“高速公路”。

IP Transit 通常包含与对方建立 BGP Session 的能力，以便你用自己的 AS（自治系统号）广播自有的 IP 地址段。这使得你能将自己的网络纳入全球互联网的路由体系中。它的计费单位一般是 Mbps/月，采用 95 分位计费（95th percentile billing）：每 5 分钟记录一次带宽使用量，去掉全月中最高的 5% 样本后，剩下的最大值作为该月计费带宽。

需要注意的是，**IP Transit 提供的是“通向互联网的路径”本身**，而不是像 DIA（Dedicated Internet Access）那样只提供网络访问能力却通常不带 BGP 功能。DIA 常面向企业客户，IP Transit 则更偏向网络服务商、内容分发商等具备一定网络运营能力的客户。

# 什么是BGP

以下文段来自[维基百科](https://zh.wikipedia.org/wiki/%E8%BE%B9%E7%95%8C%E7%BD%91%E5%85%B3%E5%8D%8F%E8%AE%AE)

> **边界网关协议**（英语：Border Gateway Protocol，缩写：BGP）是[互联网](https://zh.wikipedia.org/wiki/互联网)上一个核心的去中心化自治[路由协议](https://zh.wikipedia.org/wiki/路由协议)。它通过维护IP[路由表](https://zh.wikipedia.org/wiki/路由表)或"前缀"表来实现[自治系统](https://zh.wikipedia.org/wiki/自治系统)（AS）之间的可达性，属于矢量路由协议。BGP不使用传统的[内部网关协议](https://zh.wikipedia.org/wiki/内部网关协议)（IGP）的指标，而使用基于路径、网络策略或规则集来决定路由。因此，它更适合被称为矢量性协议，而不是路由协议。
>
> 大多数[互联网服务提供商](https://zh.wikipedia.org/wiki/互联网服务提供商)必须使用BGP来与其他ISP创建路由连接（尤其是当它们采取多宿主连接时）。因此，即使大多数互联网用户不直接使用它，但是与[7号信令系统](https://zh.wikipedia.org/wiki/7号信令系统)——即通过PSTN的跨供应商核心响应设置协议相比，BGP仍然是互联网最重要的协议之一。特大型的私有[IP](https://zh.wikipedia.org/wiki/网际协议)网络也可以使用BGP。例如，当需要将若干个大型的[OSPF](https://zh.wikipedia.org/wiki/OSPF)（[开放最短路径优先](https://zh.wikipedia.org/wiki/开放最短路径优先)）网络进行合并，而OSPF本身又无法提供这种可扩展性时。使用BGP的另一个原因是其能为多宿主的单个或多个ISP（[RFC 1998](https://tools.ietf.org/html/rfc1998)）网络提供更好的冗余。

简而言之，BGP 是在自治系统之间使用的最主要的路由协议（尽管思科的 EIGRP 技术上也支持跨自治系统路由，但在实际互联网中几乎没有应用）。BGP 的核心作用是**在自治系统之间传递路由信息**，并通过策略控制和路径属性来选择并只传播**最优路径**给对端。

# Bird

## 什么是Bird

以下文段来自 [Bird 中文文档](https://bird.xmsl.dev/docs/user-guide/1-1-introduction.html)

> BIRD 全称 `BIRD Internet Routing Daemon`，旨在开发一个功能完备的动态 IP 路由守护进程 (Routing Daemon)，主要针对 Linux、FreeBSD 等其他类 UNIX (UNIX-like) 系统开发适配，完整源代码采用 [GNU 通用公共许可证](https://zh.wikipedia.org/wiki/GNU通用公共许可证) ([GNU General Public License](https://en.wikipedia.org/wiki/GNU_General_Public_License)) 协议发布，它负责在运行 IP 协议的互联网上的路由器之间传递路由信息。
>
> BIRD 此前是 [布拉格查拉斯大学 (Charles University in Prague)](https://en.wikipedia.org/wiki/Charles_University) 数学和物理学院的一个研究项目。 从2009年开始由捷克域名注册机构 - [CZ.NIC Labs](https://labs.nic.cz/) 接手项目并全权负责开发和维护。
>
> **前 BIRD 团队成员**
>
> - Libor Forst `<forst@cuni.cz>`
> - Pavel Machek `<pavel@ucw.cz>`
>
> **现 BIRD 团队成员及主要贡献**
>
> - Ondřej Filip `<feela@network.cz>` - OSPF、BSD、版本发行 / 打包
> - Martin Mares `<mj@ucw.cz>` - 总体架构、 核心代码、 存储(dump)、 BGP
> - Ondřej Zajíček `<santiago@crfreenet.org>` - 新 BGP 特性、OSPFv3、BFD
> - Maria Matějka `<mq@jmq.cz>` - MPLS、过滤器、多线程支持
>
> 路由器一般只与相邻的路由器交换路由信息，这样就可以快速发现网络中的拓扑结构，以找到到达目标路由器的最佳（以某种度量为基础）路径，并不断地更新路由表，以便在网络拓扑发生变化（如链路故障、新增链路）时，能够及时地找到最新的最佳路径。
>
> 在 BIRD 出现之前，这些路由器之间的路由信息交换是通过价格昂贵的专用硬件完成的，而 BIRD 的出现，使得这些路由器可以通过普通的计算机（通常是运行 Linux 或类 UNIX 的操作系统）来实现。



如上所写，bird是一个在*nix和FreeBSD平台运行的路由守护进程，支持包括但不限于BGP、RIP、OSPF、Babel等协议。同类产品还有`OpenBGPD`, `FRRouting`等。但是目前使用比较广的软件路由守护进程是Bird，本快速教程也将使用Bird作为主要的路由工具。

## Bird的版本变迁

Bird目前有三个大版本：v1, v2, v3

### v1

Bird v1 是最早的Bird，由两个Daemon分别支持IPv4与IPv6的路由，最晚版本是1.6.8，于2019年9月11日发布。

目前而言我们不推荐使用此版本。

### v2

Bird v2是目前Bird的主线版本。与v1相比，v2仅使用一个Daemon来运行v4与v6的路由。

### v3

Bird v3是Bird的下一代版本，该版本增加了多线程的支持。在本教程中，我们将使用 bird v3 作为路由守护进程。

## 如何安装Bird

请参考 https://bird.xmsl.dev/docs/user-guide/1-2-installing.html 

## Bird的基本语法

请参考 https://bird.xmsl.dev/docs/user-guide/5-1-introduction.html 