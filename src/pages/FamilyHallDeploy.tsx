import { ArrowLeft, Link, QrCode, Share2, Code } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import './FamilyHallDeploy.css';

const tabs = [
  { key: 'link', label: 'H5链接', Icon: Link },
  { key: 'qrcode', label: '二维码', Icon: QrCode },
  { key: 'poster', label: '分享海报', Icon: Share2 },
  { key: 'embed', label: '嵌入官网', Icon: Code },
];

export default function FamilyHallDeploy() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [active, setActive] = useState('link');

  return (
    <div className="detail-page family-hall-deploy-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">家风馆发布</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <div className="deploy-tabs">
            {tabs.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`deploy-tab ${active === key ? 'active' : ''}`}
                onClick={() => setActive(key)}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body deploy-body">
          {active === 'link' && (
            <>
              <label className="deploy-label">家风馆访问链接</label>
              <div className="deploy-input-row">
                <input className="deploy-input" readOnly value="https://chuanjiashi.cn/hall/张氏家风馆" />
                <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText('https://chuanjiashi.cn/hall/张氏家风馆'); addToast('链接已复制', 'success'); }}>复制</button>
              </div>
            </>
          )}
          {active === 'qrcode' && (
            <div className="deploy-qrcode">
              <QrCode size={120} />
              <div className="deploy-qrcode-tip">微信扫码访问家风馆</div>
            </div>
          )}
          {active === 'poster' && (
            <div className="deploy-poster">
              <div className="poster-preview">张氏家风馆<br />分享海报</div>
              <button className="btn btn-primary" onClick={() => {
                const blob = new Blob(['张氏家风馆 分享海报\nhttps://chuanjiashi.cn/hall/张氏家风馆'], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = '张氏家风馆海报.txt';
                a.click();
                URL.revokeObjectURL(url);
                addToast('海报已生成', 'success');
              }}>下载海报</button>
            </div>
          )}
          {active === 'embed' && (
            <>
              <label className="deploy-label">嵌入代码</label>
              <textarea
                className="deploy-textarea"
                readOnly
                rows={4}
                value='<iframe src="https://chuanjiashi.cn/hall/张氏家风馆" width="100%" height="600"></iframe>'
              />
              <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText('<iframe src="https://chuanjiashi.cn/hall/张氏家风馆" width="100%" height="600"></iframe>'); addToast('代码已复制', 'success'); }}>复制代码</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
