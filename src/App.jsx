import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import client from './api/client'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { useTheme } from './hooks/useTheme'
import Home from './pages/Home'
import RoomBrowse from './pages/RoomBrowse'
import RoomList from './pages/RoomList'
import RoomCreate from './pages/RoomCreate'
import RoomDetail from './pages/RoomDetail'
import ManageLogin from './pages/ManageLogin'
import ManageDashboard from './pages/ManageDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Community from './pages/Community'
import CommunityCreate from './pages/CommunityCreate'
import CommunityDetail from './pages/CommunityDetail'
import Review from './pages/Review'
import ReviewCreate from './pages/ReviewCreate'
import ReviewDetail from './pages/ReviewDetail'
import ReviewEdit from './pages/ReviewEdit'
import Admin from './pages/Admin'
import MyPage from './pages/MyPage'

function AppInner() {
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    client.post('/visitors/ping').catch(() => {})
  }, [])

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<RoomBrowse />} />
          <Route path="/study/theme/:themeId" element={<RoomList />} />
          <Route path="/study/new" element={<RoomCreate />} />
          <Route path="/study/:roomId/manage/dashboard" element={<ManageDashboard />} />
          <Route path="/study/:roomId/manage" element={<ManageLogin />} />
          <Route path="/study/:roomId" element={<RoomDetail />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/new" element={<CommunityCreate />} />
          <Route path="/community/:postId" element={<CommunityDetail />} />
          <Route path="/reviews" element={<Review />} />
          <Route path="/reviews/new" element={<ReviewCreate />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
          <Route path="/reviews/:id/edit" element={<ReviewEdit />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/:tab" element={<MyPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/visitors" element={<Admin />} />
          <Route path="/admin/company" element={<Admin />} />
          <Route path="/admin/review" element={<Admin />} />
          <Route path="/admin/notice" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <button className="theme-float-btn" onClick={toggleTheme} aria-label="테마 변경">
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
