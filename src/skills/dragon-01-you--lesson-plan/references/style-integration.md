# 风格分析集成到主流程

## 集成流程

```
Step 2: 风格学习
    ├── 检查是否提供了style_file
    │   ├── 有 → 加载并解析风格配置
    │   └── 无 → 询问是否提供旧教案
    │       ├── 是 → 分析旧教案，提取风格
    │       └── 否 → 使用默认风格
    ↓
    风格分析
    ├── 语言风格提取
    ├── 教学偏好提取
    ├── 结构偏好提取
    └── 评估偏好提取
    ↓
    生成风格配置
    └── 存储到 ~/.eduagent/soul.md
    ↓
    注入到教案生成
    ├── 语言注入
    ├── 结构注入
    └── 互动注入
```

---

## 风格分析伪代码

### Step 1: 收集旧教案

```python
def collect_old_lessons(teacher_input):
    """
    收集教师的旧教案
    """
    lessons = []
    
    if teacher_input.has_file:
        # 从文件读取
        lessons.append(read_file(teacher_input.file_path))
    elif teacher_input.has_text:
        # 从文本读取
        lessons.append(teacher_input.text)
    elif teacher_input.has_url:
        # 从URL读取
        lessons.append(fetch_url(teacher_input.url))
    
    return lessons
```

### Step 2: 提取语言风格

```python
def extract_language_style(lessons):
    """
    从旧教案中提取语言风格
    """
    style = {
        'formality': 'formal',  # formal/informal/mixed
        'sentence_length': 'medium',  # short/medium/long
        'vocabulary': [],  # 高频词汇
        'rhetoric': []  # 修辞手法
    }
    
    for lesson in lessons:
        # 统计词频
        words = jieba.cut(lesson)
        word_freq = Counter(words)
        
        # 统计句长
        sentences = re.split(r'[。！？]', lesson)
        avg_length = sum(len(s) for s in sentences) / len(sentences)
        
        # 判断正式程度
        formal_words = ['同学们', '学生', '请', '应该']
        informal_words = ['咱们', '大家', '看', '想']
        
        formal_count = sum(word_freq[w] for w in formal_words)
        informal_count = sum(word_freq[w] for w in informal_words)
        
        if formal_count > informal_count:
            style['formality'] = 'formal'
        elif informal_count > formal_count:
            style['formality'] = 'informal'
        else:
            style['formality'] = 'mixed'
        
        # 判断句长
        if avg_length < 15:
            style['sentence_length'] = 'short'
        elif avg_length < 25:
            style['sentence_length'] = 'medium'
        else:
            style['sentence_length'] = 'long'
        
        # 提取高频词汇
        style['vocabulary'] = word_freq.most_common(20)
    
    return style
```

### Step 3: 提取教学偏好

```python
def extract_teaching_preference(lessons):
    """
    从旧教案中提取教学偏好
    """
    preference = {
        'method': 'gradual_release',  # 教学方法
        'warm_up': 'review',  # 导入方式
        'interaction': 'medium',  # 互动频率
        'feedback': 'positive'  # 反馈方式
    }
    
    for lesson in lessons:
        # 检测教学方法
        if '探究' in lesson or '实验' in lesson:
            preference['method'] = 'inquiry'
        elif '5E' in lesson:
            preference['method'] = '5e'
        elif '渐进' in lesson or '示范' in lesson:
            preference['method'] = 'gradual_release'
        
        # 检测导入方式
        if '复习' in lesson or '回顾' in lesson:
            preference['warm_up'] = 'review'
        elif '故事' in lesson or '案例' in lesson:
            preference['warm_up'] = 'story'
        elif '问题' in lesson or '提问' in lesson:
            preference['warm_up'] = 'question'
        elif '视频' in lesson or '图片' in lesson:
            preference['warm_up'] = 'media'
        
        # 检测互动频率
        questions = re.findall(r'[？?]', lesson)
        if len(questions) > 10:
            preference['interaction'] = 'high'
        elif len(questions) > 5:
            preference['interaction'] = 'medium'
        else:
            preference['interaction'] = 'low'
        
        # 检测反馈方式
        positive_words = ['很好', '正确', '优秀', '表扬']
        neutral_words = ['注意', '纠正', '改进']
        
        positive_count = sum(lesson.count(w) for w in positive_words)
        neutral_count = sum(lesson.count(w) for w in neutral_words)
        
        if positive_count > neutral_count:
            preference['feedback'] = 'positive'
        else:
            preference['feedback'] = 'neutral'
    
    return preference
```

### Step 4: 提取结构偏好

```python
def extract_structure_preference(lessons):
    """
    从旧教案中提取结构偏好
    """
    preference = {
        'sections': [],  # 主要环节
        'time_distribution': {},  # 时间分配
        'transition': 'direct'  # 过渡方式
    }
    
    for lesson in lessons:
        # 检测主要环节
        section_patterns = ['导入', '新授', '练习', '总结', '作业']
        sections = []
        
        for pattern in section_patterns:
            if pattern in lesson:
                sections.append(pattern)
        
        preference['sections'] = sections
        
        # 检测时间分配
        time_pattern = r'(\d+)分钟'
        times = re.findall(time_pattern, lesson)
        
        if len(times) >= 3:
            preference['time_distribution'] = {
                'warm_up': int(times[0]),
                'main': int(times[1]),
                'practice': int(times[2])
            }
        
        # 检测过渡方式
        if '接下来' in lesson or '然后' in lesson:
            preference['transition'] = 'direct'
        elif '问题' in lesson or '思考' in lesson:
            preference['transition'] = 'question'
        else:
            preference['transition'] = 'implicit'
    
    return preference
```

