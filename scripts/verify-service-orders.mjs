import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const origin = process.env.SERVICE_TEST_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage(); const errors = [];
page.on('pageerror', error => errors.push(error.message));
let id;
const button = name => page.getByRole('button', { name, exact: true });
const record = () => page.evaluate(orderId => JSON.parse(localStorage.getItem('cj_biographer_service_orders_v1') || '[]').find(item => item.id === orderId), id);
const detail = () => page.locator('.bs-detail');
const confirm = async name => { await page.locator('.modal-footer').last().getByRole('button', { name, exact: true }).click(); };
async function signIn(phone, roles, route) {
  await page.evaluate(({ phone, roles }) => localStorage.setItem('cj_user', JSON.stringify({ phone, name: phone === '13800138003' ? '张明远' : '演示用户', token: 'local-test', roles })), { phone, roles });
  // 整页导航同时恢复新账号与目标路由，避免旧角色页面的重定向竞争。
  await page.goto(`${origin}/?serviceVerification=${Date.now()}#${route}`);
}
async function view(role) {
  if (role === 'customer') await signIn('13800138003', ['user'], `/my-orders?type=biographer_service&serviceOrder=${id}`);
  if (role === 'biographer') await signIn('13900139001', ['user', 'biographer'], '/biographer/orders');
  if (role === 'admin') await signIn('13800138000', ['user', 'admin'], '/admin/orders');
  if (role !== 'customer') await page.locator('.bs-order').filter({ hasText: id }).getByRole('button', { name: '查看服务订单' }).click();
  await detail().waitFor();
}
async function createViaUI() {
  await page.goto(`${origin}/#/biographers`);
  await page.locator('.biographer-list-card').filter({ hasText: '李传记' }).first().click();
  await page.getByText('请在订单详情查看', { exact: false }).waitFor();
  assert.equal((await page.locator('.biographer-profile-page').innerText()).includes('13900139001'), false);
  await button('选择此套餐').first().click();
  await page.locator('.biographer-booking-modal input').first().fill('张建国');
  await page.locator('.biographer-booking-modal textarea').fill('希望重点记录父亲的求学、事业和家风故事。');
  await button('提交需求订单').click();
  await detail().waitFor();
  id = new URL(page.url().split('#')[1], origin).searchParams.get('serviceOrder');
  assert.ok(id);
}
try {
  await page.goto(origin);
  await signIn('13800138003', ['user'], '/biographers');
  await createViaUI();
  assert.equal((await record()).status, 'pending_accept'); assert.equal((await record()).paidAt, '');
  assert.equal((await detail().innerText()).includes('13900139001'), false);
  assert.equal(await detail().getByRole('button', { name: /支付全款/ }).count(), 0);
  // 数据层也禁止提前付款，非目标账号不可操作。
  const blocked = await page.evaluate(async orderId => {
    const store = await import('/src/data/biographerServiceOrders.ts');
    return ['pay', 'accept'].map(action => { try { store.updateServiceOrder(orderId, action, { role: action === 'pay' ? 'customer' : 'biographer', phone: action === 'pay' ? '13800138003' : '13900139002' }); return false; } catch { return true; } });
  }, id);
  assert.deepEqual(blocked, [true, true]);
  await view('biographer');
  await button('确认接单').click(); await confirm('确认接单');
  assert.equal((await record()).status, 'pending_pay');
  await view('customer');
  assert.equal((await detail().innerText()).includes('13900139001'), false);
  await detail().getByRole('button', { name: /支付全款/ }).click();
  await confirm('确认模拟全款支付');
  assert.equal((await record()).status, 'working');
  await detail().getByRole('link', { name: '13900139001', exact: true }).waitFor();
  assert.equal(await detail().getByRole('link', { name: '13900139001' }).getAttribute('href'), 'tel:13900139001');
  await page.reload(); await detail().getByRole('link', { name: '13900139001', exact: true }).waitFor();
  // 联系不上申请平台介入，处理中冻结；平台处理后恢复。
  await button('联系不上 / 平台介入').click(); await confirm('确认申请平台介入');
  assert.equal((await record()).requests[0].status, 'pending');
  await view('biographer'); assert.equal(await button('提交访谈与大纲').count(), 0);
  await view('admin'); await button('处理申请').click(); await confirm('确认处理完成');
  for (const [index, stage] of ['访谈与大纲', '初稿', '校审稿', '终稿'].entries()) {
    await view('biographer');
    await detail().getByRole('button', { name: `提交${stage}`, exact: true }).click();
    await page.getByLabel('服务操作内容').fill(`${stage}正文：记录传主成长与家风故事，核对人物与时间线。`);
    await confirm('确认提交稿件');
    assert.equal((await record()).stages[index].status, 'review');
    await view('customer');
    if (index === 1) {
      await button('提出修改意见').click(); await page.getByLabel('服务操作内容').fill('补充父亲求学时的家庭支持。'); await confirm('确认提交修改意见');
      assert.equal((await record()).stages[1].status, 'revision');
      assert.equal((await record()).stages[1].settledAt, '');
      await view('biographer'); await detail().getByRole('button', { name: '提交初稿', exact: true }).click(); await page.getByLabel('服务操作内容').fill('初稿第二版：已补充求学期间的家庭支持及关键年份。'); await confirm('确认提交稿件');
      await view('customer');
      assert.equal((await record()).stages[1].versions.length, 2);
    }
    await button(`验收通过${stage}`).click(); await confirm('确认验收通过');
    assert.equal((await record()).stages[index].status, 'accepted');
    if (index > 0) {
      await view('admin'); await button(`结算${stage}`).click(); await confirm('确认结算');
      assert.ok((await record()).stages[index].settledAt);
      assert.equal(await button(`结算${stage}`).count(), 0);
    }
  }
  const completed = await record();
  assert.equal(completed.status, 'completed');
  assert.equal(Math.round(completed.stages.reduce((sum, stage) => sum + stage.amount, 0) * 100), Math.round(completed.providerAmount * 100));
  assert.equal(completed.stages.filter(stage => stage.settledAt).length, 3);
  await page.screenshot({ path: join(tmpdir(), 'service-order-admin.png'), fullPage: true });
  await view('customer'); await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await detail().evaluate(el => el.scrollWidth > el.clientWidth), false);
  await page.screenshot({ path: join(tmpdir(), 'service-order-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signIn('13800138008', ['user'], '/my-orders?type=biographer_service');
  assert.equal(await page.locator('.bs-order').filter({ hasText: id }).count(), 0);
  // 第二笔订单：拒绝后不收款。
  await signIn('13800138003', ['user'], '/biographers'); await createViaUI();
  await view('biographer'); await button('无法承接').click(); await confirm('确认无法承接');
  assert.equal((await record()).status, 'closed'); assert.equal((await record()).paidAt, '');
  // 第三笔订单：付款后退款，平台核算部分退款，结束订单且不再解锁手机号。
  await view('customer'); await createViaUI(); await view('biographer'); await button('确认接单').click(); await confirm('确认接单');
  await view('customer'); await detail().getByRole('button', { name: /支付全款/ }).click(); await confirm('确认模拟全款支付');
  await button('申请退款').click(); await confirm('确认申请退款');
  await view('admin'); await button('处理申请').click(); await page.getByLabel('协商退款金额').fill('1000'); await confirm('确认处理完成');
  assert.equal((await record()).status, 'refunded'); assert.equal((await record()).requests[0].amount, 1000);
  await view('customer'); assert.equal(await detail().getByRole('link', { name: '13900139001' }).count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: 需求提交不付款、目标传记师接单、全款支付后才显示电话、账号隔离、平台介入、四阶段交付、修改重提、30/40/30三笔结算且不重复、拒接不收费、退款关闭、移动端；无页面运行错误。');
} catch (error) { console.error('Failure:', page.url(), (await page.locator('body').innerText()).slice(-6000)); throw error; }
finally { await browser.close(); }
