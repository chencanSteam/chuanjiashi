import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import './FamilyMotto.css';

export default function FamilyMotto() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [motto, setMotto] = useState('忠厚传家远，诗书继世长');

  const handleSave = () => {
    addToast('家训已保存', 'success');
    navigate('/family');
  };

  return (
    <div className="detail-page family-motto-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">编辑家训</h1>
      </header>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">家训内容</h3>
        </div>
        <div className="card-body">
          <textarea
            className="motto-textarea"
            rows={4}
            value={motto}
            onChange={(e) => setMotto(e.target.value)}
          />
          <div className="motto-actions">
            <button className="btn btn-outline" onClick={() => navigate(-1)}>取消</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={14} /> 保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
