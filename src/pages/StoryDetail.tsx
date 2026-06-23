import { useState } from 'react';
import { ArrowLeft, Eye, Heart, Share2, MessageCircle, ThumbsUp, Send } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import Avatar from '../components/ui/Avatar';
import './StoryDetail.css';

const storyData: Record<string, { tag: string; author: string; views: number; likes: number; content: string; date: string }> = {
  '爷爷的记忆：从教40年': {
    tag: '家庭教育',
    author: '张明远',
    views: 128,
    likes: 18,
    date: '2024-05-10',
    content: '张志远爷爷自1950年参加工作，先后在市立小学、市一中任教，整整四十年站在三尺讲台。他常说："教书育人和耕田一样，要用心、要耐烦。"退休后，他依然关心家族晚辈的学习成长，留下了大量教学笔记与家书。',
  },
  '我的大学时光': {
    tag: '成长故事',
    author: '张子涵',
    views: 96,
    likes: 12,
    date: '2024-05-08',
    content: '大学四年的时光转瞬即逝。从初入校园的懵懂，到实验室里熬夜做项目的坚持，再到毕业典礼上与家人的合影，这段经历让我明白了什么是责任与热爱。',
  },
  '奶奶的拿手菜': {
    tag: '生活故事',
    author: '李婉如',
    views: 156,
    likes: 23,
    date: '2024-05-06',
    content: '王淑兰奶奶最拿手的是红烧狮子头和桂花糯米藕。每逢春节，厨房里飘出的香味就是全家团聚的信号。如今我把菜谱整理成文字，希望这份味道能代代相传。',
  },
  '父亲的创业之路': {
    tag: '创业历程',
    author: '张建国',
    views: 210,
    likes: 34,
    date: '2024-04-28',
    content: '1992年，父亲辞去稳定的工作，与两位伙伴共同创立明远机械。创业初期条件艰苦，但凭借踏实肯干与技术创新，公司逐步打开市场，产品远销海外。',
  },
  '家谱里的家风家训': {
    tag: '家风家训',
    author: '张明远',
    views: 178,
    likes: 29,
    date: '2024-04-20',
    content: '翻开民国三年的《张氏族谱》，"忠厚传家远，诗书继世长"十个大字映入眼帘。这不仅是一句家训，更是张氏族人百年来为人处世的准则。',
  },
};

export default function StoryDetail() {
  const navigate = useNavigate();
  const { title } = useParams<{ title: string }>();
  const { addToast } = useToast();
  const decodedTitle = decodeURIComponent(title ?? '');
  const story = storyData[decodedTitle] ?? { tag: '家庭故事', author: '张明远', views: 0, likes: 0, date: '-', content: '暂无故事内容。' };
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(story.likes);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<string[]>(['故事很感人，向爷爷致敬。', '已收藏到家庭故事集。']);

  return (
    <div className="detail-page story-detail-page">
      <header className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="page-title">故事详情</h1>
      </header>

      <div className="card">
        <div className="card-body story-detail-body">
          <div className="story-detail-header">
            <span className="story-detail-tag">{story.tag}</span>
            <h2 className="story-detail-title">{decodedTitle}</h2>
            <div className="story-detail-author">
              <Avatar name={story.author} size={32} />
              <span>{story.author}</span>
              <span className="story-detail-date">发布于 {story.date}</span>
            </div>
          </div>

          <div className="story-detail-content">
            <p>{story.content}</p>
            <p>家族故事不仅是个人记忆的留存，更是家风传承的载体。通过文字、照片与音视频的记录，我们得以跨越时空，与先辈对话，并将这份精神财富传递给下一代。</p>
          </div>

          <div className="story-detail-stats">
            <span><Eye size={14} /> {story.views}</span>
            <span className={liked ? 'liked' : ''}><Heart size={14} /> {likeCount}</span>
            <span><MessageCircle size={14} /> {comments.length}</span>
          </div>

          <div className="story-detail-actions">
            <button className={`btn ${liked ? 'btn-outline' : 'btn-primary'}`} onClick={() => {
              setLiked((v) => !v);
              setLikeCount((c) => liked ? c - 1 : c + 1);
              addToast(liked ? '已取消点赞' : '点赞成功', 'success');
            }}>
              <ThumbsUp size={14} /> {liked ? '已点赞' : '点赞'}
            </button>
            <button className="btn btn-outline" onClick={() => { navigator.clipboard.writeText(window.location.href); addToast('分享链接已复制', 'success'); }}><Share2 size={14} /> 分享</button>
            <button className="btn btn-outline" onClick={() => setShowComment((v) => !v)}><MessageCircle size={14} /> 评论</button>
          </div>

          {showComment && (
            <div className="story-comment-box">
              <input
                type="text"
                className="story-comment-input"
                placeholder="写下你的评论…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && comment.trim() && (() => { setComments((prev) => [...prev, comment.trim()]); setComment(''); addToast('评论已发布', 'success'); })()}
              />
              <button className="btn btn-primary" onClick={() => {
                if (!comment.trim()) return;
                setComments((prev) => [...prev, comment.trim()]);
                setComment('');
                addToast('评论已发布', 'success');
              }}><Send size={14} /></button>
            </div>
          )}

          <div className="story-comment-list">
            {comments.map((c, i) => (
              <div className="story-comment-item" key={i}>
                <Avatar name={`用户${i + 1}`} size={28} />
                <div className="story-comment-content">{c}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
