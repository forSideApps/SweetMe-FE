import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import RoomBrowse from './pages/RoomBrowse'
import RoomList from './pages/RoomList'
import RoomCreate from './pages/RoomCreate'
import RoomDetail from './pages/RoomDetail'
import ManageLogin from './pages/ManageLogin'
import ManageDashboard from './pages/ManageDashboard'
import Community from './pages/Community'
import CommunityCreate from './pages/CommunityCreate'
import CommunityDetail from './pages/CommunityDetail'
import Review from './pages/Review'
import ReviewCreate from './pages/ReviewCreate'
import ReviewDetail from './pages/ReviewDetail'
import ReviewEdit from './pages/ReviewEdit'
import Admin from './pages/Admin'

function AppInner() {
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
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
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