### Step 5: 生成风格配置

```python
def generate_style_config(language_style, teaching_preference, structure_preference):
    """
    生成风格配置文件
    """
    config = {
        'teacher': {
            'name': '教师',
            'style': {
                'formality': language_style['formality'],
                'sentence_length': language_style['sentence_length'],
                'interaction_frequency': teaching_preference['interaction'],
                'feedback_style': teaching_preference['feedback']
            },
            'teaching': {
                'preferred_method': teaching_preference['method'],
                'warm_up': teaching_preference['warm_up'],
                'transition': structure_preference['transition']
            },
            'structure': {
                'sections': structure_preference['sections'],
                'time_distribution': structure_preference['time_distribution']
            }
        }
    }
    
    return config
```

### Step 6: 注入风格到教案

```python
def inject_style(lesson_plan, style_config):
    """
    将风格配置注入到教案中
    """
    # 语言注入
    if style_config['teacher']['style']['formality'] == 'formal':
        lesson_plan = use_formal_language(lesson_plan)
    elif style_config['teacher']['style']['formality'] == 'informal':
        lesson_plan = use_informal_language(lesson_plan)
    
    # 结构注入
    if style_config['teacher']['structure']['sections']:
        lesson_plan = adjust_sections(lesson_plan, style_config['teacher']['structure']['sections'])
    
    # 时间注入
    if style_config['teacher']['structure']['time_distribution']:
        lesson_plan = adjust_time(lesson_plan, style_config['teacher']['structure']['time_distribution'])
    
    # 互动注入
    if style_config['teacher']['style']['interaction_frequency'] == 'high':
        lesson_plan = add_more_questions(lesson_plan)
    
    # 反馈注入
    if style_config['teacher']['style']['feedback_style'] == 'positive':
        lesson_plan = use_positive_feedback(lesson_plan)
    
    return lesson_plan
```

---

## 集成到主流程

### Step 2: 风格学习（更新版）

```
Step 2: 风格学习
    ├── 检查是否提供了style_file
    │   ├── 有 → 加载并解析风格配置
    │   └── 无 → 询问是否提供旧教案
    │       ├── 是 → 调用 collect_old_lessons()
    │       │       ├── 调用 extract_language_style()
    │       │       ├── 调用 extract_teaching_preference()
    │       │       ├── 调用 extract_structure_preference()
    │       │       ├── 调用 generate_style_config()
    │       │       └── 存储到 ~/.eduagent/soul.md
    │       └── 否 → 使用默认风格
    ↓
    返回风格配置
```

### Step 4: 教案生成（更新版）

```
Step 4: 教案生成
    ├── 按Schema生成教案
    ├── 调用 inject_style(lesson_plan, style_config)
    ├── 执行12项质量检查
    ├── 不合格项带反馈重试（最多3次）
    └── 输出合格教案
```

---

## 快速风格分析（无旧教案时）

当教师无法提供旧教案时，使用问卷快速分析：

```python
def quick_style_analysis(answers):
    """
    通过问卷快速分析风格
    """
    config = {
        'teacher': {
            'style': {
                'formality': 'formal' if answers['称呼'] == '同学们' else 'informal',
                'sentence_length': 'medium',
                'interaction_frequency': 'high' if answers['提问频率'] == '频繁' else 'medium',
                'feedback_style': 'positive' if answers['反馈方式'] == '表扬为主' else 'neutral'
            },
            'teaching': {
                'preferred_method': answers['教学方法'],
                'warm_up': answers['导入方式'],
                'transition': 'direct'
            }
        }
    }
    
    return config
```

**问卷问题：**
1. 您通常如何称呼学生？（同学们/学生/孩子们）
2. 您通常如何开始一节课？（复习/故事/问题/视频）
3. 您通常如何讲解新知识？（先讲后练/先练后讲/边讲边练）
4. 您通常如何组织学生练习？（独立/小组/同伴）
5. 您通常何时检查学生理解？（每个环节/课后/不定期）
6. 您通常使用什么评估方式？（提问/测验/观察/作品）
7. 您的提问频率如何？（频繁/适中/较少）
8. 您的反馈方式如何？（表扬为主/直接纠正/中性反馈）

---

## 默认风格配置

当教师无法提供信息时，使用以下默认配置：

```yaml
default_style:
  teacher:
    style:
      formality: "formal"
      sentence_length: "medium"
      interaction_frequency: "medium"
      feedback_style: "positive"
    teaching:
      preferred_method: "gradual_release"
      warm_up: "review"
      transition: "direct"
    structure:
      sections: ["导入", "新授", "练习", "总结"]
      time_distribution:
        warm_up: 5
        main: 25
        practice: 10
        summary: 5
```
