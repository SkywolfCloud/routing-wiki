// remark-rfc-link.ts
import type { Root, Link, Text } from "mdast";
import type { Plugin, Transformer } from "unified";
import {
  findAndReplace,
  type ReplaceFunction,
} from "mdast-util-find-and-replace";

/**
 * 插件选项接口
 */
export interface RemarkRfcLinkOptions {
  /**
   * RFC 链接的基础 URL
   * @default 'https://www.rfc-editor.org/rfc/'
   */
  baseUrl?: string;

  /**
   * URL 格式模板，使用 {number} 作为 RFC 编号占位符
   * @default 'rfc{number}.html'
   */
  urlFormat?: string;

  /**
   * 是否支持连字符格式（如 RFC-1234）
   * @default false
   */
  supportHyphen?: boolean;
}

/**
 * RFC 链接预设配置
 */
export interface RfcLinkPreset {
  baseUrl: string;
  urlFormat: string;
}

/**
 * 预设配置集合
 */
export interface RfcLinkPresets {
  /** IETF Datatracker 格式 */
  ietf: RfcLinkPreset;
  /** RFC Editor 格式（默认） */
  rfcEditor: RfcLinkPreset;
  /** 简化的 URL 格式 */
  simple: RfcLinkPreset;
}

/**
 * Remark 插件：自动将 RFC 引用转换为链接
 *
 * @param options - 插件配置选项
 * @returns Unified transformer
 *
 * @example
 * ```ts
 * import remarkRfcLink from './remark-rfc-link';
 *
 * // 使用默认配置
 * .use(remarkRfcLink)
 *
 * // 使用自定义配置
 * .use(remarkRfcLink, {
 *   baseUrl: 'https://datatracker.ietf.org/doc/html/',
 *   urlFormat: 'rfc{number}',
 *   supportHyphen: true
 * })
 * ```
 */
const remarkRfcLink: Plugin<[RemarkRfcLinkOptions?], Root> = (options = {}) => {
  const {
    baseUrl = "https://www.rfc-editor.org/rfc/",
    urlFormat = "rfc{number}.html",
    supportHyphen = false,
  } = options;

  const transformer: Transformer<Root> = (tree) => {
    // 根据选项选择正则表达式
    const pattern = supportHyphen
      ? /\b(RFC|rfc)[\s-]*(\d+)\b/g // 支持 RFC-1234 格式
      : /\b(RFC|rfc)\s*(\d+)\b/g; // 只支持空格或无空格

    const replacer: ReplaceFunction = (
      match: string,
      prefix: string,
      number: string
    ): Link | false => {
      // 验证 RFC 编号
      if (!number || number.length === 0) {
        return false;
      }

      // 构建 URL
      const url = baseUrl + urlFormat.replace("{number}", number);

      // 创建文本节点
      const textNode: Text = {
        type: "text",
        value: match,
      };

      // 返回链接节点
      const linkNode: Link = {
        type: "link",
        url: url,
        title: `RFC ${number}`,
        children: [textNode],
      };

      return linkNode;
    };

    findAndReplace(tree, [[pattern, replacer]]);
  };

  return transformer;
};

// 导出一些预设配置
export const presets: RfcLinkPresets = {
  // IETF Datatracker 格式
  ietf: {
    baseUrl: "https://datatracker.ietf.org/doc/html/",
    urlFormat: "rfc{number}",
  },
  // RFC Editor 格式（默认）
  rfcEditor: {
    baseUrl: "https://www.rfc-editor.org/rfc/",
    urlFormat: "rfc{number}.html",
  },
  // 简化的 URL 格式
  simple: {
    baseUrl: "https://www.rfc-editor.org/rfc/",
    urlFormat: "rfc{number}",
  },
};

/**
 * 便捷函数：使用 IETF 格式
 */
export const remarkRfcLinkIetf: Plugin<[RemarkRfcLinkOptions?], Root> = (
  options = {}
) => {
  return remarkRfcLink({ ...presets.ietf, ...options });
};

/**
 * 便捷函数：支持连字符格式
 */
export const remarkRfcLinkWithHyphen: Plugin<[RemarkRfcLinkOptions?], Root> = (
  options = {}
) => {
  return remarkRfcLink({ ...options, supportHyphen: true });
};

// 默认导出
export default remarkRfcLink;
