import { regions } from '../data/regions';
import { industryOccupations } from '../data/occupations';

export interface ExtractedBasicInfo {
  name?: string;
  gender?: '男' | '女';
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  originProvince?: string;
  originCity?: string;
  originDistrict?: string;
  industry?: string;
  occupation?: string;
}

/** 从已上传的传记文本中提取基本信息（原型阶段的规则匹配实现，正式版由 AI 完成） */
export function extractBasicInfoFromBiography(text: string, fileName = ''): ExtractedBasicInfo {
  const result: ExtractedBasicInfo = {};
  const compact = text.replace(/\s+/g, '');
  if (!compact) return result;

  // 姓名：优先文件名（如「周建国自传」），其次正文「我叫×××」
  const fileBase = fileName.replace(/\.[^.]+$/, '');
  const fileNameMatch = fileBase.match(/([\u4e00-\u9fa5]{2,4})(?:的)?(?:自传|传记|回忆录|人生故事)/);
  const textNameMatch = compact.match(/(?:我叫|我是|本人|鄙人)([\u4e00-\u9fa5]{2,4})/);
  const name = (fileNameMatch?.[1] || textNameMatch?.[1] || '').trim();
  if (name && !['我们', '他们', '大家', '自己'].includes(name)) result.name = name;

  // 出生日期：完整日期优先，其次「××××年出生/生于」
  const fullDate = compact.match(/(\d{4})年(\d{1,2})月(\d{1,2})[日号]/);
  const birthAfter = compact.match(/(\d{4})年(?:(\d{1,2})月)?[^。，；]{0,8}(?:出生|生于|降生|出世)/);
  const birthBefore = compact.match(/(?:出生|生于|降生|出世)(?:于|在)?(\d{4})年(?:(\d{1,2})月)?/);
  const dateSource = fullDate || birthAfter || birthBefore;
  if (dateSource) {
    result.birthYear = dateSource[1];
    if (fullDate?.[3]) result.birthDay = fullDate[3].padStart(2, '0');
    if (dateSource[2]) result.birthMonth = dateSource[2].padStart(2, '0');
  }

  // 性别：按配偶称谓推断
  if (/妻子|老婆|夫人/.test(compact)) result.gender = '男';
  else if (/丈夫|老公/.test(compact)) result.gender = '女';

  // 籍贯：优先在「出生/籍贯/老家」等关键词附近匹配省/市/区，避免正文后段的城市名误入
  const matchRegion = (scope: string): boolean => {
    for (const province of regions) {
      const provinceShort = province.name.replace(/(省|市|自治区)$/, '');
      if (!scope.includes(province.name) && !scope.includes(provinceShort)) continue;
      result.originProvince = province.name;
      for (const city of province.cities) {
        const cityShort = city.name.replace(/市$/, '');
        if (!scope.includes(city.name) && !scope.includes(cityShort)) continue;
        result.originCity = city.name;
        for (const district of city.districts) {
          if (scope.includes(district)) {
            result.originDistrict = district;
            break;
          }
        }
        break;
      }
      return true;
    }
    return false;
  };
  const originContext = [...compact.matchAll(/出生|生于|籍贯|祖籍|老家|家乡/g)]
    .map((match) => compact.slice(Math.max(0, (match.index ?? 0) - 12), (match.index ?? 0) + 24))
    .join('。');
  if (!originContext || !matchRegion(originContext)) matchRegion(compact);

  // 行业与职业：扫描职业关键词，命中后带出所属行业
  for (const [industryName, occupations] of Object.entries(industryOccupations)) {
    const hit = occupations.find((occupationName) => occupationName !== '其他' && compact.includes(occupationName));
    if (hit) {
      result.industry = industryName;
      result.occupation = hit;
      break;
    }
  }

  return result;
}
