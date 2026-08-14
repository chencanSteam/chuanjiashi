/** 单条逻辑标注：挂在原型具体控件/区域上的后台逻辑说明 */
export interface LogicAnnotation {
  /** 页面内唯一的标注点 id，对应页面代码里的 <Annotate id="..."> */
  id: string;
  /** 标注目标（控件/区域名称），显示在气泡标题里 */
  target: string;
  /** 逻辑说明正文，用 \n 分行（①②③… 逐条写清触发条件、校验规则、数据流转、异常分支） */
  logic: string;
}

/** 一个页面的全部标注 */
export interface PageAnnotations {
  /** 页面 key，全局唯一 */
  page: string;
  /** 页面名称，显示在气泡里 */
  pageName: string;
  /** 对应路由路径，用于右下角开关统计"本页 N 条标注" */
  route: string;
  items: LogicAnnotation[];
}
