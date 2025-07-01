---
title: 二、拉起一个BGP会话
description: 快速与上游建立连接
---

经过一番申请，你终于拿到了属于自己的 IP 和 ASN，并买好了支持 BGP Session 的 VPS，也在上面安装好了 BIRD。然而，当服务商把 IP 和 ASN 丢给你后，你可能一脸茫然：我该怎么配置 BIRD，才能让它正确广播、只发我自己的路由？没关系，在这篇文章，你将会学到如何把你的 IP 段广播出去，完成你人生中的第一次广播！

考虑到大多数 BGP Player 当前主要持有 IPv6 段，本章示例将以 IPv6 为主，IPv4 的配置方法大同小异。

假设你的 ASN 和 IP 信息如下：

- **ASN**：AS114514
- **机器上的 IP**：`fc00::2/64`
- **待广播 IP 段**：`2001:db8::/48`

在本章中，我们使用的系统为 Debian 12，BIRD 版本为 2.17.1。

# 配置 BIRD

BIRD 安装好后，`/etc/bird/bird.conf` 默认会带有一份 200 多行的示例配置文件，里面展示了 BIRD 的多种用法。你可以先备份一份以备研究，但在这里我们先将其清空，从零开始编写。执行以下命令即可：

```shell
echo > /etc/bird/bird.conf
```

这样就得到了一个空白的配置文件。

**注意：请不要随意修改 `envvars` 文件**。它对 **BIRD** 服务正常运行至关重要。如果误改，可按以下内容恢复：

```shell
BIRD_RUN_USER=bird
BIRD_RUN_GROUP=bird
#BIRD_ARGS=
```

## 常量定义

在配置文件的最开头，我们先把各类常量定义一下：

```bird2 {2, 3, 4}
log syslog all;
router id 10.0.0.1; # 定义 Router ID
define ASN = 114514; # 定义本地使用的 ASN
define OWN_IPv6 = [2001:db8::/48]; # 定义将要对外宣布的 IPv6 段
```

这里做了三件事：

- 用 `log syslog all;` 把所有日志写到系统日志，方便排错。
- 用 `router id` 指定一个全局 Router ID。Router ID 必须为一段全球唯一的 32 位无符号整数 (uint32_t)，不过为了便于标识，通常使用机器上的公网 IPv4 单播地址。如果你的机器上有网卡绑定 IPv4 地址的话，也可以删掉这行，BIRD 会找一个网卡的 IPv4 地址作为 Router ID，不过最好还是自己指定。
- 用 `define` 定义变量，后面写配置时重复用 `ASN` 和 `OWN_IPv6` 会更简洁。

## 协议块

接下来是核心的基础 `protocol` 配置，用来告诉 BIRD 如何和系统打交道。

```bird2
protocol device {
};
protocol kernel {
    ipv6 {
        export all;
    };
};
protocol static static_v6 {
    ipv6;
    route 2001:db8::/48 reject; #在 static 中添加你需要广播的路由
};
```

这里包含三个部分：

- `protocol device`：让 BIRD 能读取本机的网卡信息。
- `protocol kernel`：把 BIRD 学到的路由写回 Linux 内核路由表（FIB），否则操作系统无法真正使用这些路由。
- `protocol static`：在 BIRD 内声明你要对外宣布的静态前缀。

