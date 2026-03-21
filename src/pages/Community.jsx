import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPosts } from '../api/community'

const CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'NOTICE', label: '공지사항' },
  { value: 'FREE', label: '자유게시판' },
  { value: 'SUGGESTION', label: '건의 기능 요청' },
]

function formatDate(str) {
  if (!str) return ''
  return str.slice(0, 10)
}

export default function Community() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)

  const category = searchParams.get('category') || ''
  const keyword = searchParams.get('keyword') || ''
  const page = parseInt(searchParams.get('page') || '0', 10)
  const [inputValue, setInputValue] = useState(keyword)

  useEffect(() => {
    setLoading(true)
    getPosts(category, keyword, page)
      .then(data => {
        setPosts(data.content || data)
        setTotalPages(data.totalPages || 1)
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [category, keyword, page])

  function handleCategoryChange(c) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (c) next.set('category', c)
      else next.delete('category')
      next.delete('page')
      return next
    }, { replace: true })
  }

  function handleInputChange(e) {
    const val = e.target.value
    setInputValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        if (val) next.set('keyword', val)
        else next.delete('keyword')
        next.delete('page')
        return next
      }, { replace: true })
    }, 400)
  }

  function handlePageChange(newPage) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (newPage > 0) next.set('page', String(newPage))
      else next.delete('page')
      return next
    }, { replace: true })
  }

  return (
    <div className="container">
      <div className="community-header">
        <div>
          <h1 className="community-title">커뮤니티</h1>
          <p className="community-desc">스터디원들과 정보를 나눠보세요.</p>
        </div>
        {category !== 'NOTICE' && (
          <Link to="/community/new" className="btn btn-accent">글쓰기</Link>
        )}
      </div>

      <div className="review-search-wrap">
        <svg className="review-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="review-search-input"
          placeholder="제목 검색"
          value={inputValue}
          onChange={handleInputChange}
        />
      </div>

      <div className="community-tabs-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            className={`comm-tab${category === c.value ? ' active' : ''}`}
            onClick={() => handleCategoryChange(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="section-sm" style={{ paddingTop: 8 }}>
        {loading ? (
          <p className="text-muted">로딩 중...</p>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✍️</div>
            <h3>게시글이 없습니다</h3>
            <p>첫 번째 글을 작성해보세요!</p>
            {category !== 'NOTICE' && (
              <Link to="/community/new" className="btn btn-accent">글쓰기</Link>
            )}
          </div>
        ) : (
          <div className="post-list">
            {posts.map(post => (
              <Link key={post.id} to={`/community/${post.id}`} className="post-row">
                <div className="post-row-left">
                  <span className={`post-cat-badge ${post.category}`}>
                    {CATEGORIES.find(c => c.value === post.category)?.label || post.category}
                  </span>
                  <span className="post-title">{post.title}</span>
                  {post.commentCount > 0 && (
                    <span className="post-comment-count">[{post.commentCount}]</span>
                  )}
                </div>
                <div className="post-row-right">
                  <span className="post-author">{post.authorName}</span>
                  {post.viewCount != null && <span>조회 {post.viewCount}</span>}
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={page === 0}
              onClick={() => handlePageChange(page - 1)}
            >이전</button>
            <span className="page-info">{page + 1} / {totalPages}</span>
            <button
              className="page-btn"
              disabled={page >= totalPages - 1}
              onClick={() => handlePageChange(page + 1)}
            >다음</button>
          </div>
        )}
      </div>
    </div>
  )
}
