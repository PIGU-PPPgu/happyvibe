#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
教案质量检查器

使用方法：
    python quality-checker.py lesson-plan.md

功能：
    1. 检查教案完整性
    2. 检查Bloom动词使用
    3. 检查时间分配
    4. 检查差异化教学
    5. 输出质量报告
"""

import argparse
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Bloom动词库
BLOOM_VERBS = {
    "记忆": ["列出", "描述", "识别", "命名", "回忆", "陈述", "定义"],
    "理解": ["解释", "概括", "改述", "预测", "比较", "区分", "举例"],
    "应用": ["运用", "解决", "示范", "计算", "操作", "使用", "执行"],
    "分析": ["分析", "比较", "对比", "分类", "区分", "检查", "组织"],
    "评价": ["评估", "评判", "批评", "论证", "验证", "测试", "推荐"],
    "创造": ["设计", "构建", "创造", "开发", "制定", "规划", "创作"],
}


def check_completeness(content: str) -> dict:
    """检查教案完整性"""
    checks = {
        "有教学目标": bool(re.search(r"教学目标|学习目标", content)),
        "有基本信息": bool(re.search(r"学科.*年级|年级.*课时", content)),
        "有关键学习点": bool(re.search(r"关键学习点|重点|难点", content)),
        "有常见误解": bool(re.search(r"常见误解|误区", content)),
        "有学习周期": bool(re.search(r"学习周期|教学过程|教学环节", content)),
        "有课前测验": bool(re.search(r"课前测验|诊断性评估|导入", content)),
        "有课后测验": bool(re.search(r"课后测验|总结性评估|作业", content)),
        "有差异化教学": bool(re.search(r"差异化|分层|ELL|SPED|Gifted", content)),
        "有评分标准": bool(re.search(r"评分标准|Rubric|评估标准", content)),
        "有教学材料": bool(re.search(r"教学材料|教具|准备", content)),
    }

    passed = sum(1 for v in checks.values() if v)
    return {"checks": checks, "passed": passed, "total": len(checks)}


def check_bloom_verbs(content: str) -> dict:
    """检查Bloom动词使用"""
    found_verbs = {}
    for level, verbs in BLOOM_VERBS.items():
        for verb in verbs:
            if verb in content:
                if level not in found_verbs:
                    found_verbs[level] = []
                found_verbs[level].append(verb)

    return {
        "levels_found": len(found_verbs),
        "total_levels": len(BLOOM_VERBS),
        "verbs": found_verbs,
        "score": len(found_verbs) / len(BLOOM_VERBS) * 100,
    }


def check_time_allocation(content: str) -> dict:
    """检查时间分配"""
    # 提取时间信息
    time_pattern = r"(\d+)\s*分钟"
    times = re.findall(time_pattern, content)

    if not times:
        return {"has_time": False, "total_minutes": 0, "allocation": {}}

    total = sum(int(t) for t in times)
    allocation = {}
    for t in times:
        t_int = int(t)
        if t_int not in allocation:
            allocation[t_int] = 0
        allocation[t_int] += 1

    return {
        "has_time": True,
        "total_minutes": total,
        "allocation": allocation,
        "is_reasonable": 30 <= total <= 90,
    }


def check_differentiation(content: str) -> dict:
    """检查差异化教学"""
    checks = {
        "有ELL策略": bool(re.search(r"ELL|英语学习者|双语", content)),
        "有SPED策略": bool(re.search(r"SPED|特殊需求|学习障碍", content)),
        "有Gifted策略": bool(re.search(r"Gifted|资优|扩展|拓展", content)),
        "有具体策略": bool(re.search(r"策略|方法|措施", content)),
    }

    passed = sum(1 for v in checks.values() if v)
    return {"checks": checks, "passed": passed, "total": len(checks)}


def check_pedagogy(content: str) -> dict:
    """检查教学法"""
    checks = {
        "有讲解环节": bool(re.search(r"讲解|I Do|示范", content)),
        "有练习环节": bool(re.search(r"练习|We Do|You Do|实践", content)),
        "有互动环节": bool(re.search(r"互动|讨论|小组|合作", content)),
        "有评估环节": bool(re.search(r"评估|测验|检查|反馈", content)),
        "有总结环节": bool(re.search(r"总结|回顾|归纳", content)),
    }

    passed = sum(1 for v in checks.values() if v)
    return {"checks": checks, "passed": passed, "total": len(checks)}


def generate_report(
    completeness: dict,
    bloom: dict,
    time_check: dict,
    differentiation: dict,
    pedagogy: dict,
) -> str:
    """生成质量报告"""
    report = "=" * 50 + "\n"
    report += "教案质量检查报告\n"
    report += "=" * 50 + "\n\n"

    # 完整性
    report += f"【完整性】{completeness['passed']}/{completeness['total']}\n"
    for check, passed in completeness["checks"].items():
        status = "✓" if passed else "✗"
        report += f"  {status} {check}\n"
    report += "\n"

    # Bloom动词
    report += f"【Bloom动词】{bloom['levels_found']}/{bloom['total_levels']} 层级\n"
    for level, verbs in bloom["verbs"].items():
        report += f"  {level}: {', '.join(verbs)}\n"
    report += "\n"

    # 时间分配
    report += "【时间分配】\n"
    if time_check["has_time"]:
        report += f"  总时长: {time_check['total_minutes']} 分钟\n"
        report += f"  合理性: {'合理' if time_check['is_reasonable'] else '可能不合理'}\n"
    else:
        report += "  未找到时间信息\n"
    report += "\n"

    # 差异化教学
    report += f"【差异化教学】{differentiation['passed']}/{differentiation['total']}\n"
    for check, passed in differentiation["checks"].items():
        status = "✓" if passed else "✗"
        report += f"  {status} {check}\n"
    report += "\n"

    # 教学法
    report += f"【教学法】{pedagogy['passed']}/{pedagogy['total']}\n"
    for check, passed in pedagogy["checks"].items():
        status = "✓" if passed else "✗"
        report += f"  {status} {check}\n"
    report += "\n"

    # 总分
    total_checks = (
        completeness["total"]
        + bloom["total_levels"]
        + differentiation["total"]
        + pedagogy["total"]
    )
    total_passed = (
        completeness["passed"]
        + bloom["levels_found"]
        + differentiation["passed"]
        + pedagogy["passed"]
    )
    score = total_passed / total_checks * 100

    report += "=" * 50 + "\n"
    report += f"总分: {score:.1f}% ({total_passed}/{total_checks})\n"

    if score >= 90:
        report += "评级: 优秀\n"
    elif score >= 80:
        report += "评级: 良好\n"
    elif score >= 70:
        report += "评级: 需改进\n"
    else:
        report += "评级: 不合格\n"

    report += "=" * 50 + "\n"

    return report


def main():
    parser = argparse.ArgumentParser(description="教案质量检查器")
    parser.add_argument("file", help="教案文件路径")

    args = parser.parse_args()

    # 读取文件
    file_path = Path(args.file)
    if not file_path.exists():
        print(f"[错误] 文件不存在: {file_path}")
        sys.exit(1)

    content = file_path.read_text(encoding="utf-8")
    print(f"[读取] 正在检查: {file_path.name}\n")

    # 执行检查
    completeness = check_completeness(content)
    bloom = check_bloom_verbs(content)
    time_check = check_time_allocation(content)
    differentiation = check_differentiation(content)
    pedagogy = check_pedagogy(content)

    # 生成报告
    report = generate_report(
        completeness, bloom, time_check, differentiation, pedagogy
    )
    print(report)


if __name__ == "__main__":
    main()
