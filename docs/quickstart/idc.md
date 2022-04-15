---
title: 阶段2 向他人服务
---

# 向他人服务

在这篇文章中，我们将讲述在给他人提供服务的时候，应该如何搭建一个更可靠的BGP系统。

## 前言

我个人认为，这一部分会比较重要。

## 开始之前

我们假设：

- 你只拥有IPv6段

- 你的ASN是 `AS114514`
- 你的IPv6段为 `2404::/48`，你计划能使用 `2404::1`访问这台机器
- 该机器的公网IPv4为 `1.1.1.1` 公网IPv6为 `2405::1`
- 你的BGP上游为`AS7720`，对方的IPv6为`2405::2`，对方的IPv6前缀为`2404:1::/48`
- 你的BGP下游为`AS218072`，对方的IPv6为`2405::3`，对方的IPv6前缀为`2404:2::/48`
- 你的BGP对等为`AS6939`，对方的IPv6为`2405::4`，对方的IPv6前缀为`2404:3::/48`
- 你与你的邻居在同一个子网且一跳可达

**该设置将通用于本篇文章**

## 概念

### 上下游和对等

在业务中，我们遇到的需要建立BGP的对象主要可以分为三类：上游，下游和对等。

#### 上游

上游（Upstream），即向你提供互联网服务（IP Transit）的对象，比如各类ISP。一般而言，上游一般会发送互联网的全部路由，即全表。对于某些业务，上游可能仅会发送一部分路由（例如中国优化路由）。

对于上游，我们应发送从自身和下游收到的路由。

#### 下游

下游（Downstream），即你向其提供互联网服务（IP Transit）的对象。

对于下游，我们应发送从自身、上游、下游、对等收到的表，即全表。对于特殊下游（例如路由优化业务），我们仅发送所需的路由。对于有IP段白名单的特殊上游，我们应仅向拥有白名单内IP段的下游发相关路由。

#### 对等

对等（Peer），通常而言是你/对方需要直接访问对方/你服务的对象，例如Cloudflare和Google。一般对等的目的是节省结算费用（通常楼内线的费用远于宽带费用）。

对于对等，我们应发送从自身和下游收到的路由。

#### 发表

总而言之，发表可以总结为如下规则：

- 上游和对等：仅发送从自身和下游收到的路由。
- 下游：一般发全表。对于特殊下游，根据所购买的服务发路由。对于有IP段白名单的特殊上游，我们应仅向拥有白名单内IP段的下游发相关路由。
- 路由优先级：下游>对等>上游

### AS-SET

AS-SET，顾名思义，一个AS的集合。一个AS-SET内通常要包含自己以及自己的下游的ASN。AS-SET允许嵌套。

## 过滤器

**过滤器非常的重要，做好自己的过滤是对与你建立BGP连接的人的尊敬，如果要为下游服务更是如此**

### 规则

过滤器过滤要基于一套规则。下面我们来看一下HE的规则：

> # Hurricane Electric Route Filtering Algorithm
>
> This is the route filtering algorithm for customers and peers that have explicit filtering:
>
> \1. Attempt to find an as-set to use for this network.
>
> 1.1 In peeringdb, for this ASN, check for an IRR as-set name.
> Validate the as-set name by retrieving it. If it exists, use it.
>
> 1.2 In IRR, query for an aut-num for this ASN. If it exists, inspect the aut-num for this ASN to see if we can extract from their IRR policy an as-set for what they will announce to Hurricane by finding export or mp-export to AS6939, ANY, or AS-ANY.
> Precedence is as follows: The first match is used, "export" is checked before "mp-export", and "export: to AS6939" is checked before "export: to ANY" or "export: to AS-ANY".
> Validate the as-set name by retrieving it. If it exists, use it.
>
> 1.3 Check various internal lists maintained by Hurricane Electric's NOC that map ASNs to as-set names where we discovered or were told of them.
> Validate the as-set name by retrieving it. If it exists, use it.
>
> 1.4 If no as-set name is found by the previous steps use the ASN.
>
> \2. Collect the received routes for all BGP sessions with this ASN. This details both accepted and filtered routes.
>
> \3. For each route, perform the following rejection tests:
>
> 3.1 Reject default routes 0.0.0.0/0 and ::/0.
>
> 3.2 Reject AS paths that use BGP AS_SET notation (i.e. {1} or {1 2}, etc). See draft-ietf-idr-deprecate-as-set-confed-set.
>
> 3.3 Reject prefix lengths less than minimum and greater than maximum. For IPv4 this is 8 and 24. For IPv6 this is 16 and 48.
>
> 3.4 Reject bogons (RFC1918, documentation prefix, etc).
>
> 3.5 Reject exchange prefixes for all exchanges Hurricane Electric is connected to.
>
> 3.6 Reject AS paths that exceed 50 hops in length. Excessive BGP AS Path Prepending is a Self-Inflicted Vulnerability.
>
> 3.7 Reject AS paths that use unallocated 32-bit ASNs between 1000000 and 4199999999. https://www.iana.org/assignments/as-numbers/as-numbers.xhtml
>
> 3.8 Reject AS paths that use AS 23456. AS 23456 should not be encountered in the AS paths of BGP speakers that support 32-bit ASNs.
>
> 3.9 Reject AS paths that use AS 0. As per RFC 7606, "A BGP speaker MUST NOT originate or propagate a route with an AS number of zero".
>
> 3.10 Reject routes that have RPKI status INVALID_ASN or INVALID_LENGTH based on the origin AS and prefix.
>
> \4. For each route, perform the following acceptance tests:
>
> 4.1 If the origin is the neighbor AS, accept routes that have RPKI status VALID based on the origin AS and prefix.
>
> 4.2 If the prefix is an announced downstream route that is a subnet of an accepted originated prefix that was accepted due to either RPKI or an RIR handle match, accept the prefix.
>
> 4.3 If RIR handles match for the prefix and the peer AS, accept the prefix.
>
> 4.4 If this prefix exactly matches a prefix allowed by the IRR policy of this peer, accept the prefix.
>
> 4.5 If the first AS in the path matches the peer and path is two hops long and the origin AS is in the expanded as-set for the peer AS and either the RPKI status is VALID or there is an RIR handle match for the origin AS and the prefix, accept the prefix.
>
> \5. Reject all prefixes not explicitly accepted

翻译

> # 飓风电力的路由过滤算法
>
> 这是对客户和对等人有明确过滤的路由过滤算法。
>
> \1. 试图为这个网络找到一个as-set来使用。
>
> 1.1 在peeringdb中，对于这个ASN，检查一个IRR as-set名称。
> 通过检索验证as-set的名称。如果它存在，就使用它。
>
> 1.2 在IRR中，查询该ASN的aut-num。 如果存在，检查该ASN的aut-num，看看我们是否可以从他们的IRR策略中提取as-set，即他们将通过找到出口或mp-export到AS6939、ANY或AS-ANY来向Hurricane宣布什么。
> 优先顺序如下。使用第一个匹配，在 "mp-export "之前检查 "export"，在 "export: to ANY "或 "export: to AS-ANY "之前检查 "export:to AS6939"。
> 通过检索验证as-set的名称。如果它存在，就使用它。
>
> 1.3 检查由飓风电气的NOC维护的各种内部列表，这些列表将ASN映射到我们发现或被告知的as-set名称。
> 通过检索验证as-set的名称。如果它存在，就使用它。
>
> 1.4 如果在前面的步骤中没有找到as-set名称，则使用ASN。
>
> \2. 收集所有具有该ASN的BGP会话的接收路由。这将详细说明接受和过滤的路由。
>
> \3. 对于每个路由，执行以下拒绝测试。
>
> 3.1 拒绝默认路由0.0.0.0/0和::/0。
>
> 3.2 拒绝使用BGP AS_SET符号的AS路径（即{1}或{1 2}，等等）。参见 draft-ietf-idr-deprecat-as-set-confed-set。
>
> 3.3 拒绝长度小于最小值和大于最大值的前缀。对于 IPv4，这是 8 和 24。对于 IPv6 来说，这是 16 和 48。
>
> 3.4 拒绝假名（RFC1918，文档前缀等）。
>
> 3.5 拒绝Hurricane Electric所连接的所有交换所的前缀。
>
> 3.6 拒绝长度超过50跳的AS路径。过多的BGP AS路径预置是一种自残式的漏洞。
>
> 3.7 拒绝使用1000000和4199999999之间未分配的32位ASN的AS路径。https://www.iana.org/assignments/as-numbers/as-numbers.xhtml
>
> 3.8 拒绝使用AS 23456的AS路径。在支持32位ASN的BGP发言人的AS路径中不应该遇到AS 23456。
>
> 3.9 拒绝使用AS 0的AS路径。 根据RFC 7606，"BGP发言人不得发起或传播AS号为零的路由"。
>
> 3.10 根据起源AS和前缀，拒绝具有RPKI状态INVALID_ASN或INVALID_LENGTH的路由。
>
> \4. 对于每个路由，执行以下验收测试。
>
> 4.1 如果原点是邻居AS，接受基于原点AS和前缀的RPKI状态为VALID的路由。
>
> 4.2 如果前缀是已公布的下游路由，是已接受的起源前缀的子网，由于RPKI或RIR句柄匹配而被接受，接受该前缀。
>
> 4.3 如果前缀和对等AS的RIR句柄匹配，则接受该前缀。
>
> 4.4 如果该前缀与该对等体的IRR策略所允许的前缀完全匹配，则接受该前缀。
>
> 4.5 如果路径中的第一个AS与对等体相匹配，并且路径有两跳，原生AS在对等体AS的扩展as-set中，并且RPKI状态是VALID，或者原生AS和前缀有RIR句柄匹配，则接受该前缀。
>
> \5. 拒绝所有未明确接受的前缀

Skywolf 的规则：

1. 若路由为默认路由，或长度小于最小值/大于最大值，则拒绝。（对于 IPv4，这是 8 和 24。对于 IPv6 来说，这是 16 和 48。）
2. 若路由的起源ASN为保留ASN，或BGP Path中包含保留ASN，则拒绝。
3. 若路由为保留前缀，则拒绝。
4. 若路由的RIR与ASN匹配，且RPKI不为INVALID，则接受。

总结而言，我们只应该接受路由长度大于最小值小于最大值，path内不包含保留ASN，不为保留前缀，且RIR匹配，RPKI不为INVALID的路由。

