/**
 * 内置模板共享脚手架：六段式结构（角色 → 输出格式协议 → 证据与置信度规则 →
 * 编号维度章 → 分格式规格 → 收尾自检）。
 *
 * 设计基准：自定义模板「电商海报类反推」（固化见 builtin-ecommerce.ts）。
 * 约束：所有段落只能使用 renderPrompt 白名单变量 {{outputFormat}} / {{sourceType}} / {{pageTitle}}。
 */

export interface JsonFieldSpec {
  name: string;
  doc: string;
  /** 条件字段：画面无对应内容时的降级说明 */
  conditional?: string;
}

/** 输出格式协议：zh / en / json 三分支 + 集中负面清单（所有模板统一口径） */
export function outputProtocol(): string[] {
  return [
    "当前目标输出格式为 {{outputFormat}}。",
    "只输出目标格式对应的一份最终结果，不要同时输出多个版本。",
    "如果格式为 zh，只输出一段完整、自然、可直接复用的中文高密度结果。",
    "如果格式为 en，只输出一段完整、自然、可直接复用的英文高密度结果。",
    "如果格式为 json，只输出合法 JSON 对象。",
    "不要输出解释、分析过程、Markdown、代码块、标题、注释、前言或总结。"
  ];
}

/** 仅 JSON 输出模板使用的协议变体 */
export function jsonOnlyProtocol(): string[] {
  return [
    "当前目标输出格式为 {{outputFormat}}（本模板固定输出合法 JSON 对象）。",
    "只返回一个合法 JSON 对象，禁止输出 JSON 之外的任何内容，不要 Markdown、解释、注释或代码块。",
    "JSON 字符串值中不要使用真实换行符。",
    "不要输出解释、分析过程、标题、注释、前言或总结。"
  ];
}

/** 证据与置信度规则：抑制虚构的统一段落 */
export function confidenceRules(): string[] {
  return [
    "所有判断必须优先依据图片中实际可见的信息。",
    "无法确定的品牌、型号、人物身份、IP、字体名称、摄影器材或材质时，不要强行猜测具体名称，应使用高置信度的视觉特征进行描述。",
    "如果品牌、Logo、文字内容能够被高置信度识别，可以明确描述；无法稳定识别时，只描述其视觉形态、位置、风格和功能。"
  ];
}

/**
 * 字数下限 + 反凑数安全阀（成对出现，缺一不可）：
 * 下限保证密度，安全阀抑制小图幻觉与机械扩写。
 */
export function lengthFloor(zhMin: number, enMin: number): string[] {
  return [
    `中文结果必须是一整段自然流畅、可直接复用的高密度结果，不要写成关键词列表。原则上不少于 ${zhMin} 个中文字符；如果图片信息较少，不需要为了满足字数刻意扩写或重复描述，应优先保证信息准确、有效。`,
    `英文结果必须是一整段自然流畅、可直接复用的高密度结果，不要写成关键词列表。原则上不少于 ${enMin} 个英文字符；如果图片本身信息量有限，不需要机械补足长度，应优先保证描述准确、紧凑、可执行。`
  ];
}

/** 信息组织顺序链（箭头句） */
export function organizationOrder(chain: string): string {
  return `描述时优先按照以下逻辑组织信息：\n${chain}`;
}

/** JSON 字段骨架 + 逐字段说明（字段名与正文维度章节一一对应） */
export function jsonSkeleton(fields: JsonFieldSpec[]): string[] {
  const skeleton = fields
    .map((field) => `  "${field.name}": []`)
    .join(",\n");
  const docs = fields
    .map((field) => `${field.name}：${field.doc}${field.conditional ? ` ${field.conditional}` : ""}`)
    .join("\n");
  return [
    "如果 {{outputFormat}} 为 json，JSON 必须包含以下字段，每个字段的值必须为具体、信息密度较高的字符串数组：",
    `{\n${skeleton}\n}`,
    "字段说明：",
    docs
  ];
}

/** 编号维度章标题行 */
export function chapter(index: number, title: string, body: string[]): string {
  return `${index}. ${title}\n\n${body.join("\n\n")}`;
}

/** 常见反推缺陷与回避（质量控制段，置于维度章之后、分格式规格之前） */
export function commonPitfalls(items: string[]): string[] {
  return [
    "常见反推缺陷与回避：",
    ...items.map((item) => `- ${item}`),
    "输出前自查：以上缺陷任意一条命中即重写对应部分。"
  ];
}

/** 收尾自检（所有模板统一口径） */
export function closingCheck(): string[] {
  return [
    "最终输出必须足够具体，使接收方可以据此重建原图的核心视觉方案。",
    "不要停留在“画面里有什么”，而要尽可能反推“这个画面是如何被拍摄、布置、布光、设计和排版出来的”。",
    "最终只返回可直接复用的结果。"
  ];
}
