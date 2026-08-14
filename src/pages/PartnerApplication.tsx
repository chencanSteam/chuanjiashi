import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PartnerApplyForm from '../components/PartnerApplyForm';
import Annotate from '../components/annotation/Annotate';
import './PartnerApplication.css';

export default function PartnerApplication() {
  const navigate = useNavigate();

  return (
    <div className="partner-application-page">
      <div className="partner-application-card">
        <header className="partner-application-header">
          <Annotate id="partner-application.back" inline>
          <button className="btn btn-ghost" onClick={() => navigate('/home')}>
            <ArrowLeft size={16} /> 返回首页
          </button>
          </Annotate>
          <h1>申请成为合伙人</h1>
          <p>免费申请，审核通过后即可开展业务</p>
        </header>

        <Annotate id="partner-application.apply-form">
        <PartnerApplyForm onSuccess={() => navigate('/partner', { replace: true })} />
        </Annotate>
      </div>
    </div>
  );
}
