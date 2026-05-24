import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import AssetDetail from './pages/AssetDetail';
import TickerAnalysis from './pages/TickerAnalysis';
import Markets from './pages/Markets';
import CryptoMarkets from './pages/CryptoMarkets';
import GlobalMacro from './pages/GlobalMacro';

import Community from './pages/Community';
import TopicDetail from './pages/TopicDetail';
import DailyNews from './pages/DailyNews';
import MacroDeepDive from './pages/MacroDeepDive';
import MacroRegionDetail from './pages/MacroRegionDetail';
import RiskReport from './pages/RiskReport';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
 return (
 <>
 <Routes>
 <Route path="/login"element={<Login />} />
 <Route path="/register"element={<Register />} />
 <Route path="/*"element={
 <ProtectedRoute>
 <DashboardLayout>
 <Routes>
 <Route path="/"element={<Dashboard />} />
 <Route path="/asset/:ticker"element={<AssetDetail />} />
 <Route path="/ticker/:ticker"element={<TickerAnalysis />} />
 <Route path="/markets"element={<Markets />} />
 <Route path="/crypto"element={<CryptoMarkets />} />
 <Route path="/global-macro"element={<GlobalMacro />} />

 <Route path="/community"element={<Community />} />
 <Route path="/community/topic/:id"element={<TopicDetail />} />
 <Route path="/daily-news"element={<DailyNews />} />
 <Route path="/macro-deep-dive"element={<MacroDeepDive />} />
 <Route path="/analysis/:ticker"element={<AssetDetail />} />
 <Route path="/macro-analysis/:region"element={<MacroRegionDetail />} />
 <Route path="/risk-report"element={<RiskReport />} />
 <Route path="/settings"element={<Settings />} />
 <Route path="/admin"element={<Admin />} />
 </Routes>
 </DashboardLayout>
 </ProtectedRoute>
 } />
 </Routes>
 </>
 );
}

export default App;
