import type { PageAnnotations } from './types';

/**
 * 家风馆部署（/family-hall/deploy）的逻辑标注。
 * 编号 = 数组顺序，改顺序即改编号；新增标注在页面代码里加 <Annotate id="..."> 即可。
 */
export const hallDeployAnnotations: PageAnnotations = {
  page: 'hall-deploy',
  pageName: '家风馆部署',
  route: '/family-hall/deploy',
  items: [
    {
      id: 'hall-deploy.tabs',
      target: '部署方式 Tab（H5链接 / 二维码 / 分享海报 / 嵌入官网）',
      logic: `① 四个 Tab 切换仅改本页 active state，下方内容区按 Tab 条件渲染，无路由变化、无数据请求。
② 从家风馆首页/项目详情跳转进来时不携带参数，默认落在「H5链接」Tab。`,
    },
    {
      id: 'hall-deploy.link',
      target: 'H5访问链接',
      logic: `① 链接为固定 mock 值「https://chuanjiashi.cn/hall/张氏家风馆」，输入框只读，不随实际家风馆变化。
② 「复制」调用 navigator.clipboard.writeText 写入剪贴板并提示；未做降级处理，非安全上下文（http）或权限被拒时复制会静默失败但仍提示成功（演示环境可接受）。`,
    },
    {
      id: 'hall-deploy.qrcode',
      target: '二维码访问',
      logic: `① 二维码为图标占位，非真实生成；提示微信扫码访问家风馆。（商城下线后，原「购买永久二维码」付费升级入口已移除）`,
    },
    {
      id: 'hall-deploy.poster',
      target: '分享海报',
      logic: `① 海报为静态预览占位（馆名固定张氏家风馆），非真实海报图。
② 「下载海报」前端用 Blob 拼装含馆名与链接的 txt 文件，createObjectURL 触发浏览器下载后 revokeObjectURL 释放，无后端生成。`,
    },
    {
      id: 'hall-deploy.embed',
      target: '嵌入官网代码',
      logic: `① 嵌入码为固定 iframe 片段（src 指向 mock 家风馆地址，宽 100%、高 600），textarea 只读。
② 「复制代码」同样走 navigator.clipboard 写入剪贴板并提示，成功/失败未做区分。`,
    },
  ],
};
