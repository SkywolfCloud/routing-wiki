---
title: 概念解析
description: 理解互联时需要掌握的关键概念
---

在我们开始学习之前，先来了解一些多人连接中需要的概念。

# 上、下游与对等

在网络连接中，作为一个自治系统（AS），其他人与你的关系主要有三种：

- **上游（Upstream）**：例如你服务商就是你的上游。上游通常会向你提供 BGP 全表，即整个互联网的路由，让你能顺利接入全球互联网。而你只需要向上游广播你自己及下游的路由。一般来说，上游需要付费购买（如 IP Transit），但也有出于学术、爱好等目的提供免费服务的（如 [HE](https://he.net) 的 IPv6 Transit，用于推广 IPv6 覆盖~~以及在 IPv6 时代争夺 T1 地位~~）。
- **下游（Downstream）**：相反，你对你的客户就是他们的上游。你的下游向你广播他们及他们下游的路由，而你需要向他们提供全表，让他们也能接入互联网。
- **对等（Peer）**：如 Google 与 Microsoft 互为 Peer。Peer 之间直接互联主要为了降低延迟（如同在 IX 交换）并节省费用，双方通常互换自己的路由及下游路由而不走上游。Peer 关系多见于互联网交换中心（IX），如 SFMIX、DE-CIX、EIE（Equinix Internet Exchange），国内也有前海 IX、杭州 IX 等新兴力量。

Peer 有两层含义，一种是名词，或者说是在商业层面上的**对等**，具体见上；一种是在协议层面上的**对等**，为动词，也就是建立 BGP 连接，但通常建立的都是 Peer 关系。

# Tier 1,2,3

> 您们好。
> 我们公司实际上是一级运营商(Tier 1 – AS 174)，在全球包括美洲、欧洲、亚洲超过 199 个市场（40 多个国家）都设有节点。在多个国家都有接点数据中心。
>
> ......

不知道你有没有收到过，这是 Cogent 的一封推广邮件。这里面出现了一个名词：一级运营商。那什么是一级运营商呢？

以下内容抄自[维基百科](https://zh.wikipedia.org/wiki/Tier_1%E7%BD%91%E7%BB%9C)

> **Tier 1 网络**（Tier 1 network）是一种仅通过免费[对等互联](https://zh.wikipedia.org/wiki/Peering)（settlement-free interconnection、settlement-free peering）即可到达[互联网](https://zh.wikipedia.org/wiki/互联网)所有其他网络的[网际协议](https://zh.wikipedia.org/wiki/网际协议)网络。
>
> ......
>
> 最合理的定义是，Tier 1 网络供应商永远不会支付转发费用，因为所有 Tier 1 网络供应商的集合都向各地所有较低级别的网络供应商出售转发服务，而且因为：
>
> - 所有 Tier 1 网络供应商都与全球其他所有 Tier 1 网络供应商对等互联，
> - 对等协议允许访问所有转发客户，这意味着：
> - Tier 1 网络包含所有连接到全球互联网的主机。

简单来说，Tier 1 就是网络的最上层，它不需要买 IP Transit 就能到达别人，它跟别人都是**免费**peer，如 NTT、PCCWG、Lumen。而比 Tier 1 低一点的是区域 Tier 1（Regional Tier 1），例如中国电信和 Singtel，它们在本地像 Tier 1 一样免费 peer，但在非本地区域需要购买 IP Transit 或 Paid Peer。

而比 Tier 1 低一点的，是 Tier 2，也就是跟一些人免费 peer 了，但跟一些人还是需要买 IP Transit 或付费 Peer（Paid Peer），比如前面提到的 HE、Cogent。严格来讲，区域 Tier 1 也是 Tier 2。Tier 2 的定义其实比较大，通常只要你参加了一些 IX，你就可以算作是 Tier 2 了。

比 Tier 2 更低的，是 Tier 3，这种网络跟其他网络只能通过付费途径到达，具体来说就是一些 IDC、公司或 Player 了。

Tier 2 网络会与一些人免费 peer，但还需向其他网络购买 IP Transit 或 Paid Peer，典型如 HE、Cogent。若你加入了 IX，你一般也算是 Tier 2。

Tier 3 是最下层，需付费通过上游或 Peer 转发流量，典型是 IDC、小公司等。

# AS-SET

前文我们说过，验证一个 IP 是否授权一个 AS 广播靠的是路由对象。那如何验证一个 AS 是否包括一个 AS 作为它的下游呢？那就要靠 AS-SET 了。

顾名思义，AS-SET 是 AS 的 SET（集合）。当你要求某个 IP Transit 供应商使用这个 AS-SET 进行过滤，就意味着只有这个 AS-SET 下的 ASN 的 IP 才可以通过这个 IP Transit 广播（通过筛选路由对象），有效地防止了路由泄露。AS-SET 也是被记录在 IRR 里，因此前文提到的 IRR 都可以创建 AS-SET。如果你要带下游，你就要把你的下游的 ASN 放进你的 AS-SET，才能让你的上游确认 ta 是你的下游。

一个 AS-SET 的经典示例：

```yaml
as-set:         AS13335:AS-CLOUDFLARE
descr:          Cloudflare, Inc.
                101 Townsend Street, San Francisco
                California 94107, US
+               1-650-319-8930
members:        AS13335,AS13335:AS-CUSTOMERS,AS132892,AS133877,AS202623,AS209242,AS394536
remarks:        ---------------
                Cloudflare announces its ASNs via many upstream ASNs
                All Cloudflare abuse reporting can be done via
                https://www.cloudflare.com/abuse
                ---------------
admin-c:        ADMIN2521-ARIN
tech-c:         ADMIN2521-ARIN
tech-c:         CLOUD146-ARIN
mnt-by:         MNT-CLOUD14
created:        2023-04-05T08:58:54Z
last-modified:  2025-01-16T19:57:46Z
source:         ARIN
```

验证谁是我下游的问题解决了，但怎么验证谁能当我上游呢？目前只能靠信用来解决，这也导致了通过伪造起源 AS 进行的盗播事件时有发生。目前，一项叫 ASPA（Autonomous System Relationship Authorization）的技术正在起草其 RFC，OpenBGPD 也已经提供了实现。我们可以期待未来该技术能够普及，互联网将更加干净，安全。
