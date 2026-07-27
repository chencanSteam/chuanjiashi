import { useState } from 'react';
import Modal from './ui/Modal';

export interface LicenseSettings {
  isFree: boolean;
  price: number;
  trialWords: number;
}

interface PublishLicenseModalProps {
  open: boolean;
  workName: string;
  initial?: LicenseSettings;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (settings: LicenseSettings) => void;
}

const TRIAL_WORD_OPTIONS = [500, 1000, 2000, 5000];

export default function PublishLicenseModal({
  open,
  workName,
  initial,
  submitting,
  onClose,
  onConfirm,
}: PublishLicenseModalProps) {
  const [isFree, setIsFree] = useState(initial?.isFree ?? true);
  const [priceInput, setPriceInput] = useState(
    initial && !initial.isFree ? String(initial.price) : '9.9'
  );
  const [trialChoice, setTrialChoice] = useState<number | 'custom'>(
    initial && !TRIAL_WORD_OPTIONS.includes(initial.trialWords) ? 'custom' : (initial?.trialWords ?? 1000)
  );
  const [customTrial, setCustomTrial] = useState(
    initial && !TRIAL_WORD_OPTIONS.includes(initial.trialWords) ? String(initial.trialWords) : ''
  );
  const [error, setError] = useState('');

  const handleConfirm = () => {
    let price = 0;
    if (!isFree) {
      price = parseFloat(priceInput);
      if (isNaN(price) || price <= 0) {
        setError('请填写大于 0 的售价');
        return;
      }
    }
    let trialWords: number;
    if (trialChoice === 'custom') {
      trialWords = parseInt(customTrial, 10);
      if (isNaN(trialWords) || trialWords <= 0) {
        setError('请填写大于 0 的试看字数');
        return;
      }
    } else {
      trialWords = trialChoice;
    }
    setError('');
    onConfirm({ isFree, price, trialWords });
  };

  return (
    <Modal
      open={open}
      title={`公开到书架 · 《${workName}的传记》`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={submitting}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={submitting}>
            {submitting ? '提交中…' : initial ? '保存设置' : '确认公开'}
          </button>
        </>
      }
    >
      <div className="license-form">
        <div className="license-field">
          <span className="license-field-label">售价</span>
          <div className="license-radio-group">
            <label className="license-radio">
              <input
                type="radio"
                checked={isFree}
                onChange={() => setIsFree(true)}
              />
              免费公开
            </label>
            <label className="license-radio">
              <input
                type="radio"
                checked={!isFree}
                onChange={() => setIsFree(false)}
              />
              付费阅读
            </label>
          </div>
          {!isFree && (
            <div className="license-price-input">
              <span>¥</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="售价"
              />
            </div>
          )}
        </div>

        <div className="license-field">
          <span className="license-field-label">试看字数</span>
          <div className="license-radio-group">
            {TRIAL_WORD_OPTIONS.map((n) => (
              <label className="license-radio" key={n}>
                <input
                  type="radio"
                  checked={trialChoice === n}
                  onChange={() => setTrialChoice(n)}
                />
                {n} 字
              </label>
            ))}
            <label className="license-radio">
              <input
                type="radio"
                checked={trialChoice === 'custom'}
                onChange={() => setTrialChoice('custom')}
              />
              自定义
            </label>
            {trialChoice === 'custom' && (
              <input
                className="license-custom-input"
                type="number"
                min="1"
                step="1"
                value={customTrial}
                onChange={(e) => setCustomTrial(e.target.value)}
                placeholder="字数"
              />
            )}
          </div>
          <p className="license-hint">读者可免费阅读前 N 字，付费后解锁全本</p>
        </div>

        {error && <p className="license-error">{error}</p>}
      </div>
    </Modal>
  );
}
