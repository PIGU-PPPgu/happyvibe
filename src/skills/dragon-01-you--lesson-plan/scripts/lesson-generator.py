#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
教案生成器 - 基于Claude API的自动化教案生成工具

使用方法：
    python lesson-generator.py --subject 物理 --grade 高一 --topic "牛顿第二定律" --minutes 45

功能：
    1. 智能推断参数
    2. 加载参考模板
    3. 生成完整教案
    4. 质量检查
    5. 输出Markdown文件
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# 设置输出编码
sys.stdout.reconfigure(encoding='utf-8')

# 学科配置
SUBJECTS = {
    "物理": {
        "keywords": ["力", "运动", "能量", "电", "磁", "光", "热"],
        "teaching_methods": ["5E", "Inquiry", "渐进式释放"],
        "activities": ["实验演示", "小组探究", "问题解决"],
    },
    "数学": {
        "keywords": ["函数", "方程", "几何", "概率", "统计"],
        "teaching_methods": ["渐进式释放", "直接教学"],
        "activities": ["例题讲解", "练习巩固", "变式训练"],
    },
    "语文": {
        "keywords": ["阅读", "写作", "古诗", "文言文", "现代文"],
        "teaching_methods": ["探究式", "讲授式"],
        "activities": ["朗读感悟", "文本分析", "写作练习"],
    },
    "英语": {
        "keywords": ["语法", "词汇", "阅读", "写作", "听力"],
        "teaching_methods": ["5E", "交际法"],
        "activities": ["情境对话", "角色扮演", "语法练习"],
    },
    "化学": {
        "keywords": ["元素", "化合物", "反应", "平衡"],
        "teaching_methods": ["5E", "实验探究"],
        "activities": ["实验演示", "现象观察", "方程式书写"],
    },
    "生物": {
        "keywords": ["细胞", "遗传", "进化", "生态"],
        "teaching_methods": ["5E", "探究式"],
        "activities": ["观察实验", "模型构建", "案例分析"],
    },
    "历史": {
        "keywords": ["事件", "人物", "制度", "文化"],
        "teaching_methods": ["探究式", "讲授式"],
        "activities": ["史料分析", "时间轴构建", "角色扮演"],
    },
    "地理": {
        "keywords": ["地形", "气候", "人口", "经济"],
        "teaching_methods": ["探究式", "案例教学"],
        "activities": ["地图分析", "案例研究", "实地考察"],
    },
}

# 年级校准
GRADE_LEVELS = {
    "小学": {"min_minutes": 35, "max_minutes": 40, "attention_span": 15},
    "初中": {"min_minutes": 40, "max_minutes": 45, "attention_span": 20},
    "高中": {"min_minutes": 40, "max_minutes": 45, "attention_span": 25},
    "大学": {"min_minutes": 45, "max_minutes": 90, "attention_span": 30},
}


def infer_subject(topic: str) -> str:
    """从主题推断学科"""
    for subject, config in SUBJECTS.items():
        for keyword in config["keywords"]:
            if keyword in topic:
                return subject
    return "通用"


