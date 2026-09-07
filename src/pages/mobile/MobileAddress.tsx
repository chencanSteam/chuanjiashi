import { ArrowLeft, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import type { OrderAddress } from '../../mocks/types'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import { regions } from '../../data/regions'
import { createAddress, loadAddresses, saveAddresses, type MobileAddress } from '../../utils/mobileAddresses'
import './MobileCommerce.css'

const emptyAddress: OrderAddress = { name: '', phone: '', province: '', city: '', district: '', detail: '' }
const loadPhoneAddress = (phone?: string): MobileAddress[] => loadAddresses(phone)

export default function MobileAddress() {
  const navigate = useNavigate(); const { addToast } = useToast(); const { user } = useAuth()
  const [addresses, setAddresses] = useState(() => loadPhoneAddress(user?.phone))
  const [editing, setEditing] = useState<MobileAddress | null>(null)
  const [form, setForm] = useState<OrderAddress>(emptyAddress)
  const [showForm, setShowForm] = useState(false)
  const province = regions.find((item) => item.name === form.province)
  const cities = province?.cities || []
  const city = cities.find((item) => item.name === form.city)
  const districts = city?.districts || []
  const canSave = form.name.trim() && /^1\d{10}$/.test(form.phone.trim()) && form.province && form.city && form.district && form.detail.trim()
  const update = (field: keyof OrderAddress, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const beginAdd = () => { setEditing(null); setForm({ ...emptyAddress, phone: user?.phone || '' }); setShowForm(true) }
  const beginEdit = (address: MobileAddress) => { setEditing(address); setForm({ name: address.name, phone: address.phone, province: address.province, city: address.city, district: address.district, detail: address.detail }); setShowForm(true) }
  const save = () => {
    if (!canSave) { addToast('请完整填写收货信息，并选择省、市、区', 'error'); return }
    const next = editing ? addresses.map((item) => item.id === editing.id ? { ...item, ...form, updatedAt: new Date().toISOString() } : item) : [...addresses, createAddress(form, addresses.length === 0)]
    setAddresses(next); saveAddresses(user?.phone, next); setShowForm(false); addToast(editing ? '地址已更新' : '地址已保存', 'success')
  }
  const makeDefault = (id: string) => { const next = addresses.map((item) => ({ ...item, isDefault: item.id === id, updatedAt: new Date().toISOString() })); setAddresses(next); saveAddresses(user?.phone, next) }
  const remove = (id: string) => { const next = addresses.filter((item) => item.id !== id); if (next.length && !next.some((item) => item.isDefault)) next[0].isDefault = true; setAddresses(next); saveAddresses(user?.phone, next); addToast('地址已删除', 'info') }
  const provinceOptions = useMemo(() => regions.map((item) => item.name), [])
  return <div className="mobile-commerce mobile-address-page">
    <div className="mobile-subpage-bar"><button type="button" onClick={() => navigate('/m/profile')}><ArrowLeft size={18} /></button><strong>收货地址</strong><button type="button" onClick={beginAdd}><Plus size={18} /></button></div>
    {!showForm ? <>
      <div className="mobile-address-heading"><span><MapPin size={17} />管理收货地址</span><button type="button" onClick={beginAdd}>新增地址</button></div>
      {addresses.length === 0 ? <div className="mobile-commerce-state"><MapPin size={38} /><p>还没有收货地址</p><button type="button" className="mobile-pay-button" onClick={beginAdd}>新增地址</button></div> : <div className="mobile-address-list">{addresses.map((address) => <article className={`mobile-saved-address ${address.isDefault ? 'default' : ''}`} key={address.id}><div className="mobile-saved-address-head"><strong>{address.name}</strong><span>{address.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>{address.isDefault && <em>默认</em>}</div><p>{address.province}{address.city}{address.district}{address.detail}</p><div className="mobile-saved-address-actions"><button type="button" onClick={() => makeDefault(address.id)} disabled={address.isDefault}><Star size={14} />{address.isDefault ? '默认地址' : '设为默认'}</button><button type="button" onClick={() => beginEdit(address)}><Pencil size={14} />编辑</button><button type="button" onClick={() => remove(address.id)}><Trash2 size={14} />删除</button></div></article>)}</div>}
    </> : <div className="mobile-address-card"><div className="mobile-address-title"><MapPin size={18} /><span>{editing ? '编辑地址' : '新增收货地址'}</span></div><label>收件人<input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="请输入收件人姓名" /></label><label>联系电话<input value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="请输入手机号" /></label><div className="mobile-region-row"><label>省<select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value, city: '', district: '' })}><option value="">请选择省</option>{provinceOptions.map((item) => <option key={item}>{item}</option>)}</select></label><label>市<select value={form.city} disabled={!form.province} onChange={(e) => setForm({ ...form, city: e.target.value, district: '' })}><option value="">请选择市</option>{cities.map((item) => <option key={item.name}>{item.name}</option>)}</select></label></div><label>区/县<select value={form.district} disabled={!form.city} onChange={(e) => update('district', e.target.value)}><option value="">请选择区/县</option>{districts.map((item) => <option key={item}>{item}</option>)}</select></label><label>详细地址<input value={form.detail} onChange={(e) => update('detail', e.target.value)} placeholder="街道、门牌号等" /></label><div className="mobile-address-form-actions"><button type="button" onClick={() => setShowForm(false)}>取消</button><button className="mobile-pay-button" type="button" onClick={save}>保存地址</button></div></div>}
  </div>
}
