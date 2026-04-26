import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import Layout from './components/layout/Layout';

// Pages
import Home          from './pages/Home';
import Login         from './pages/auth/Login';
import Register      from './pages/auth/Register';
import OAuth2Redirect from './pages/auth/OAuth2Redirect';
import Feed          from './pages/Feed';
import PostDetail    from './pages/post/PostDetail';
import CreatePost    from './pages/post/CreatePost';
import Search        from './pages/Search';
import Profile       from './pages/user/Profile';
import EditProfile   from './pages/user/EditProfile';
import Followers     from './pages/user/Followers';
import Following     from './pages/user/Following';
import Suggestions   from './pages/user/Suggestions';
import Notifications from './pages/Notifications';
import HashtagFeed   from './pages/HashtagFeed';
import Stories       from './pages/Stories';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminPosts     from './pages/admin/AdminPosts';
import NotFound       from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public routes — no layout */}
            <Route path="/login"           element={<Login />} />
            <Route path="/register"        element={<Register />} />
            {/* OAuth2 success handler: backend redirects here with ?token=&userId= */}
            <Route path="/oauth2/redirect"  element={<OAuth2Redirect />} />

            {/* Routes with navbar layout */}
            <Route element={<Layout />}>
              <Route path="/"              element={<Home />} />
              <Route path="/search"        element={<Search />} />
              {/* FIX: was /hashtags/${tag.tag} (JS template literal) — must be route param :tag */}
              <Route path="/hashtags/:tag" element={<HashtagFeed />} />
              <Route path="/posts/:id"     element={<PostDetail />} />
              <Route path="/profile/:id"   element={<Profile />} />

              {/* Protected routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/feed"                     element={<Feed />} />
                <Route path="/posts/create"             element={<CreatePost />} />
                <Route path="/edit-profile"             element={<EditProfile />} />
                <Route path="/profile/:id/followers"    element={<Followers />} />
                <Route path="/profile/:id/following"    element={<Following />} />
                <Route path="/suggestions"              element={<Suggestions />} />
                <Route path="/notifications"            element={<Notifications />} />
                <Route path="/stories"                  element={<Stories />} />
              </Route>

              {/* Admin routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin"        element={<AdminDashboard />} />
                <Route path="/admin/users"  element={<AdminUsers />} />
                <Route path="/admin/posts"  element={<AdminPosts />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}