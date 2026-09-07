// 生成一个最小可用的 .docx 测试文件
const { zipSync, strToU8 } = require('fflate');
const fs = require('fs');

const paragraphs = [
  '第一章 童年往事',
  '我1958年出生于苏州一个教师家庭。然后家里虽然不富裕，但是父亲非常重视教育。',
  '十岁那年发大水，父亲背着我蹚水去上学，我心里非常感动，所以至今难忘。',
  '第二章 求学与工作',
  '1976年我考入南京大学机械工程系，特别高兴。然后大学四年我非常努力，但是很少回家。',
  '毕业后分配到南京机床厂当技术员，所以开始了职业生涯。',
  '第三章 创业之路',
  '1992年我辞职创业，创办了明远机械。然后经历了很多困难，但是都坚持下来了。',
];

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
${paragraphs.map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`).join('\n')}
</w:body></w:document>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;

const zipped = zipSync({
  '[Content_Types].xml': strToU8(contentTypes),
  'word/document.xml': strToU8(documentXml),
});

fs.writeFileSync('scripts/test-biography.docx', Buffer.from(zipped));
console.log('docx written:', zipped.length, 'bytes');
