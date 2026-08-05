# -*- coding: utf-8 -*-
import re
p = 'src/pages/AITaskManagement.tsx'
s = open(p, encoding='utf-8').read()

def cut(pattern, name, flags=0):
    global s
    m = re.search(pattern, s, flags)
    if m:
        s = s.replace(m.group(0), '', 1)
        print('cut:', name)
    else:
        print('MISS:', name)

# tabs
s = s.replace("  { key: 'questions', label: '采访题库' },\n", "")
print('tabs ok')

# imports
s = s.replace("""  loadTopicQuestions,
  addTopicQuestion,
  removeTopicQuestion,
""", "")
s = s.replace("import { interviewTopics as presetTopics, interviewQuestionBank } from '../data/aiMock';\n", "")
print('imports ok')

# states
cut(r"  const \[questions, setQuestions\] = useState<Question\[\]>\(\[\]\);\n", 'questions state')
cut(r"  const \[questionModal.*?\n.*?setSavingQuestion.*?\n", 'question modal states', re.DOTALL)
cut(r"  const \[bankTopic.*?\n.*?bankRefresh.*?\n.*?newBankQuestion.*?\n", 'bank states', re.DOTALL)

# loadQuestions + effect branch
cut(r"  const loadQuestions = \(\) => \{.*?\n  \};\n\n", 'loadQuestions', re.DOTALL)
s = s.replace("""    if (activeTab === 'questions') {
      loadQuestions();
    }
""", "")

# groupedQuestions memo
cut(r"  const groupedQuestions = useMemo\(\(\) => \{.*?\n  \}, \[questions\]\);\n\n", 'groupedQuestions', re.DOTALL)

# question CRUD handlers
cut(r"  const openCreateQuestion = \(\) => \{.*?\n  \};\n\n", 'openCreateQuestion', re.DOTALL)
cut(r"  const openEditQuestion = \(q: Question\) => \{.*?\n  \};\n\n", 'openEditQuestion', re.DOTALL)
cut(r"  const saveQuestion = async \(\) => \{.*?\n  \};\n\n", 'saveQuestion', re.DOTALL)
cut(r"  const removeQuestion = async \(q: Question\) => \{.*?\n  \};\n\n", 'removeQuestion', re.DOTALL)

# 主题题库派生与添加函数
cut(r"  // 主题题库：预设题为内置只读，手动题目可增删\n  const bankManualQuestions.*?\n  const handleAddBankQuestion = \(\) => \{.*?\n  \};\n\n", 'bank derived + add', re.DOTALL)

# JSX: 主题行题库按钮
cut(r"                    <button className=\"btn btn-outline btn-sm\" onClick=\{\(\) => \{ setBankTopic\(t\); setNewBankQuestion\(''\); \}\}>.*?</button>\n", 'bank button', re.DOTALL)

# JSX: 采访题库区块
if "      {activeTab === 'questions' && (" in s:
    qstart = s.index("      {activeTab === 'questions' && (")
    qend = s.index("      {activeTab === 'qrcodes' && (")
    s = s[:qstart] + s[qend:]
    print('cut: questions section')

# JSX: 题库 modal 与题目 modal
if '      <Modal\n        open={!!bankTopic}' in s:
    a = s.index('      <Modal\n        open={!!bankTopic}')
    b = s.index('      <Modal\n        open={!!topicModal}')
    s = s[:a] + s[b:]
    print('cut: bank modal')

if '      <Modal\n        open={!!questionModal}' in s:
    a = s.index('      <Modal\n        open={!!questionModal}')
    b = s.index('    </div>\n  );\n}')
    s = s[:a] + s[b:]
    print('cut: question modal')

open(p, 'w', encoding='utf-8').write(s)
print('done')
