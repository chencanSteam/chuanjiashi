import BiographerEnrollmentReview from '../components/BiographerEnrollmentReview';

export default function BiographerApplications() {
  return <div className="biographer-applications-page">
    <header className="page-header"><div><h1 className="page-title">传记师入驻申请</h1><p className="page-subtitle">审核申请资料，查看入驻进度与处理记录</p></div></header>
    <BiographerEnrollmentReview />
  </div>;
}
