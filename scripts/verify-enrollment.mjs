import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const origin = process.env.ENROLLMENT_TEST_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const button = name => page.getByRole('button', { name, exact: true });
const getRecord = () => page.evaluate(() => JSON.parse(localStorage.getItem('cj_biographer_enrollment_v1'))[0]);
async function signIn(phone, roles, route) {
  await page.evaluate(({ phone, roles }) => localStorage.setItem('cj_user', JSON.stringify({ phone, name: '测试用户', token: 'local-test', roles })), { phone, roles });
  await page.reload();
  await page.goto(`${origin}/#${route}`);
}
try {
  await page.goto(origin);
  await button('传记师入驻 申请入驻、查看审核进度').click();
  await page.getByRole('heading', { name: '成为传家世传记师' }).waitFor();
  assert.equal(await page.getByText(/笔名|展示名称/).count(), 0);
  // 不完整资料可以随意切换步骤。
  await button('下一步').click();
  await page.getByRole('heading', { name: '展示一份代表作品' }).waitFor();
  await button('1. 基本资料').click();
  await page.getByLabel('真实姓名', { exact: true }).fill('林书禾');
  await page.getByLabel('身份证号', { exact: true }).fill('000000000000000000');
  await button('模拟实名认证').click();
  assert.ok((await getRecord()).identityVerifiedAt);
  await page.getByLabel('真实姓名', { exact: true }).fill('林文禾');
  await page.getByText('待实名认证', { exact: true }).waitFor();
  await button('模拟实名认证').click();
  await page.getByLabel('身份证号', { exact: true }).fill('000000000000000001');
  await page.getByText('待实名认证', { exact: true }).waitFor();
  await button('模拟实名认证').click();
  assert.equal(await page.getByLabel('服务城市', { exact: true }).isDisabled(), true);
  await page.getByLabel('服务省份', { exact: true }).selectOption('江苏省');
  await page.getByLabel('服务城市', { exact: true }).selectOption('苏州市');
  await page.getByLabel('服务城市', { exact: true }).selectOption('南京市');
  await page.getByLabel('服务省份', { exact: true }).selectOption('浙江省');
  assert.equal(await page.getByLabel('服务城市', { exact: true }).inputValue(), '');
  assert.equal(await page.getByLabel('服务城市', { exact: true }).locator('option', { hasText: '苏州市' }).count(), 0);
  await page.getByLabel('服务城市', { exact: true }).selectOption('杭州市');
  await button('移除城市 江苏省 / 南京市').click();
  const tag = page.getByLabel('擅长领域标签', { exact: true });
  await tag.fill('传记'); await button('添加标签').click();
  await page.getByRole('status').filter({ hasText: '每个标签填写 3～6 字' }).waitFor();
  await tag.fill('人物传记故事集'); await button('添加标签').click();
  assert.equal(await button('移除标签 人物传记故事集').count(), 0);
  for (const value of ['家族史', '人物传记写作']) { await tag.fill(value); await tag.press('Enter'); }
  await tag.fill('家族史'); await button('添加标签').click();
  await page.getByRole('status').filter({ hasText: '这个标签已添加' }).waitFor();
  await button('移除标签 家族史').click();
  await tag.fill('家族史'); await button('添加标签').click();
  await button('保存草稿').click(); await page.reload();
  await page.getByLabel('真实姓名', { exact: true }).waitFor();
  assert.equal(await page.getByLabel('身份证号', { exact: true }).inputValue(), '000000000000000001');
  assert.equal(await button('认证已完成').isDisabled(), true);
  assert.equal(await button('移除城市 江苏省 / 苏州市').count(), 1);
  assert.equal(await button('移除城市 浙江省 / 杭州市').count(), 1);
  assert.equal(await button('移除标签 人物传记写作').count(), 1);
  await page.screenshot({ path: join(tmpdir(), 'enrollment-revised-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: join(tmpdir(), 'enrollment-revised-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  // 申请时不收押金，空资料也能提交。
  await button('3. 确认提交').click();
  await page.getByText('000***********0001', { exact: true }).waitFor();
  assert.equal(await button('模拟缴纳押金').count(), 0);
  await button('提交入驻申请').click();
  await page.getByRole('heading', { name: '审核中', exact: true }).waitFor();
  assert.equal((await getRecord()).depositPaidAt, '');
  assert.equal(await page.getByRole('heading', { name: '缴纳入驻押金', exact: true }).count(), 0);
  const applicant = (await getRecord()).owner;
  await signIn('13800138000', ['user', 'admin'], '/admin/content-review/biographer-applications');
  await button('审核申请').click();
  await page.getByText('江苏省 / 苏州市、浙江省 / 杭州市', { exact: true }).waitFor();
  // 审核意见为空时用演示意见，不阻断。
  await button('要求补充资料').click();
  assert.equal((await getRecord()).status, 'supplement');
  await signIn(applicant, ['user'], '/biographer-apply');
  await button('修改资料重新提交').click();
  await button('3. 确认提交').click(); await button('提交入驻申请').click();
  assert.equal((await getRecord()).depositPaidAt, '');
  await signIn('13800138000', ['user', 'admin'], '/admin/content-review/biographer-applications');
  await button('审核申请').click(); await button('通过审核').click();
  assert.equal((await getRecord()).status, 'approved');
  await signIn(applicant, ['user'], '/biographer-apply');
  await button('确认合作并缴纳押金').click();
  await page.getByRole('heading', { name: '缴纳入驻押金', exact: true }).waitFor();
  await page.locator('.modal-footer').getByRole('button', { name: '取消', exact: true }).click();
  assert.equal((await getRecord()).status, 'approved');
  assert.equal((await getRecord()).depositPaidAt, '');
  await page.reload();
  await button('确认合作并缴纳押金').click();
  await button('模拟支付并开通').click();
  assert.equal((await getRecord()).depositAmount, 1000);
  assert.ok((await getRecord()).depositPaidAt);
  await page.reload();
  await page.getByRole('heading', { name: '已开通', exact: true }).waitFor();
  await button('进入传记师工作台').click();
  await page.waitForURL('**/#/biographer/orders');
  await page.getByRole('heading', { name: '我的订单', exact: true }).waitFor();
  // 完全空白资料也能完成申请，不用凑必填项。
  const fresh = await browser.newContext(); const demo = await fresh.newPage();
  await demo.goto(`${origin}/#/biographer-apply?demo=1`);
  await demo.getByLabel('联系手机号', { exact: true }).fill('');
  await demo.getByRole('button', { name: '下一步', exact: true }).click();
  await demo.getByLabel('作品链接', { exact: true }).fill('javascript:alert(1)');
  await demo.getByRole('button', { name: '下一步', exact: true }).click();
  // 不阻断格式，但不把非 http(s) 输入渲染为可执行链接。
  assert.equal(await demo.getByRole('link', { name: '查看作品链接 ↗' }).count(), 0);
  await demo.getByRole('button', { name: '提交入驻申请', exact: true }).click();
  await demo.getByRole('heading', { name: '审核中', exact: true }).waitFor();
  // 老版草稿兼容：单城市保留，笔名不再展示，缺少押金不会被视为已支付。
  await demo.evaluate(() => {
    const records = JSON.parse(localStorage.getItem('cj_biographer_enrollment_v1'));
    const old = records[0]; delete old.cities; delete old.depositPaidAt; delete old.depositAmount;
    old.city = '江苏苏州'; old.displayName = '旧笔名'; old.name = '陈文'; old.status = 'draft';
    localStorage.setItem('cj_biographer_enrollment_v1', JSON.stringify(records));
  });
  await demo.reload();
  await demo.getByRole('button', { name: '移除城市 江苏苏州', exact: true }).waitFor();
  assert.equal(await demo.getByText('旧笔名').count(), 0);
  await demo.getByRole('button', { name: '3. 确认提交', exact: true }).click();
  assert.equal(await demo.getByRole('button', { name: '模拟缴纳押金', exact: true }).count(), 0);
  await fresh.close();
  assert.deepEqual(errors, []);
  console.log('PASS: 实名、省市级联多选/删除/恢复、自定义3～6字标签、审核前不收费、审批后1000元模拟押金、取消付款保持待开通、空资料提交、退回重提与开通、旧记录兼容、手机布局；无页面运行错误。');
} catch (error) {
  console.error('Failure page:', page.url(), (await page.locator('body').innerText()).slice(-5000)); throw error;
} finally { await browser.close(); }
