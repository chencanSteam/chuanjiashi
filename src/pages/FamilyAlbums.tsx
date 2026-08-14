import { useRef, useState } from 'react';
import { ArrowLeft, Image, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { loadAlbumPhotos, readFilesAsDataUrls, saveAlbumPhotos, type AlbumPhoto } from '../utils/albumStorage';
import Annotate from '../components/annotation/Annotate';
import './FamilyAlbums.css';

const albums = [
  { title: '2024春游记', count: '128张' },
  { title: '春节团圆', count: '96张' },
  { title: '成长记录', count: '312张' },
  { title: '家族聚会', count: '85张' },
  { title: '旅行足迹', count: '156张' },
  { title: '老照片', count: '45张' },
];

const DEFAULT_UPLOAD_ALBUM = '全部相册';

export default function FamilyAlbums() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<AlbumPhoto[]>(() => loadAlbumPhotos(DEFAULT_UPLOAD_ALBUM));

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    readFilesAsDataUrls(
      files,
      (photo) => {
        setUploaded((prev) => {
          const next = [...prev, photo];
          saveAlbumPhotos(DEFAULT_UPLOAD_ALBUM, next);
          return next;
        });
      },
      (file) => addToast(`「${file.name}」超过 2MB，已跳过`, 'error'),
      () => addToast('照片上传成功，已存入「全部相册」', 'success'),
    );
  };

  return (
    <div className="detail-page family-albums-page">
      <header className="page-header">
        <Annotate id="family-albums.back-btn" inline>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        </Annotate>
        <h1 className="page-title">家庭相册</h1>
        <Annotate id="family-albums.upload-btn" inline>
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
          <Plus size={14} /> 上传照片
        </button>
        </Annotate>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
      </header>

      <div className="card">
        <div className="card-body">
          <Annotate id="family-albums.album-list">
          <div className="albums-grid">
            {albums.map((a, i) => {
              const photos = loadAlbumPhotos(a.title);
              return (
                <div className="albums-item" key={i} onClick={() => navigate(`/family/album/${encodeURIComponent(a.title)}`)}>
                  <div className="albums-thumb">
                    {photos[0] ? <img src={photos[0].dataUrl} alt={a.title} /> : <Image size={32} />}
                  </div>
                  <div className="albums-info">
                    <div className="albums-title">{a.title}</div>
                    <div className="albums-count">{photos.length > 0 ? `${photos.length}张（含新上传）` : a.count}</div>
                  </div>
                </div>
              );
            })}
            <Annotate id="family-albums.uploaded-album">
            {uploaded.length > 0 && (
              <div className="albums-item" onClick={() => navigate(`/family/album/${encodeURIComponent(DEFAULT_UPLOAD_ALBUM)}`)}>
                <div className="albums-thumb"><img src={uploaded[uploaded.length - 1].dataUrl} alt={DEFAULT_UPLOAD_ALBUM} /></div>
                <div className="albums-info">
                  <div className="albums-title">{DEFAULT_UPLOAD_ALBUM}</div>
                  <div className="albums-count">{uploaded.length}张（新上传）</div>
                </div>
              </div>
            )}
            </Annotate>
          </div>
          </Annotate>
        </div>
      </div>
    </div>
  );
}
