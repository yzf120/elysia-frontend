import { AdminAuth } from '/components/AdminAuth.js';
import { StudentAuth } from '/components/StudentAuth.js';
import { TeacherAuth } from '/components/TeacherAuth.js';

console.log('main.js 加载成功');

// 获取URL参数
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// 角色选择页面
function renderRoleSelector() {
  console.log('渲染角色选择页面');
  const root = document.getElementById('root');
  
  if (!root) {
    console.error('找不到 root 元素');
    return;
  }
  
  root.innerHTML = `
    <div class="auth-container">
      <div class="auth-header">
        <h1>🎓 Elysia 教育平台</h1>
        <p>请选择您的身份</p>
      </div>
      
      <div class="role-selector">
        <button class="role-btn" data-role="admin">
          <div style="font-size: 48px; margin-bottom: 12px;">👨‍💼</div>
          <div style="font-size: 18px; font-weight: 600;">管理员</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 8px;">Admin</div>
        </button>
        <button class="role-btn" data-role="teacher">
          <div style="font-size: 48px; margin-bottom: 12px;">👨‍🏫</div>
          <div style="font-size: 18px; font-weight: 600;">教师</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 8px;">Teacher</div>
        </button>
        <button class="role-btn" data-role="student">
          <div style="font-size: 48px; margin-bottom: 12px;">👨‍🎓</div>
          <div style="font-size: 18px; font-weight: 600;">学生</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 8px;">Student</div>
        </button>
      </div>
    </div>
  `;

  // 添加角色选择事件
  root.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const role = e.currentTarget.dataset.role;
      console.log('选择角色:', role);
      window.location.href = `?role=${role}`;
    });
  });
  
  console.log('角色选择页面渲染完成');
}

// 根据角色渲染对应的登录页面
function renderAuthPage(role) {
  console.log('渲染登录页面，角色:', role);
  const root = document.getElementById('root');
  
  if (!root) {
    console.error('找不到 root 元素');
    return;
  }
  
  let authComponent;
  try {
    switch (role) {
      case 'admin':
        console.log('创建管理员登录组件');
        authComponent = new AdminAuth(root);
        break;
      case 'teacher':
        console.log('创建教师登录组件');
        authComponent = new TeacherAuth(root);
        break;
      case 'student':
        console.log('创建学生登录组件');
        authComponent = new StudentAuth(root);
        break;
      default:
        console.log('未知角色，显示角色选择页面');
        renderRoleSelector();
        return;
    }

    // 添加返回按钮
    const container = root.querySelector('.auth-container');
    if (container) {
      const backBtn = document.createElement('div');
      backBtn.style.cssText = 'text-align: center; padding: 20px; cursor: pointer; color: #667eea; font-size: 14px;';
      backBtn.innerHTML = '← 返回选择身份';
      backBtn.addEventListener('click', () => {
        window.location.href = '/';
      });
      container.appendChild(backBtn);
    }
    
    console.log('登录页面渲染完成');
  } catch (error) {
    console.error('渲染登录页面失败:', error);
  }
}

// 初始化应用
function init() {
  console.log('初始化应用');
  const role = getQueryParam('role');
  console.log('当前角色参数:', role);
  
  if (role) {
    renderAuthPage(role);
  } else {
    renderRoleSelector();
  }
}

// 等待 DOM 加载完成后启动应用
if (document.readyState === 'loading') {
  console.log('等待 DOM 加载...');
  document.addEventListener('DOMContentLoaded', init);
} else {
  console.log('DOM 已加载，直接启动');
  init();
}

