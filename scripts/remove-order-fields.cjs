const fs = require('fs');

function edit(path, pairs, regexPairs = []) {
  let src = fs.readFileSync(path, 'utf8');
  const crlf = src.includes('\r\n');
  const fix = (s) => (crlf ? s.replace(/\n/g, '\r\n') : s);
  for (const [rawOld, rawNew = ''] of pairs) {
    const o = fix(rawOld);
    if (!src.includes(o)) throw new Error(`${path}: NOT FOUND: ${rawOld.slice(0, 70)}`);
    src = src.split(o).join(fix(rawNew));
  }
  for (const [pat, newStr] of regexPairs) {
    const next = src.replace(pat, newStr);
    if (next === src) throw new Error(`${path}: REGEX NO MATCH: ${pat}`);
    src = next;
  }
  fs.writeFileSync(path, src, 'utf8');
  console.log('OK', path);
}

// 1. 类型定义（第一轮已完成，跳过）

// 2. mock 订单接口
edit('src/mocks/api/order.ts', [
  ["    quantity: data.quantity ?? 1,\n    sku: data.sku,\n    remark: data.remark,\n", ""],
  ["  const common = { quantity: order.quantity || 1 }\n", ""],
], [
  [/[ \t]*\.{3}common,\r?\n/g, ""],
  [/\.{3}common, /g, ""],
]);

// 3. 演示数据里的 quantity
edit('src/data/demoContent.ts', [], [[/, quantity: 1,/g, ","]]);
edit('src/pages/ContentReview.tsx', [], [[/, quantity: 1,/g, ","]]);

// 4. 用户端我的订单
edit('src/pages/MyOrders.tsx', [
  [", quantity: 2,", ","],
  ["      name: o.productName + ((o.quantity ?? 1) > 1 ? ` ×${o.quantity} 份` : ''),\n      sub: o.sku || '',\n", "      name: o.productName,\n      sub: '',\n"],
  ["<span>{selected.productName}{(selected.quantity ?? 1) > 1 ? ` ×${selected.quantity} 份` : ''}</span>", "<span>{selected.productName}</span>"],
  [`              {selected.remark && (
                <div className="my-order-detail-row">
                  <span>备注</span>
                  <span className="my-order-detail-remark">{selected.remark}</span>
                </div>
              )}
`, ""],
]);

// 5. 后台订单管理
edit('src/pages/OrderManagement.tsx', [
  ["        quantity: 1,\n", ""],
  ["        remark: `传记师：${o.biographerName} · 传主：${o.requirements.interviewee || '待补充'}`,\n", ""],
  ["    const header = ['订单号', '客户', '商品/服务', '类型', '数量', '实付金额', '订单状态', '售后状态', '下单时间', '支付时间'];", "    const header = ['订单号', '客户', '商品/服务', '类型', '实付金额', '订单状态', '售后状态', '下单时间', '支付时间'];"],
  ["      String(item.quantity || 1),\n", ""],
  ["                    <th>数量</th>\n", ""],
  ["                        <td>{item.quantity || 1}</td>\n", ""],
  [`              {selectedOrder.sku && (
                <div className="order-detail-row">
                  <span className="order-detail-label">SKU</span>
                  <span className="order-detail-value">{selectedOrder.sku}</span>
                </div>
              )}
              <div className="order-detail-row">
                <span className="order-detail-label">购买数量</span>
                <span className="order-detail-value">{selectedOrder.quantity || 1}</span>
              </div>
`, ""],
  [`              {selectedOrder.remark && (
                <div className="order-detail-row">
                  <span className="order-detail-label">备注</span>
                  <span className="order-detail-value" style={{ maxWidth: 260, lineHeight: 1.5 }}>{selectedOrder.remark}</span>
                </div>
              )}
`, ""],
], [
  [/, quantity: \d,/g, ","],
]);

// 6. 移动端订单列表
edit('src/pages/mobile/MobileOrders.tsx', [
  ["{order.type} · {order.quantity || 1} 件", "{order.type}"],
]);