`static` 协议用于在 BIRD 内定义要广播的路由，示例如下（引用自 [Soha 的新手教程](https://github.com/moesoha/bird-bgp-kickstart/blob/master/main.md#协议-protocol)）：

```bird2
protocol static {
    ipv6; # 启用 ipv6 channel，否则不会收集 IPv6 路由

    route 2001:db8:100a::/48 reject;
    # 定义一条路由 2001:db8:100a::/48 为 reject/unreachable
    route 2001:db8:100b::/48 via "eth0";
    # 定义一条路由 2001:db8:100b::/48 的下一跳为 eth0，也就是说会在eth0内发邻居请求报文NS（Neighbor Solicitation）寻找IP所在的机器
    route 2001:db8:100c::/48 via 2001:db8:eeee::1;
    # 定义一条路由 2001:db8:100c::/48 的下一跳为 2001:db8:eeee::1
}
```

一般来说，如果只是为了对外宣布一个段，通常会用 `reject` 作为下一跳（见第 15 行），这是因为数据包到达后，实际的转发由 Linux 的路由表负责，而你的 Linux 路由表通常会包含更细化的路由（例如 dummy0 上绑定的 `/128`）。如果找不到更具体的匹配，说明这个段暂时未使用，可直接返回 `unreachable`。除非有特殊需求，否则没必要给整个 `/48` 设置一个实际的下一跳。

## 过滤器

之所以在讲完基本配置之后就要讲过滤器，是因为不论你是持证专家（CCIE/JNCIE/HCIE 等）还是刚入门的 BGP Player，**管好自己发出的路由都是最基本的责任，也是对他人最起码的尊重**。由于过滤器配置疏忽而引发的路由泄漏、服务中断乃至全球事故比比皆是，去 Cloudflare Blog 随便搜就能找到一大堆案例。好消息是，对于新手来说，并不需要很复杂的过滤器：只要保证只发自己的路由、收对方的全部路由即可。

以下是最简单的示例：

```bird2 {3}
filter export_filter_v6 {
    if net ~ OWN_IPv6 then accept; # 如果前缀属于 OWN_IPv6，则放行
    reject; # 否则拒绝
};
filter import_filter_v6 {
    accept; # 照单全收
};
```

建议在编写过滤器时，始终**显式地定义 accept 的条件，并在末尾用 reject 兜底**，像第 3 行一样，切勿偷懒。

更多过滤器的用法可以参考 [Soha 的教程](https://github.com/moesoha/bird-bgp-kickstart/blob/master/main.md#3-过滤过滤) 或 [BIRD 中文文档](https://bird.xmsl.dev/docs/user-guide/5-1-introduction.html)。要记住： **对于路由过滤，无论再怎么小心都不为过。你少写的每一个字符，都可能造成几百万美元的损失和几个小时的全球停机。**

# 在 BIRD 中配置 BGP

完成了基本配置和过滤器之后，就可以开始配置 BGP 会话了。一般来说，你会从服务商那里拿到对方的 IP、ASN，有时还会包含密码（例如 Vultr 常见）。
根据对端 IP 是否和你在同一个网段，BGP 会话大致可以分为「多跳」和「同段」两种；其中 `fe80` 链路本地地址是同段中的一种特殊情况。

## 多跳会话

假设你从服务商获得的信息是：

> **ASN**：AS64512
>
> **IP**：`fd00::1`

此时你会发现，对方 IP 并不在你的本地子网里，但可以正常 `ping` 通，这种情况通常就需要配置 **多跳（multihop）** BGP。

示例配置：

```bird2 {1-3, 7-8, 10}
protocol bgp upstream {
    local fc00::2 as ASN;
    neighbor fd00::1 as 64512;
    multihop 2;
    # password OURPASSWORD; 密码，可选
    ipv6 {
        import filter import_filter_v6;
        export filter export_filter_v6;
    };
    graceful restart;
};
```

让我们来解读一下这段配置：

```bird2 startLineNumber=1
protocol bgp upstream {
```

定义了一个 BGP 协议实例，`upstream` 是该协议实例的名字，可自定义。

```bird2 startLineNumber=2
    local fc00::2 as ASN;
    neighbor fd00::1 as 64512;
```

指定了本地用于会话的 IP 和 ASN，以及对端（服务商）的 IP 和 ASN。其中 `ASN` 是[前面 `define` 过的常量](/beginner/bring-up-a-bgp-session/#常量定义)。

```bird2 startLineNumber=4
    multihop 2;
```

在网络里，**“跳”（hop）**指的是数据包从一台设备传到下一台网络设备（如路由器）的中转次数。如果你和对方 IP 在同一个网段，数据包可以直接送达，不需要中间路由器转发，这种情况就是“一跳可达”；如果不在同一个网段，就需要经过一个或多个路由器中转，这时就叫做“多跳会话”。

`multihop 2;` 表示这是一个多跳会话，2 就是 BGP 报文的 Hop Limit（最大跳数）。你可以用 mtr 等工具先测量到对端的实际跳数，然后设置一个相符或稍大的值即可，太大没有必要，也可能带来安全风险。

```bird2 startLineNumber=7
        import filter import_filter_v6;
        export filter export_filter_v6;
```

指定了该会话的 IPv6 通道使用的过滤器，均为前面定义好的过滤器。

```bird2 startLineNumber=10
    graceful restart;
```

启用 **Graceful Restart**，可以在重启 BIRD 或重新加载配置时最大程度减少会话中断时间。

同时，尽管多跳 BGP 便于商家管理，但 BGP 收到的路由可能会覆盖原本的路由，从而导致无法前往原本的 BGP 对端，造成断联，所以我们必须在 BIRD 里手动指定对端 BGP 地址的路由，具体方法如下：

1. 用 `ip -6 route get <对端IP>` 获取原本的路由，如下所示：

   ```shell "via fc00::1"
   root@debian:~# ip route get fd00::1
   fd00::1 from :: via fc00::1 dev ens3 src fc00::2 metric 1024 pref medium
   root@debian:~#
   ```

   其中我们看到 `via fc00::1` 就表示着原本的下一跳路由。

2. 在 BIRD 的 static 里面加入这条路有，如下所示：

   ```diff lang="bird2" /(fd00::1/128|fc00::1)/
   protocol static static_v6 {
       ipv6;
       route 2001:db8::/48 reject;
   +   route fd00::1/128 via fc00::1;
   };
   ```

   其中 `fd00::1/128` 是我们的对端地址，`fc00::1` 是我们在上一步获取的下一跳地址。

## 同段会话

假设你从服务商获得的信息是：

> **ASN**：AS64512
>
> **IP**：`fc00::1`

你会发现对方分配给你的 IP 和你的 IP 在同一个子网，则属于同段配置，示例如下：

```bird2 {4}
protocol bgp upstream {
    local fc00::2 as ASN;
    neighbor fc00::1 as 64512;
    direct;
    ipv6 {
        import filter import_filter_v6;
        export filter export_filter_v6;
    };
    graceful restart;
};
```

其中第四行的

```bird2 startLineNumber=4
    direct;
```

表示本地 IP 和对端 IP 一跳可达。

## 链路本地地址 ( link-local )

在某些场景（例如 DN42 社区网络），对方可能不会给你公网或内网地址，而是直接给一个 `fe80` 开头的地址。这类 **链路本地地址（Link-local address）** 只在同一个网段/广播域有效，无法跨路由传播。

也就是说，该地址只对与之直连的网卡有效，若需要使用 `fe80` 地址建立会话，就必须 **显式指定本地使用的网卡**。

假设上游分配的地址为 `fe80::1`，且你的设备网卡为 `eth0`，示例配置如下：

```bird2 {%eth0}
protocol bgp upstream {
    local fe80::2 as ASN; # 一般对方给你fe80地址时，你也需要用fe80地址
    neighbor fe80::1%eth0 as 64512;
    direct;
    ipv6 {
        import filter import_filter_v6;
        export filter export_filter_v6;
    };
    graceful restart;
};
```

其中 `fe80::1%eth0` 就是指定使用 `eth0` 网卡的链路本地地址格式。

## 启动并验证

将上述示例根据你的实际情况 **三选一** 填入 `bird.conf`，然后执行 `birdc c`，若未出现任何报错，说明配置无误。稍等片刻后，运行 `birdc s p`，若输出中 `State` 显示为 `Established`，则表明 BGP 会话已成功建立，示例如下：

```shell "Established"
root@debian:~# birdc s p
BIRD 2.17.1 ready.
Name       Proto      Table      State  Since         Info
device1    Device     ---        up     2025-06-27
kernel1    Kernel     master6    up     2025-06-27
static_v6  Static     master6    up     2025-06-27
upstream   BGP        ---        up     12:39:32.775  Established
root@debian:~#
```

若一切正常，你的前缀就已经对外宣布出去。大约 24 小时后，全球其他网络应能访问到你的前缀。恭喜你，完成了人生第一次广播！但独乐乐不如众乐乐，下一张，我们将教你如何与其他人对等连接（peer）。

# 附录：如何在 VPS 上使用自己的 IP 上网

广播 IP 段的最终目的是让你的机器实际使用这些地址。那么怎么用？最简单的做法，就是在本地创建一个虚拟网卡（dummy 网卡），并把你需要广播的 IP 前缀里的某个地址绑定到这个网卡上；然后，再在 BIRD 的过滤器中将所有的源地址都改为这个地址。

## 创建虚拟网卡

以 Debian 为例，你可以在 `/etc/network/interfaces` 中添加如下配置（这里以前面示例的前缀为例）：

```interfaces
iface dummy0 inet6 static
    address 2001:db8::1/128
    pre-up ip link add dummy0 type dummy
    post-down ip link del dummy0 type dummy
```

这里我们创建了一个名为 `dummy0` 的虚拟网卡，并为其分配了一个地址 `2001:db8::1/128`。注意这里使用的是 `/128` 而不是 `/64` 或 `/48`，因为我们只需要绑定这个段内的**一个**地址来宣布路由，机器本身并不需要在该网卡上与其他设备通信，也就不需要整个子网。

保存后，执行 `ifup dummy0` ：

```shell
root@debian:~# ifup dummy0
Waiting for DAD... Done
root@debian:~#
```

如果如上所示，`dummy0` 启动时没有任何错误，那么虚拟网卡已经成功创建。

## 改变收到路由的源地址

在你的 BIRD 配置文件中找到 `protocol kernel` ，将它改为如下内容：

```bird2 startLineNumber=7 {4}
protocol kernel {
    ipv6 {
        export filter {
            krt_prefsrc = 2001:db8::1; # 指定使用的源地址，如dummy0接口绑定的地址
            accept;
        };
    };
};
```

其中 `krt_prefsrc` 就是当包是从你的机器开始发出（比如你机器上进行的 `curl`）时，你使用的源地址，这里我们设置为 `2001:db8::1`。

:::caution

**请务必确保这个地址已在某个接口（如 dummy0）上绑定**，否则你会在日志里收获大量的 `RTNETLINK answers: Invalid argument` 报错。

:::

# 全部配置

以多跳为例：

```bird2
log syslog all;
router id 10.0.0.1; # 定义 Router ID
define ASN = 114514; # 定义本地使用的 ASN
define OWN_IPv6 = [2001:db8::/48]; # 定义将要对外宣布的 IPv6 段
protocol device {
};
protocol kernel {
    ipv6 {
        export filter {
            krt_prefsrc = 2001:db8::1; # 指定使用的源地址，如dummy0接口绑定的地址
            accept;
        };
    };
};
protocol static static_v6 {
    ipv6;
    route 2001:db8::/48 reject; #在 static 中添加你需要广播的路由
};
filter export_filter_v6 {
    if net ~ OWN_IPv6 then accept; # 如果前缀属于 OWN_IPv6，则放行
    reject; # 否则拒绝
};
filter import_filter_v6 {
    accept; # 照单全收
};
protocol bgp upstream {
    local fc00::2 as ASN;
    neighbor fd00::1 as 64512;
    multihop 2;
    # password OURPASSWORD; 密码，可选
    ipv6 {
        import filter import_filter_v6;
        export filter export_filter_v6;
    };
    graceful restart;
};

```
