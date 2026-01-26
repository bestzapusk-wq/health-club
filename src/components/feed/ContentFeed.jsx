import { useState, useEffect, useRef, useCallback } from 'react';
import { PenSquare, Newspaper } from 'lucide-react';
import FeedPost from './FeedPost';
import FeedSkeleton from './FeedSkeleton';
import { getFeedPosts } from '../../lib/feedService';
import './ContentFeed.css';

export default function ContentFeed({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Начальная загрузка
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await getFeedPosts(7, 0, userId);
    setPosts(data);
    setHasMore(data.length === 7);
    setLoading(false);
  };

  // Подгрузка при скролле
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const data = await getFeedPosts(7, posts.length, userId);
    
    if (data.length > 0) {
      setPosts(prev => [...prev, ...data]);
      setHasMore(data.length === 7);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }, [posts.length, loadingMore, hasMore, userId]);

  // Intersection Observer для infinite scroll
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => observer.disconnect();
  }, [loading, hasMore, loadingMore, loadMore]);

  // Обновление поста после реакции/комментария
  const handlePostUpdate = (postId, updates) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, ...updates } : post
    ));
  };

  const handleSuggestPostLoading = () => {
    alert('Функция в разработке! Скоро вы сможете предлагать публикации.');
  };

  if (loading) {
    return (
      <div className="content-feed">
        <div className="feed-section-header">
          <div className="feed-title-row">
            <Newspaper size={20} className="feed-icon" />
            <h2>Лента здоровья</h2>
          </div>
          <button className="suggest-post-btn" onClick={handleSuggestPostLoading}>
            <PenSquare size={16} />
            <span>Предложить</span>
          </button>
        </div>
        <FeedSkeleton count={3} />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="content-feed empty">
        <div className="feed-section-header">
          <div className="feed-title-row">
            <Newspaper size={20} className="feed-icon" />
            <h2>Лента здоровья</h2>
          </div>
          <button className="suggest-post-btn" onClick={handleSuggestPostLoading}>
            <PenSquare size={16} />
            <span>Предложить</span>
          </button>
        </div>
        <p>Пока нет публикаций</p>
      </div>
    );
  }

  const handleSuggestPost = () => {
    alert('Функция в разработке! Скоро вы сможете предлагать публикации.');
  };

  return (
    <div className="content-feed">
      {/* Заголовок ленты */}
      <div className="feed-section-header">
        <div className="feed-title-row">
          <Newspaper size={20} className="feed-icon" />
          <h2>Лента здоровья</h2>
        </div>
        <button className="suggest-post-btn" onClick={handleSuggestPost}>
          <PenSquare size={16} />
          <span>Предложить</span>
        </button>
      </div>

      <div className="feed-posts">
        {posts.map(post => (
          <FeedPost 
            key={post.id} 
            post={post} 
            userId={userId}
            onUpdate={(updates) => handlePostUpdate(post.id, updates)}
          />
        ))}
      </div>

      {/* Триггер для подгрузки */}
      {hasMore && (
        <div ref={loadMoreRef} className="load-more-trigger">
          {loadingMore && <FeedSkeleton count={1} />}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="feed-end">
          <span>Вы прочитали все посты 🎉</span>
        </div>
      )}
    </div>
  );
}
