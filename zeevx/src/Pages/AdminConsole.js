import React, { useState, useEffect } from 'react';
import axios from '../Utils/axios';
import { useNavigate } from 'react-router-dom';
import '../Css/AdminConsole.css';

const AdminConsole = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');
  const [contentQueue, setContentQueue] = useState([]);
  const [kycQueue, setKycQueue] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [wallets, setWallets] = useState([]);
  
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      switch(activeTab) {
        case 'content':
          const content = await axios.get('/admin/content/review');
          setContentQueue(content.data.items);
          break;
        case 'kyc':
          const kyc = await axios.get('/admin/kyc');
          setKycQueue(kyc.data.items);
          break;
        case 'audit':
          const audit = await axios.get('/admin/audit');
          setAuditLogs(audit.data.logs);
          break;
        case 'finance':
          const finance = await axios.get('/admin/wallets');
          setWallets(finance.data.wallets);
          break;
      }
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/');
      }
    }
  };

  const handleContentAction = async (id, action) => {
    try {
      await axios.post(`/admin/content/${id}/${action}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleKycAction = async (id, action) => {
    try {
      await axios.post(`/admin/kyc/${id}/${action}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserAction = async (id, action) => {
    try {
      await axios.post(`/admin/user/${id}/${action}`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async (type) => {
    try {
      window.open(`/admin/export/${type}`, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-console">
      <div className="admin-header">
        <h1>Admin Console</h1>
        <div className="admin-tabs">
          <button 
            className={activeTab === 'content' ? 'active' : ''} 
            onClick={() => setActiveTab('content')}
          >
            Content Review
          </button>
          <button 
            className={activeTab === 'kyc' ? 'active' : ''} 
            onClick={() => setActiveTab('kyc')}
          >
            KYC Review
          </button>
          <button 
            className={activeTab === 'audit' ? 'active' : ''} 
            onClick={() => setActiveTab('audit')}
          >
            Audit Logs
          </button>
          <button 
            className={activeTab === 'finance' ? 'active' : ''} 
            onClick={() => setActiveTab('finance')}
          >
            Financial
          </button>
        </div>
      </div>

      <div className="admin-content">
        {activeTab === 'content' && (
          <div className="content-queue">
            <h2>Content Review Queue</h2>
            {contentQueue.map(item => (
              <div key={item._id} className="review-item">
                <div className="item-info">
                  <h3>{item.title}</h3>
                  <p>By: {item.user.displayName}</p>
                  <p>Status: {item.status}</p>
                </div>
                <div className="item-actions">
                  <button onClick={() => handleContentAction(item._id, 'approve')}>
                    Approve
                  </button>
                  <button onClick={() => handleContentAction(item._id, 'reject')}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="kyc-queue">
            <h2>KYC Review Queue</h2>
            {kycQueue.map(item => (
              <div key={item._id} className="review-item">
                <div className="item-info">
                  <h3>{item.user.displayName}</h3>
                  <p>Email: {item.user.email}</p>
                  <p>Status: {item.status}</p>
                </div>
                <div className="item-actions">
                  <button onClick={() => handleKycAction(item._id, 'approve')}>
                    Approve
                  </button>
                  <button onClick={() => handleKycAction(item._id, 'reject')}>
                    Reject
                  </button>
                  <button onClick={() => handleUserAction(item.user._id, item.user.isBlacklisted ? 'unban' : 'ban')}>
                    {item.user.isBlacklisted ? 'Unban' : 'Ban'} User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="audit-logs">
            <h2>
              Audit Logs
              <button onClick={() => handleExport('audit')} className="export-button">
                Export
              </button>
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log._id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.action}</td>
                    <td>{log.actor}</td>
                    <td>{log.target}</td>
                    <td>{JSON.stringify(log.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="finance">
            <h2>Financial Overview</h2>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Balance</th>
                  <th>Total Earned</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map(wallet => (
                  <tr key={wallet._id}>
                    <td>{wallet.user.displayName}</td>
                    <td>{wallet.balance}</td>
                    <td>{wallet.totalEarned}</td>
                    <td>{wallet.totalSpent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConsole;