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

### IRR

IRR（Internet Routing Registry）是存储互联网路由对象的数据库，里面记录了某个前缀该被路由到哪个ASN。IRR实际上由很多个数据库组成，具体列表请看[这里](https://www.irr.net/docs/list.html)。五大RIR（ARIN，RIPE，AFRINIC，APNIC，LACNIC），比较老的T1（LEVEL3，NTTCOM）都有自己的IRR数据库，同时还有一个商业数据库RADb和一个非营利数据库ALTDB。这9个数据库是目前比较通用的数据库。

### RPKI

关于RPKI的介绍我推荐查看[这篇文章](https://blog.cloudflare.com/rpki/)。简而言之，RPKI也可以用来将ASN与路由关联在一起，但与IRR的区别是RPKI需要使用证书签名，使用它可以有效地防止路由劫持。

### 上下游和对等

在业务中，我们遇到的需要建立BGP的对象主要可以分为三类：上游，下游和对等。

#### 上游

上游（Upstream），即向你提供互联网服务（IP Transit）的对象，比如各类ISP。一般而言，上游一般会发送互联网的全部路由，即全表。对于某些业务，上游可能仅会发送一部分路由（例如中国优化路由）。

对于上游，我们应发送从自身和下游收到的路由。

#### 下游

下游（Downstream），即你向其提供互联网服务（IP Transit）的对象。

对于下游，我们应发送从自身、上游、下游、对等收到的表，即全表。对于特殊下游（例如路由优化业务），我们仅发送所需的路由。对于有IP段白名单的特殊上游，我们应仅向拥有白名单内IP段的下游发相关路由。

#### 对等

对等（Peer），通常而言是你/对方需要直接访问对方/你服务的对象，例如Cloudflare和Google。一般对等的目的是节省结算费用（通常楼内线的费用远小于同等带宽的IP Transit费用）。

对于对等，我们应发送从自身和下游收到的路由。

#### 发表

总而言之，发表可以总结为如下规则：

- 上游和对等：仅发送从自身和下游收到的路由。
- 下游：一般发全表。对于特殊下游，根据所购买的服务发路由。对于有IP段白名单的特殊上游，我们应仅向拥有白名单内IP段的下游发相关路由。
- 路由优先级：下游>对等>上游

### AS-SET

AS-SET，顾名思义，一个AS的集合。一个AS-SET内通常要包含自己以及自己的下游的ASN。AS-SET允许嵌套。

### BGP Community

BGP Community（也称BGP社区） 类似于给路由的标签，对等方可以根据标签内容来做出自己的选择。

BGP Community 有如下三种类型：

- `BGP Community (BGP社区)`，为一个4字节的值，在Bird内显示为`(2byte ASN,2byte value)`，前二字节为ASN，后二字节由AS自由分配。由于使用它需要一个2byte的ASN（目前申请比较困难），所以一般在大ISP中能见到，或者使用保留ASN。
- `BGP Extended Community (BGP扩展社区)`，在鸟内一般表示为`(type,administrator,value)`，为一个八字节的值，前二字节为类型，后六字节为管理员和分配的编号，由AS自行分配。它比较著名的应用位于MPLS-VPN内。
- `BGP Large Community (BGP大型社区)`，在鸟内一般表示为`(4byte ASN,4byte value,4byte value)`，为一个12字节的值，前四字节为ASN，中间四字节与后四字节由AS自由分配。它被开发的主要原因是因为4字节ASN不能用于普通的BGP社区。

目前，在公网上应用比较广的主要为`BGP Community`与`BGP Large Community`

RFC要求所有支持BGP社区的路由器必须处理知名的BGP社区，也就是`NO_EXPORT`, `NO_ADVERTISE`和`NO_EXPORT_SUBCONFED`。在默认情况下，bird会自动处理这些BGP社区。



## 过滤器

**过滤器非常的重要，做好自己的过滤是对与你建立BGP连接的人的尊敬，如果要为下游服务更是如此**

### 规则

过滤器过滤要基于一套规则。下面我们来看一下HE的规则：

> # Hurricane Electric Route Filtering Algorithm
>
> This is the route filtering algorithm for customers and peers that have explicit filtering:
>
> 1. Attempt to find an as-set to use for this network.
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
> 2. Collect the received routes for all BGP sessions with this ASN. This details both accepted and filtered routes.
>
> 3. For each route, perform the following rejection tests:
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
> 4. For each route, perform the following acceptance tests:
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
> 5. Reject all prefixes not explicitly accepted

翻译

> # Hurricane Electric 的路由过滤算法
>
>
> 这是具有显式过滤的客户和对等方的路由过滤列表：
>
> 1.尝试查找该网络的AS-SET
>
> 1.1 使用在PeeringDB中匹配该ASN所属IRR策略中的AS-SET如果它存在
>
> 1.2 在 IRR 中，查询此 ASN 的 aut-num。如果存在，请检查此 ASN 的 aut-num 以查看我们是否可以从他们的 IRR 策略中提取他们将通过查找到 AS6939、ANY 或 AS-ANY 的 export 或 mp-export 向 HE 宣布的内容的资产。
> 优先顺序如下：使用第一个匹配项，在“mp-export”之前检查“export”，在“export: to ANY”或“export: to AS-ANY”之前检查“export: to AS6939”。
> 如果存在，请使用查询来验证AS-SET。
>
> 1.3 检查由 HE 的 NOC 维护的各种内部列表，这些列表将 ASN 映射到我们发现或被告知它们的AS-SET。
> 如果存在，请使用通过查询来验证AS-SET。
>
> 1.4 如果前面的步骤没有找到AS-SET，则使用 ASN。
>
> 2. 收集与此 ASN的所有 BGP 会话接收的路由。这个结果同时接受并进行过滤。
>
> 3. 对于每条路由，执行以下拒绝测试：
>
> 3.1 拒绝默认路由 0.0.0.0/0 和 ::/0。
>
> 3.2 拒绝使用 BGP AS_SET 表示法的 AS 路径（即 {1} 或 {1 2} 等）。请参阅draft-ietf-idr-deprecate-as-set-confed-set。
>
> 3.3 拒绝前缀长度小于最小值和大于最大值。IPV4中为 8 和 24，IPV6为16 和 48。
>
> 3.4 拒绝 bogons（RFC1918、文档前缀等）。
>
> 3.5 拒绝 HE 连接到的所有来自IXP的前缀。
>
> 3.6 拒绝长度超过 50 跳的 AS 路径。过多的 BGP AS 路径预置是一个自我造成的漏洞。
>
> 3.7 拒绝使用 1000000 到 4199999999 之间未分配的 32 位 ASN 中的 AS 路径。 请参阅 https://www.iana.org/assignments/as-numbers/as-numbers.xhtml
>
> 3.8 拒绝使用 AS23456 的 AS 路径。 在支持 32 位 ASN 的 BGP 广播的 AS 路径中不应遇到 AS23456。
>
> 3.9 拒绝使用 AS 0 的 AS 路径。根据 RFC 7606，“BGP 广播者不得发起或传播 AS 编号为零的路由”。
>
> 3.10 拒绝在源ASN或IP前缀的RPKI中含有INVALID_ASN 或 INVALID_LENGTH状态的路由
>
> 4. 对于每条路由，执行以下接受测试：
>
> 4.1 据源 AS 和前缀接受 RPKI 状态为 VALID 的路由。
>
> 4.2 如果前缀是一个宣布的下游路由并是一个已接受的起源前缀的子网，该前缀由于 RPKI 或 RIR 句柄匹配而被接受，则接受该前缀。
>
> 4.3 如果 RIR 处理前缀和对等 AS 匹配，则接受前缀。
>
> 4.4 如果此前缀与该对等网络的 IRR 策略允许的前缀完全匹配，则接受该前缀。
>
> 4.5 如果路径中的第一个 AS 与对等网络匹配，并且路径为两跳，并且源 AS 在对等 AS 的扩展AS-SET中，并且 RPKI 状态为 VALID 或存在与源 AS 的 RIR 句柄匹配和前缀，接受前缀。
>
> 5. 拒绝所有未明确接受的前缀

Skywolf 的规则：

1. 若路由为默认路由，或长度小于最小值/大于最大值，则拒绝。（对于 IPv4，这是 8 和 24。对于 IPv6 来说，这是 16 和 48。）
2. 若路由的起源ASN为保留ASN，或BGP Path中包含保留ASN，则拒绝。
3. 若路由为保留前缀，则拒绝。
4. 若路由的IRR与ASN匹配，且RPKI不为INVALID，则接受。

总结而言，对于对等与下游，我们只应该接受路由长度大于最小值小于最大值，path内不包含保留ASN，不为保留前缀，且IRR匹配，RPKI不为INVALID的路由。

而对于上游，我们仅验证RPKI不为INVALID，路由长度大于最小值小于最大值，path内不包含保留ASN，不为保留前缀即可，不必验证IRR。

### 上下游对等与自我路由的区分

因为如上规则，所以我们需要将上下游对等与自身需要BGP广播出去的路由加以区分。

我们有两种区分方式：

1. 通过BGP Community来实现
2. 通过分表来实现

在这里，我们仅讲述第一种，有需要可以自己去研究第二种。



### 实现

下面我们将分为常规过滤，RPKI过滤，IRR过滤跟过滤器撰写来一一实现

#### 常规过滤

这一部分都是些固定的杂活，直接照抄即可。

```
define BOGON_ASNS = [ # 定义保留ASN
    0,                      # RFC 7607
    23456,                  # RFC 4893 AS_TRANS
    64496..64511,           # RFC 5398 and documentation/example ASNs
    64512..65534,           # RFC 6996 Private ASNs
    65535,                  # RFC 7300 Last 16 bit ASN
    65536..65551,           # RFC 5398 and documentation/example ASNs
    65552..131071,          # RFC IANA reserved ASNs
    4200000000..4294967294, # RFC 6996 Private ASNs
    4294967295              # RFC 7300 Last 32 bit ASN
];
define BOGON_PREFIXES_V4 = [ # 定义保留IPv4前缀
    0.0.0.0/8+,             # RFC 1122 'this' network
    10.0.0.0/8+,            # RFC 1918 private space
    100.64.0.0/10+,         # RFC 6598 Carrier grade nat space
    127.0.0.0/8+,           # RFC 1122 localhost
    169.254.0.0/16+,        # RFC 3927 link local
    172.16.0.0/12+,         # RFC 1918 private space 
    192.0.2.0/24+,          # RFC 5737 TEST-NET-1
    192.88.99.0/24{25,32},        # RFC 7526 deprecated 6to4 relay anycast. If you wish to allow this, change `24+` to `24{25,32}`(no more specific)
    192.168.0.0/16+,        # RFC 1918 private space
    198.18.0.0/15+,         # RFC 2544 benchmarking
    198.51.100.0/24+,       # RFC 5737 TEST-NET-2
    203.0.113.0/24+,        # RFC 5737 TEST-NET-3
    224.0.0.0/4+,           # multicast
    240.0.0.0/4+            # reserved
];
define BOGON_PREFIXES_V6 = [ # 定义保留IPv6前缀
    ::/8+,                  # RFC 4291 IPv4-compatible, loopback, et al
    0064:ff9b::/96+,        # RFC 6052 IPv4/IPv6 Translation
    0064:ff9b:1::/48+,      # RFC 8215 Local-Use IPv4/IPv6 Translation
    0100::/64+,             # RFC 6666 Discard-Only
    2001::/32{33,128},      # RFC 4380 Teredo, no more specific
    2001:2::/48+,           # RFC 5180 BMWG
    2001:10::/28+,          # RFC 4843 ORCHID
    2001:db8::/32+,         # RFC 3849 documentation
    2002::/16{17,128},             # RFC 7526 deprecated 6to4 relay anycast. If you wish to allow this, change `16+` to `16{17,128}`(no more specific)
    3ffe::/16+, 5f00::/8+,  # RFC 3701 old 6bone
    fc00::/7+,              # RFC 4193 unique local unicast
    fe80::/10+,             # RFC 4291 link local unicast
    fec0::/10+,             # RFC 3879 old site local unicast
    ff00::/8+               # RFC 4291 multicast
];
function general_check(){ # 返回true则拒绝，返回false则允许
	if bgp_path ~ BOGON_ASNS then return true; # 如果路径包含保留ASN则返回true
    case net.type {
        NET_IP4: return net.len > 24 || net ~ BOGON_PREFIXES_V4; # IPv4 CIDR 大于 /24 为太长
        NET_IP6: return net.len > 48 || net ~ BOGON_PREFIXES_V6; # IPv6 CIDR 大于 /48 为太长
        else: print "unexpected net.type , net.type, " ", net; return false; # 保底，一般不应该出现非IP4/IP6的前缀。
    }
};
```

#### RPKI

配置RPKI最简单的方法是使用RTR连接上现有的RPKI验证服务器。在这里，我们会使用Cloudflare的服务器。

目前而言，公网有大量的前缀没有签署RPKI，所以我们仅拒绝INVALID的路由，允许UNKNOWN与VALID的路由。

如下所示：

```
roa4 table rpki4; # 定义两个ROA表，用来接收RPKI。
roa6 table rpki6; # 定义两个ROA表，用来接收RPKI。

protocol rpki rpki_cloudflare { # 配置RPKI协议示例，取名为rpki_cloudflare
  roa4 {
    table rpki4; # 指定roa表
  };
  roa6 {
    table rpki6; # 指定roa表
  };
  remote "rtr.rpki.cloudflare.com" port 8282; # 指定RTR服务器
  retry keep 5;
  refresh keep 30;
  expire 600;
  transport tcp; 
}
function rpki_check() { # 定义rpki检查函数，如果验证为INVALID则为 true
    if ( net.type = NET_IP4 && roa_check(rpki4, net, bgp_path.last) = ROA_INVALID ) then {
    return true;
  }
  else if ( net.type = NET_IP6 && roa_check(rpki6, net, bgp_path.last) = ROA_INVALID ) then {
    return true;
  }
  else {
    return false;
  }
}
```

#### IRR

对于IRR，由于IRR没有一个协议来进行分发，所以我们需要使用如下步骤来生成前缀列表，从而过滤IRR：

1. 使用比如`bgpq4`等软件获取ASN/ASSET的IP前缀列表。
2. 用工具将前缀拼合进如下函数
3. 与前后拼合，重载bird

```
function irr_check(string as_set) { # 定义IRR检查函数，如果验证正确则返回true
	if net.type = NET_IP4 then { # IPv4检查
		if as_set = "<AS-SET>" then {if net ~ [<前缀IP段>/<前缀长度>{<前缀长度>,24}, <前缀IP段>/<前缀长度>{<前缀长度>,24} ...] then return true;else return false;};
		if as_set = "<AS-SET>" then {if net ~ [<前缀IP段>/<前缀长度>{<前缀长度>,24} ...] then return true;else return false;};
		if as_set = "<AS-SET>" then {if net ~ [<前缀IP段>/<前缀长度>{<前缀长度>,24} ...] then return true;else return false;};
	} else if net.type = NET_IP6 then { # IPv6检查
		if as_set = "<AS-SET>" then {if net ~ [<前缀IP段>/<前缀长度>{<前缀长度>,48} ...] then return true;else return false;};
		if as_set = "<AS-SET>" then {if net ~ [<前缀IP段>/<前缀长度>{<前缀长度>,48} ...] then return true;else return false;};
		if as_set = "<AS-SET>" then {if net ~ [<前缀IP段>/<前缀长度>{<前缀长度>,48} ...] then return true;else return false;};
	} else 
};
```

其中<>为参数，格式为：

- \<AS-SET\>: `AS114514`, `AS114514:AS-ALL`, `AS-SKYWOLF`
- \<前缀IP段\>: `192.168.0.0`或`2404::`
- \<前缀长度\>: `24`

至于工具，就交给你们自己去写吧（逃

#### 过滤器撰写

# TODO

现在，我们就需要将上面的东西都拼合到一起，从而写出最终的过滤器。

由于我们的过滤器需要携带参数，所以我们不使用`filter`，转而使用`function`，并在编写会话的时候使用`where`语句来调用。

如下所示:

```
function import_filter_upstream() {

}
```