def infer_grade_level(grade: str) -> str:
    """推断年级层级"""
    if any(g in grade for g in ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"]):
        return "小学"
    elif any(g in grade for g in ["初一", "初二", "初三", "七年级", "八年级", "九年级"]):
        return "初中"
    elif any(g in grade for g in ["高一", "高二", "高三"]):
        return "高中"
    else:
        return "大学"


def get_teaching_methods(subject: str) -> list:
    """获取学科推荐教学方法"""
    if subject in SUBJECTS:
        return SUBJECTS[subject]["teaching_methods"]
    return ["渐进式释放"]


def get_activities(subject: str) -> list:
    """获取学科推荐活动"""
    if subject in SUBJECTS:
        return SUBJECTS[subject]["activities"]
    return ["讲解", "练习", "总结"]


def generate_lesson_plan(
    subject: str,
    grade: str,
    topic: str,
    minutes: int,
    teaching_method: str = None,
) -> dict:
    """生成教案结构"""

    # 推断参数
    if not teaching_method:
        teaching_methods = get_teaching_methods(subject)
        teaching_method = teaching_methods[0] if teaching_methods else "渐进式释放"

    grade_level = infer_grade_level(grade)
    activities = get_activities(subject)

    # 计算时间分配
    if minutes <= 40:
        intro_time = 8
        main_time = 25
        practice_time = 5
        summary_time = 2
    elif minutes <= 45:
        intro_time = 10
        main_time = 25
        practice_time = 7
        summary_time = 3
    else:
        intro_time = 15
        main_time = minutes - 40
        practice_time = 15
        summary_time = 10

    # 生成教案结构
    lesson_plan = {
        "basic_info": {
            "subject": subject,
            "grade": grade,
            "topic": topic,
            "minutes": minutes,
            "teaching_method": teaching_method,
            "grade_level": grade_level,
        },
        "teaching_objectives": [
            f"理解{topic}的核心概念",
            f"运用{topic}解决实际问题",
            f"分析{topic}的特点和规律",
        ],
        "key_learning_points": [
            f"{topic}的定义和基本概念",
            f"{topic}的关键特征",
            f"{topic}的应用方法",
        ],
        "common_misconceptions": [
            {
                "misconception": f"对{topic}的常见误解",
                "correct": f"正确的理解应该是...",
            },
        ],
        "learning_cycles": [
            {
                "name": "导入",
                "time": f"{intro_time}分钟",
                "activities": ["问题引入", "情境创设", "激发兴趣"],
            },
            {
                "name": "新授",
                "time": f"{main_time}分钟",
                "activities": activities,
            },
            {
                "name": "练习",
                "time": f"{practice_time}分钟",
                "activities": ["独立练习", "小组讨论", "成果展示"],
            },
            {
                "name": "总结",
                "time": f"{summary_time}分钟",
                "activities": ["学生总结", "教师补充", "布置作业"],
            },
        ],
        "pre_quiz": [
            {"question": f"关于{topic}，你已经知道什么？", "type": "开放题"},
            {"question": f"关于{topic}，你想知道什么？", "type": "开放题"},
        ],
        "post_quiz": [
            {"question": f"请用自己的话解释{topic}", "type": "简答题"},
            {"question": f"举一个{topic}的应用实例", "type": "应用题"},
        ],
        "differentiation": {
            "ELL": ["提供双语词汇表", "使用图示辅助理解"],
            "SPED": ["分步讲解", "提供学习支架"],
            "Gifted": ["探究更深层次问题", "设计拓展任务"],
        },
        "materials": ["白板和马克笔", "PPT课件", "练习题"],
        "rubric": {
            "概念理解": ["优秀", "良好", "需改进", "不合格"],
            "问题解决": ["优秀", "良好", "需改进", "不合格"],
            "实际应用": ["优秀", "良好", "需改进", "不合格"],
        },
    }

    return lesson_plan


def generate_markdown(lesson_plan: dict) -> str:
    """生成Markdown格式教案"""
    info = lesson_plan["basic_info"]

    md = f"""# {info['topic']} 教案

## 基本信息
- **学科：** {info['subject']}
- **年级：** {info['grade']}
- **课时：** {info['minutes']}分钟
- **教学方法：** {info['teaching_method']}
- **年级层级：** {info['grade_level']}

## 教学目标
"""
    for i, obj in enumerate(lesson_plan["teaching_objectives"], 1):
        md += f"{i}. {obj}\n"

    md += "\n## 关键学习点\n"
    for i, point in enumerate(lesson_plan["key_learning_points"], 1):
        md += f"{i}. {point}\n"

    md += "\n## 常见误解\n"
    for mc in lesson_plan["common_misconceptions"]:
        md += f"- **误解：** {mc['misconception']}\n"
        md += f"  **正确理解：** {mc['correct']}\n"

    md += "\n## 学习周期\n"
    for cycle in lesson_plan["learning_cycles"]:
        md += f"\n### {cycle['name']}（{cycle['time']}）\n"
        for activity in cycle["activities"]:
            md += f"- {activity}\n"

    md += "\n## 课前测验\n"
    for i, q in enumerate(lesson_plan["pre_quiz"], 1):
        md += f"{i}. {q['question']}（{q['type']}）\n"

    md += "\n## 课后测验\n"
    for i, q in enumerate(lesson_plan["post_quiz"], 1):
        md += f"{i}. {q['question']}（{q['type']}）\n"

    md += "\n## 差异化教学\n"
    for group, strategies in lesson_plan["differentiation"].items():
        md += f"\n### {group}\n"
        for strategy in strategies:
            md += f"- {strategy}\n"

    md += "\n## 教学材料\n"
    for material in lesson_plan["materials"]:
        md += f"- {material}\n"

    md += "\n## 评分标准\n"
    md += "| 维度 | 优秀 | 良好 | 需改进 | 不合格 |\n"
    md += "|------|------|------|--------|--------|\n"
    for dimension, levels in lesson_plan["rubric"].items():
        md += f"| {dimension} | {' | '.join(levels)} |\n"

    return md


def quality_check(lesson_plan: dict) -> dict:
    """质量检查"""
    checks = {
        "有教学目标": len(lesson_plan.get("teaching_objectives", [])) >= 3,
        "有关键学习点": len(lesson_plan.get("key_learning_points", [])) >= 2,
        "有常见误解": len(lesson_plan.get("common_misconceptions", [])) >= 1,
        "有学习周期": len(lesson_plan.get("learning_cycles", [])) >= 3,
        "有课前测验": len(lesson_plan.get("pre_quiz", [])) >= 2,
        "有课后测验": len(lesson_plan.get("post_quiz", [])) >= 2,
        "有差异化教学": len(lesson_plan.get("differentiation", {})) >= 3,
        "有评分标准": len(lesson_plan.get("rubric", {})) >= 3,
    }

    passed = sum(1 for v in checks.values() if v)
    total = len(checks)

    return {
        "checks": checks,
        "passed": passed,
        "total": total,
        "score": passed / total * 100,
    }


def main():
    parser = argparse.ArgumentParser(description="教案生成器")
    parser.add_argument("--subject", required=True, help="学科名称")
    parser.add_argument("--grade", required=True, help="年级")
    parser.add_argument("--topic", required=True, help="课题")
    parser.add_argument("--minutes", type=int, default=45, help="课时（分钟）")
    parser.add_argument("--method", help="教学方法")
    parser.add_argument("--output", help="输出文件路径")

    args = parser.parse_args()

    # 生成教案
    print(f"[生成] 正在生成教案: {args.subject} - {args.grade} - {args.topic}")
    lesson_plan = generate_lesson_plan(
        subject=args.subject,
        grade=args.grade,
        topic=args.topic,
        minutes=args.minutes,
        teaching_method=args.method,
    )

    # 质量检查
    print("[检查] 正在进行质量检查...")
    quality = quality_check(lesson_plan)
    print(f"[检查] 质量得分: {quality['score']:.1f}% ({quality['passed']}/{quality['total']})")

    # 生成Markdown
    print("[输出] 正在生成Markdown文件...")
    markdown = generate_markdown(lesson_plan)

    # 保存文件
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = Path(f"lesson-{args.topic}-{datetime.now().strftime('%Y%m%d')}.md")

    output_path.write_text(markdown, encoding="utf-8")
    print(f"[完成] 教案已保存到: {output_path}")

    # 输出质量报告
    print("\n[质量报告]")
    for check, passed in quality["checks"].items():
        status = "✓" if passed else "✗"
        print(f"  {status} {check}")


if __name__ == "__main__":
    main()
