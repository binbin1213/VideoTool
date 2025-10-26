import type { RegexRule } from '../../../shared/types/subtitle.types';

/**
 * 正则替换处理器
 * 用于对字幕文本进行正则表达式替换处理
 */
export class RegexProcessor {
  private rules: RegexRule[];

  constructor(rules: RegexRule[]) {
    this.rules = rules;
  }

  /**
   * 应用所有启用的规则
   * @param text 要处理的文本
   * @returns 处理后的文本
   */
  applyRules(text: string): string {
    let result = text;
    
    // 获取所有启用的规则并按顺序排序
    const enabledRules = this.rules
      .filter((r) => r.enabled)
      .sort((a, b) => a.order - b.order);

    // 依次应用每个规则
    for (const rule of enabledRules) {
      try {
        const regex = new RegExp(rule.pattern, 'gm');
        result = result.replace(regex, rule.replacement);
      } catch (error) {
        console.error(`Error applying rule ${rule.name}:`, error);
      }
    }

    return result;
  }

  /**
   * 测试单个规则
   * @param text 要处理的文本
   * @param rule 要测试的规则
   * @returns 处理后的文本
   */
  testRule(text: string, rule: RegexRule): string {
    try {
      const regex = new RegExp(rule.pattern, 'gm');
      return text.replace(regex, rule.replacement);
    } catch (error) {
      console.error(`Error testing rule ${rule.name}:`, error);
      return text;
    }
  }

  /**
   * 添加规则
   */
  addRule(rule: RegexRule): void {
    this.rules.push(rule);
  }

  /**
   * 移除规则
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }

  /**
   * 更新规则
   */
  updateRule(ruleId: string, updates: Partial<RegexRule>): void {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
    }
  }

  /**
   * 启用/禁用规则
   */
  enableRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * 重新排序规则
   */
  reorderRules(ruleIds: string[]): void {
    const reordered: RegexRule[] = [];
    ruleIds.forEach((id, index) => {
      const rule = this.rules.find((r) => r.id === id);
      if (rule) {
        reordered.push({ ...rule, order: index + 1 });
      }
    });
    this.rules = reordered;
  }

  /**
   * 导出规则为JSON
   */
  exportRules(): string {
    return JSON.stringify({ version: '1.0', rules: this.rules }, null, 2);
  }

  /**
   * 从JSON导入规则
   */
  importRules(json: string): void {
    try {
      const data = JSON.parse(json);
      if (data.rules && Array.isArray(data.rules)) {
        this.rules = data.rules;
      }
    } catch (error) {
      console.error('Error importing rules:', error);
    }
  }

  /**
   * 获取所有规则
   */
  getRules(): RegexRule[] {
    return [...this.rules];
  }
}

